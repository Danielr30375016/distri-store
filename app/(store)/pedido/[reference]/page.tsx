'use client'
import { useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useCart } from '@/src/context/CartContext'

interface OrderView {
  reference: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'
  total: number
  customerName: string
  items: { name: string; price: number; quantity: number }[]
}

const statusLabel: Record<OrderView['status'], { text: string; color: string; help: string }> = {
  PENDING: {
    text: 'Pago pendiente',
    color: 'text-yellow-500',
    help: 'Estamos esperando la confirmación de Wompi. Si pagaste por PSE puede tardar unos minutos.',
  },
  PAID: { text: 'Pago confirmado', color: 'text-green-500', help: '¡Gracias! Ya estamos preparando tu pedido.' },
  FAILED: {
    text: 'Pago rechazado',
    color: 'text-red-500',
    help: 'El pago no se completó. Tus productos siguen en el carrito para que intentes de nuevo.',
  },
  CANCELLED: { text: 'Pedido cancelado', color: 'text-gray-500', help: 'Este pedido expiró o fue anulado.' },
}

function OrderStatus() {
  const { reference } = useParams<{ reference: string }>()
  const searchParams = useSearchParams()
  const txId = searchParams.get('id') // Wompi agrega ?id=<transacción> al redirigir
  const { clearCart } = useCart()
  const [order, setOrder] = useState<OrderView | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout>

    async function load() {
      try {
        const qs = txId ? `?tx=${encodeURIComponent(txId)}` : ''
        const res = await fetch(`/api/orders/${encodeURIComponent(reference)}${qs}`, { cache: 'no-store' })
        if (!res.ok) throw new Error()
        const data: OrderView = await res.json()
        if (cancelled) return
        setOrder(data)
        // Mientras siga pendiente, volver a consultar (máx. ~2 min)
        if (data.status === 'PENDING' && attempts++ < 24) timer = setTimeout(load, 5000)
      } catch {
        if (!cancelled) setError(true)
      }
    }
    load()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [reference, txId])

  // El carrito se vacía solo cuando el pago está confirmado (antes se vaciaba antes de pagar)
  useEffect(() => {
    if (order?.status === 'PAID') clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status])

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-black uppercase text-gray-900 dark:text-white">Pedido no encontrado</h1>
        <Link href="/" className="text-orange-500 font-bold uppercase mt-6 inline-block">Volver a la tienda</Link>
      </div>
    )
  }

  if (!order) return <div className="text-center py-20 uppercase font-black">Cargando...</div>

  const status = statusLabel[order.status]

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-8 shadow-md dark:shadow-none">
        <p className="text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Pedido</p>
        <h1 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white mb-2 break-all">
          {order.reference}
        </h1>
        <p className={`font-bold uppercase text-sm ${status.color}`}>{status.text}</p>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2 mb-8">{status.help}</p>

        <div className="space-y-3 mb-6">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-neutral-400">
              <span>{item.name} x{item.quantity}</span>
              <span>${(item.price * item.quantity).toLocaleString('es-CO')}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white border-t border-gray-200 dark:border-neutral-800 pt-4">
          <span>TOTAL</span>
          <span className="text-orange-500">${order.total.toLocaleString('es-CO')}</span>
        </div>

        <p className="text-xs text-gray-400 dark:text-neutral-500 mt-6">
          Guarda este enlace para consultar el estado de tu pedido.
        </p>

        <div className="flex gap-6 mt-6">
          <Link href="/" className="text-orange-500 font-bold uppercase text-xs hover:underline">← Volver a la tienda</Link>
          {order.status === 'FAILED' && (
            <Link href="/carrito" className="text-orange-500 font-bold uppercase text-xs hover:underline">Reintentar pago</Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OrderStatusPage() {
  // useSearchParams requiere un límite de Suspense en Next 15+
  return (
    <Suspense fallback={<div className="text-center py-20 uppercase font-black">Cargando...</div>}>
      <OrderStatus />
    </Suspense>
  )
}
