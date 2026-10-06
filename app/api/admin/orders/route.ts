import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/auth'
import { expireStaleOrders, listOrders } from '../../../../lib/orders'

const STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELLED']

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const url = new URL(request.url)
  const status = url.searchParams.get('status') ?? ''
  const page = Math.max(1, Math.min(1000, Number(url.searchParams.get('page')) || 1))

  await expireStaleOrders().catch(err => console.error('[admin/orders] expirar:', err))
  const data = await listOrders({ status: STATUSES.includes(status) ? status : undefined, page, pageSize: 20 })
  return NextResponse.json({ ...data, page, pageSize: 20 })
}
