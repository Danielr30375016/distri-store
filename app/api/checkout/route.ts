import { NextResponse } from 'next/server'
import { checkoutSchema, firstZodError } from '../../../lib/validation'
import { createOrder, CheckoutError, expireStaleOrders, ORDER_PAYMENT_WINDOW_MINUTES } from '../../../lib/orders'
import { buildWompiCheckoutUrl } from '../../../lib/wompi'
import { sendOrderConfirmation } from '../../../lib/email'
import { getClientIp } from '../../../lib/auth'
import { rateLimit } from '../../../lib/rateLimit'

export async function POST(request: Request) {
  // Evita que un bot cree pedidos en masa para "secuestrar" todo el inventario.
  const limit = rateLimit(`checkout:${getClientIp(request)}`, 8, 10 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const wompiReady = Boolean(siteUrl && process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_SECRET)
  if (!wompiReady) {
    // Antes se creaba el pedido (reservando stock) aunque no se pudiera pagar.
    console.error('[checkout] Falta NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_WOMPI_PUBLIC_KEY / WOMPI_INTEGRITY_SECRET')
    return NextResponse.json(
      { error: 'Los pagos en línea no están disponibles en este momento. Puedes finalizar por WhatsApp.' },
      { status: 503 }
    )
  }

  try {
    // Libera el stock de pedidos abandonados antes de validar disponibilidad
    await expireStaleOrders().catch(err => console.error('[checkout] Error expirando pedidos:', err))

    const order = await createOrder(parsed.data)

    sendOrderConfirmation(order).catch(err =>
      console.error('[checkout] Error enviando email de confirmación:', err)
    )

    const expirationTime = new Date(Date.now() + ORDER_PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString()
    const paymentUrl = await buildWompiCheckoutUrl({
      reference: order.reference,
      amountInCents: order.total * 100,
      redirectUrl: `${siteUrl}/pedido/${order.reference}`,
      expirationTime,
      customerEmail: order.email,
      customerName: order.customerName,
      customerPhone: order.phone,
      address: order.address,
    })

    return NextResponse.json({ reference: order.reference, total: order.total, paymentUrl }, { status: 201 })
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[checkout] Error creando el pedido:', err)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }
}
