import { NextResponse } from 'next/server'
import { checkoutSchema, firstZodError } from '../../../lib/validation'
import { createOrder, CheckoutError } from '../../../lib/orders'
import { buildWompiCheckoutUrl } from '../../../lib/wompi'
import { sendOrderConfirmation } from '../../../lib/email'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }

  try {
    const order = await createOrder(parsed.data)

    sendOrderConfirmation(order).catch(err =>
      console.error('[checkout] Error enviando email de confirmación:', err)
    )

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    let paymentUrl: string | null = null
    if (siteUrl && process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY) {
      try {
        paymentUrl = await buildWompiCheckoutUrl({
          orderId: order.id,
          amountInCents: order.total * 100,
          redirectUrl: `${siteUrl}/pedido/${order.id}`,
          customerEmail: order.email,
        })
      } catch (err) {
        console.error('[checkout] Wompi no está configurado todavía:', err)
      }
    }

    return NextResponse.json({ orderId: order.id, total: order.total, paymentUrl }, { status: 201 })
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[checkout] Error creando el pedido:', err)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }
}
