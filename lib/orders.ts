import { prisma } from './db'
import { Prisma } from '@prisma/client'
import type { WompiTransaction } from './wompi'

/** Minutos que un pedido puede esperar el pago antes de expirar y liberar el stock. */
export const ORDER_PAYMENT_WINDOW_MINUTES = 60

export interface CheckoutInput {
  customerName: string
  phone: string
  email: string
  address: string
  items: { productId: number; quantity: number }[]
}

export class CheckoutError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message)
  }
}

/** Referencia aleatoria de 96 bits: única para Wompi y no adivinable para la URL pública. */
export function generateOrderReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `DS-${hex.toUpperCase()}`
}

/**
 * Crea un pedido recalculando precios y validando stock contra la base de datos.
 * Nunca confía en precios/totales enviados por el cliente.
 * El stock queda RESERVADO; se devuelve si el pago falla o el pedido expira.
 */
export async function createOrder(input: CheckoutInput) {
  // Unir productos repetidos ([{id:1,q:2},{id:1,q:3}] -> {id:1,q:5})
  const merged = new Map<number, number>()
  for (const item of input.items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity)
  }

  const products = await prisma.product.findMany({ where: { id: { in: [...merged.keys()] } } })
  const productById = new Map(products.map(p => [p.id, p]))

  let total = 0
  const orderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = []

  for (const [productId, quantity] of merged) {
    const product = productById.get(productId)
    if (!product) {
      throw new CheckoutError(`Un producto de tu carrito ya no existe. Actualiza el carrito.`, 400)
    }
    if (!product.stock || product.quantity < quantity) {
      throw new CheckoutError(
        product.quantity > 0
          ? `Solo quedan ${product.quantity} unidades de "${product.name}"`
          : `"${product.name}" está agotado`,
        409
      )
    }
    const unitPrice = product.discount
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price
    total += unitPrice * quantity
    orderItemsData.push({ productId: product.id, name: product.name, price: unitPrice, quantity })
  }

  if (total <= 0) throw new CheckoutError('El total del pedido no es válido', 400)

  return prisma.$transaction(async tx => {
    // Descuento ATÓMICO y condicionado: si dos clientes compran la última unidad a la vez,
    // solo uno lo logra (antes se podía sobrevender y dejar cantidades negativas).
    for (const [productId, quantity] of merged) {
      const res = await tx.product.updateMany({
        where: { id: productId, stock: true, quantity: { gte: quantity } },
        data: { quantity: { decrement: quantity } },
      })
      if (res.count === 0) {
        const name = productById.get(productId)?.name ?? productId
        throw new CheckoutError(`No hay suficiente stock de "${name}"`, 409)
      }
    }

    return tx.order.create({
      data: {
        reference: generateOrderReference(),
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        address: input.address,
        total,
        items: { create: orderItemsData },
      },
      include: { items: true },
    })
  })
}

/** Devuelve al inventario el stock reservado por un pedido (una sola vez). */
async function releaseStock(orderId: number) {
  await prisma.$transaction(async tx => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, stockReleased: false },
      data: { stockReleased: true },
    })
    if (claimed.count === 0) return
    const items = await tx.orderItem.findMany({ where: { orderId } })
    for (const item of items) {
      // updateMany no falla si el producto fue eliminado
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      })
    }
  })
}

/** Vuelve a reservar el stock (caso raro: llega un pago aprobado de un pedido ya liberado). */
async function reReserveStock(orderId: number) {
  await prisma.$transaction(async tx => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, stockReleased: true },
      data: { stockReleased: false },
    })
    if (claimed.count === 0) return
    const items = await tx.orderItem.findMany({ where: { orderId } })
    for (const item of items) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      })
      // Nunca dejar cantidades negativas
      await tx.product.updateMany({ where: { id: item.productId, quantity: { lt: 0 } }, data: { quantity: 0 } })
    }
  })
}

type AppStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'

function mapWompiStatus(status: WompiTransaction['status']): AppStatus {
  switch (status) {
    case 'APPROVED':
      return 'PAID'
    case 'DECLINED':
    case 'ERROR':
      return 'FAILED'
    case 'VOIDED':
      return 'CANCELLED'
    default:
      return 'PENDING'
  }
}

/**
 * Aplica una transacción de Wompi al pedido. Es IDEMPOTENTE: el webhook puede llegar
 * varias veces (reintentos) o en desorden, y también se llama desde la página del pedido.
 * Devuelve `becamePaid: true` solo la primera vez que el pedido pasa a PAID (para emails).
 */
export async function applyWompiTransaction(tx: WompiTransaction) {
  const order = await prisma.order.findUnique({ where: { reference: tx.reference } })
  if (!order) {
    console.warn('[wompi] Pedido no encontrado para la referencia', tx.reference)
    return { order: null, becamePaid: false }
  }

  const target = mapWompiStatus(tx.status)
  const base = { wompiReference: tx.id, paymentMethod: tx.payment_method_type ?? null }

  if (order.status === target || target === 'PENDING') {
    if (!order.wompiReference) {
      await prisma.order.update({ where: { id: order.id }, data: base }).catch(() => {})
    }
    return { order, becamePaid: false }
  }

  // Un pedido pagado nunca retrocede de estado
  if (order.status === 'PAID') {
    console.warn(`[wompi] Ignorado cambio PAID -> ${target} en ${order.reference}`)
    return { order, becamePaid: false }
  }

  if (target === 'PAID') {
    // El monto cobrado debe coincidir EXACTAMENTE con el calculado en el servidor
    if (tx.amount_in_cents !== order.total * 100 || tx.currency !== 'COP') {
      console.error(
        `[wompi] MONTO NO COINCIDE en ${order.reference}: esperado ${order.total * 100} COP, ` +
          `recibido ${tx.amount_in_cents} ${tx.currency}. Revisar manualmente.`
      )
      return { order, becamePaid: false }
    }
    // Actualización condicionada al estado leído: si dos procesos llegan a la vez, solo uno gana
    const res = await prisma.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { ...base, status: 'PAID' },
    })
    if (res.count === 0) return { order, becamePaid: false }
    if (order.stockReleased) await reReserveStock(order.id)
    return { order: { ...order, ...base, status: 'PAID' as const }, becamePaid: true }
  }

  // FAILED / CANCELLED: solo desde PENDING
  if (order.status !== 'PENDING') return { order, becamePaid: false }
  const res = await prisma.order.updateMany({
    where: { id: order.id, status: 'PENDING' },
    data: { ...base, status: target },
  })
  if (res.count > 0) await releaseStock(order.id)
  return { order: { ...order, status: target }, becamePaid: false }
}

/**
 * Cancela pedidos PENDING que superaron la ventana de pago y libera su stock.
 * Se ejecuta de forma oportunista en cada checkout (no necesita cron).
 * El checkout de Wompi expira a los ORDER_PAYMENT_WINDOW_MINUTES; se dan 10 min extra
 * de margen para que lleguen los webhooks rezagados.
 */
export async function expireStaleOrders() {
  const cutoff = new Date(Date.now() - (ORDER_PAYMENT_WINDOW_MINUTES + 10) * 60 * 1000)
  const stale = await prisma.order.findMany({
    where: { status: 'PENDING', createdAt: { lt: cutoff } },
    select: { id: true },
    take: 50,
  })
  for (const { id } of stale) {
    const res = await prisma.order.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'CANCELLED' } })
    if (res.count > 0) await releaseStock(id)
  }
}

export async function getOrderById(id: number) {
  return prisma.order.findUnique({ where: { id }, include: { items: true } })
}

export async function getOrderByReference(reference: string) {
  if (!/^DS-[\w-]{6,60}$/.test(reference)) return null
  return prisma.order.findUnique({ where: { reference }, include: { items: true } })
}

/** Cancelación manual desde el admin (solo pedidos PENDING). Libera el stock reservado. */
export async function cancelPendingOrder(id: number): Promise<boolean> {
  const res = await prisma.order.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'CANCELLED' } })
  if (res.count > 0) await releaseStock(id)
  return res.count > 0
}

export async function listOrders(opts: { status?: string; page: number; pageSize: number }) {
  const where = opts.status ? { status: opts.status as AppStatus } : {}
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.order.count({ where }),
  ])
  return { orders, total }
}
