import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth'
import { cancelPendingOrder } from '../../../../../lib/orders'
import { parseId } from '../../../../../lib/validation'

/** PATCH { action: 'cancel' } — cancela un pedido pendiente y devuelve el stock. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body = await request.json().catch(() => null)
  if (body?.action !== 'cancel') {
    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 })
  }
  const ok = await cancelPendingOrder(id)
  if (!ok) return NextResponse.json({ error: 'Solo se pueden cancelar pedidos pendientes' }, { status: 409 })
  return NextResponse.json({ success: true })
}
