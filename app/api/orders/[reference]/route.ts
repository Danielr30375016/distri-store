import { NextResponse } from 'next/server'
import { applyWompiTransaction, getOrderByReference } from '../../../../lib/orders'
import { fetchWompiTransaction } from '../../../../lib/wompi'
import { sendAdminOrderAlert, sendPaymentConfirmedEmail } from '../../../../lib/email'

/**
 * Estado público de un pedido. Se busca por la referencia aleatoria (DS-XXXX...),
 * no por el id numérico, para que no se puedan enumerar pedidos ajenos.
 *
 * Si llega `?tx=<id de transacción>` (Wompi lo agrega al redirigir como `?id=`),
 * se consulta la transacción DIRECTAMENTE a la API de Wompi y se sincroniza el pedido.
 * Así el cliente ve "Pago confirmado" aunque el webhook tarde en llegar.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params
  let order = await getOrderByReference(reference)
  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  const txId = new URL(request.url).searchParams.get('tx')
  if (txId && order.status === 'PENDING') {
    const tx = await fetchWompiTransaction(txId)
    if (tx && tx.reference === order.reference) {
      const { becamePaid } = await applyWompiTransaction(tx)
      order = (await getOrderByReference(reference)) ?? order
      if (becamePaid) {
        sendPaymentConfirmedEmail(order).catch(err => console.error('[orders] email cliente:', err))
        sendAdminOrderAlert(order).catch(err => console.error('[orders] email admin:', err))
      }
    }
  }

  return NextResponse.json(
    {
      reference: order.reference,
      status: order.status,
      total: order.total,
      customerName: order.customerName.split(' ')[0], // solo el primer nombre
      createdAt: order.createdAt,
      items: order.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
