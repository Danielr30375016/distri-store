import { NextResponse } from 'next/server'
import { verifyWompiEventSignature } from '../../../../lib/wompi'
import { markOrderPaid, markOrderFailed, getOrderById } from '../../../../lib/orders'
import { sendPaymentConfirmedEmail, sendAdminOrderAlert } from '../../../../lib/email'

interface WompiEvent {
  event: string
  data: {
    transaction: {
      id: string
      status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'
      reference: string
      amount_in_cents: number
    }
  }
  signature: {
    properties: string[]
    checksum: string
  }
  timestamp: number
}

function getProp(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as WompiEvent | null
  if (!body?.signature || !body.data?.transaction) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const values = body.signature.properties.map(prop => String(getProp(body, prop) ?? ''))
  const isValid = await verifyWompiEventSignature(values, body.timestamp, body.signature.checksum)
  if (!isValid) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const { transaction } = body.data
  const orderId = Number(transaction.reference)
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: 'Referencia inválida' }, { status: 400 })
  }

  if (transaction.status === 'APPROVED') {
    await markOrderPaid(orderId, transaction.id)
    const order = await getOrderById(orderId)
    if (order) {
      sendPaymentConfirmedEmail(order).catch(err => console.error('[webhook] email cliente:', err))
      sendAdminOrderAlert(order).catch(err => console.error('[webhook] email admin:', err))
    }
  } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR' || transaction.status === 'VOIDED') {
    await markOrderFailed(orderId, transaction.id)
  }

  return NextResponse.json({ received: true })
}
