import { NextResponse } from 'next/server'
import { getOrderById } from '../../../../lib/orders'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await getOrderById(Number(id))
  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }
  return NextResponse.json({
    id: order.id,
    status: order.status,
    total: order.total,
    customerName: order.customerName,
    items: order.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
  })
}
