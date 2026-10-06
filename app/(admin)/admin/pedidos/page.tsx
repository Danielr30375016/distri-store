'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type Status = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'

interface Order {
  id: number
  reference: string
  status: Status
  customerName: string
  phone: string
  email: string
  address: string
  total: number
  paymentMethod: string | null
  wompiReference: string | null
  createdAt: string
  items: { id: number; name: string; price: number; quantity: number }[]
}

const STATUS_UI: Record<Status, { label: string; cls: string }> = {
  PENDING: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
  PAID: { label: 'Pagado', cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  FAILED: { label: 'Rechazado', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400' },
}

const cop = (n: number) => `$${n.toLocaleString('es-CO')}`

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'' | Status>('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ page: String(page), ...(status ? { status } : {}) })
      const res = await fetch(`/api/admin/orders?${qs}`, { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setError('No se pudieron cargar los pedidos')
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    load()
  }, [load])

  async function cancel(o: Order) {
    if (!confirm(`¿Cancelar el pedido ${o.reference}? Se devolverá el stock.`)) return
    const res = await fetch(`/api/admin/orders/${o.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    if (!res.ok) setError((await res.json()).error ?? 'No se pudo cancelar')
    load()
  }

  const pages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-neutral-950 text-gray-900 dark:text-white">
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter">
          DISTRI<span className="text-orange-500">STORE</span>
          <span className="text-gray-400 dark:text-neutral-500 font-medium text-sm ml-2">/ Pedidos</span>
        </h1>
        <Link href="/admin" className="text-sm font-bold text-orange-500 hover:underline">← Productos</Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {(['', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'] as const).map(s => (
            <button
              key={s || 'all'}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${
                status === s ? 'bg-orange-600 text-black' : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800'
              }`}
            >
              {s ? STATUS_UI[s].label : 'Todos'}
            </button>
          ))}
          <button onClick={load} className="ml-auto px-4 py-2 rounded-xl text-xs font-bold uppercase bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            ↻ Actualizar
          </button>
        </div>

        {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

        {loading ? (
          <p className="text-center py-16 text-gray-400">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-16 text-gray-400">No hay pedidos.</p>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl">
                <button onClick={() => setOpen(open === o.id ? null : o.id)} className="w-full text-left p-4 flex flex-wrap items-center gap-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase ${STATUS_UI[o.status].cls}`}>
                    {STATUS_UI[o.status].label}
                  </span>
                  <span className="font-mono text-xs text-gray-500 dark:text-neutral-400">{o.reference}</span>
                  <span className="font-bold">{o.customerName}</span>
                  <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString('es-CO')}</span>
                  <span className="ml-auto font-black text-orange-500">{cop(o.total)}</span>
                </button>
                {open === o.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-neutral-800 pt-4 grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-1">
                      <p><b>Teléfono:</b> {o.phone}</p>
                      <p><b>Email:</b> {o.email}</p>
                      <p><b>Dirección:</b> {o.address}</p>
                      <p><b>Método de pago:</b> {o.paymentMethod ?? '—'}</p>
                      <p><b>Transacción Wompi:</b> <span className="font-mono text-xs">{o.wompiReference ?? '—'}</span></p>
                      <a
                        href={`https://wa.me/${o.phone.replace(/\D/g, '').replace(/^(?!57)(\d{10})$/, '57$1')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-green-600 font-bold hover:underline"
                      >
                        Escribir por WhatsApp
                      </a>
                    </div>
                    <div>
                      {o.items.map(i => (
                        <div key={i.id} className="flex justify-between py-1">
                          <span>{i.name} x{i.quantity}</span>
                          <span>{cop(i.price * i.quantity)}</span>
                        </div>
                      ))}
                      {o.status === 'PENDING' && (
                        <button onClick={() => cancel(o)} className="mt-4 text-xs font-bold uppercase text-red-500 hover:underline">
                          Cancelar pedido y devolver stock
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 text-sm">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="font-bold disabled:opacity-30">← Anterior</button>
            <span>{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="font-bold disabled:opacity-30">Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  )
}
