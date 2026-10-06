import { prisma } from './db'
import { Prisma } from '@prisma/client'

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

/**
 * Crea un pedido recalculando precios y validando stock contra la base de datos.
 * Nunca confía en precios/totales enviados por el cliente.
 */
export async function createOrder(input: CheckoutInput) {
  const productIds = input.items.map(i => i.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
  const productById = new Map(products.map(p => [p.id, p]))

  let total = 0
  const orderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = []

  for (const item of input.items) {
    const product = productById.get(item.productId)
    if (!product) {
      throw new CheckoutError(`El producto ${item.productId} ya no existe`, 400)
    }
    if (!product.stock || product.quantity < item.quantity) {
      throw new CheckoutError(`No hay suficiente stock de "${product.name}"`, 409)
    }
    const unitPrice = product.discount
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price
    total += unitPrice * item.quantity
    orderItemsData.push({
      productId: product.id,
      name: product.name,
      price: unitPrice,
      quantity: item.quantity,
    })
  }

  const order = await prisma.$transaction(async tx => {
    const created = await tx.order.create({
      data: {
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        address: input.address,
        total,
        items: { create: orderItemsData },
      },
      include: { items: true },
    })

    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      })
    }

    return created
  })

  return order
}

export async function markOrderPaid(orderId: number, wompiReference: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID', wompiReference },
  })
}

export async function markOrderFailed(orderId: number, wompiReference: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'FAILED', wompiReference },
  })
}

export async function getOrderById(id: number) {
  return prisma.order.findUnique({ where: { id }, include: { items: true } })
}
