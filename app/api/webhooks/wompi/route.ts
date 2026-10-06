import { NextResponse } from 'next/server'
import { verifyWompiEvent, type WompiTransaction } from '../../../../lib/wompi'
import { applyWompiTransaction, getOrderById } from '../../../../lib/orders'
import { sendPaymentConfirmedEmail, sendAdminOrderAlert } from '../../../../lib/email'

interface WompiEvent {
  event?: string
  data?: { transaction?: WompiTransaction }
  signature?: { properties?: string[]; checksum?: string }
  timestamp?: number
  environment?: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as WompiEvent | null
  if (!body?.signature || !body.data?.transaction) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  let isValid = false
  try {
    isValid = await verifyWompiEvent(body, request.headers.get('x-event-checksum'))
  } catch (err) {
    console.error('[webhook] Configuración incompleta:', err)
    return NextResponse.json({ error: 'No configurado' }, { status: 500 })
  }
  if (!isValid) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  if (body.event !== 'transaction.updated') {
    return NextResponse.json({ received: true, ignored: body.event })
  }

  try {
    const { order, becamePaid } = await applyWompiTransaction(body.data.transaction)

    // Emails solo la PRIMERA vez que el pedido pasa a pagado (Wompi reintenta webhooks)
    if (order && becamePaid) {
      const full = await getOrderById(order.id)
      if (full) {
        sendPaymentConfirmedEmail(full).catch(err => console.error('[webhook] email cliente:', err))
        sendAdminOrderAlert(full).catch(err => console.error('[webhook] email admin:', err))
      }
    }
  } catch (err) {
    console.error('[webhook] Error procesando evento:', err)
    // 500 => Wompi reintentará más tarde
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  // Siempre 200 si la firma es válida (aunque el pedido no exista), para que Wompi no reintente sin fin
  return NextResponse.json({ received: true })
}
