'use client'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface OrderView {
  id: number
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'
  total: number
  customerName: string
  items: { name: string; price: number; quantity: number }[]
}

const statusLabel: Record<OrderView['status'], { text: string; color: string }> = {
  PENDING: { text: 'Pago pendiente', color: 'text-yellow-500' },
  PAID: { text: 'Pago confirmado', color: 'text-green-500' },
  FAILED: { text: 'Pago rechazado', color: 'text-red-500' },
  CANCELLED: { text: 'Pedido cancelado', color: 'text-gray-500' },
}

export default function OrderStatusPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<OrderView | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(setOrder)
      .catch(() => setError(true))
  }, [id])

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
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white mb-2">
          Pedido #{order.id}
        </h1>
        <p className={`font-bold uppercase text-sm mb-8 ${status.color}`}>{status.text}</p>

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

        <Link href="/" className="text-orange-500 font-bold uppercase text-xs mt-8 inline-block hover:underline">
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
