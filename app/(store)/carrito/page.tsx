'use client'
import { useCart } from '@/src/context/CartContext'
import { site } from '@/lib/site'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function CartPage() {
  const { items, removeFromCart, clearCart, updateQuantity, hydrated } = useCart()

  const [customer, setCustomer] = useState({ customerName: '', phone: '', email: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  // FUNCIÓN PARA ENVIAR EL PEDIDO A WHATSAPP (opción manual alternativa)
  const handleWhatsappCheckout = () => {
    const telefono = site.phoneWhatsapp

    const listaProductos = items.map(item =>
      `- ${item.name} (x${item.quantity}): $${(item.price * item.quantity).toLocaleString('es-CO')}`
    ).join('\n')

    const mensaje = `¡Hola! Quisiera realizar el siguiente pedido en ${site.name}:\n\n${listaProductos}\n\n*TOTAL A PAGAR: $${total.toLocaleString('es-CO')}*`

    // BUG corregido: antes el texto no se codificaba; un nombre con "&" o "#" cortaba el mensaje.
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer')
  }

  const handlePayCheckout = async () => {
    setCheckoutError(null)
    if (!customer.customerName.trim() || !customer.phone.trim() || !customer.email.trim() || !customer.address.trim()) {
      setCheckoutError('Completa todos los datos de contacto y entrega.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customer,
          items: items.map(item => ({ productId: item.id, quantity: item.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCheckoutError(data.error ?? 'No se pudo procesar el pedido')
        setSubmitting(false)
        return
      }
      // El carrito NO se vacía aquí: si el pago falla, el cliente conserva sus productos.
      // Se vacía en /pedido/<referencia> cuando Wompi confirma el pago.
      window.location.href = data.paymentUrl
    } catch {
      setCheckoutError('Error de conexión. Intenta de nuevo.')
      setSubmitting(false)
    }
    // Si todo salió bien se mantiene "Procesando..." mientras redirige a Wompi (evita doble clic)
  }

  if (!hydrated) return <div className="text-center py-20 uppercase font-black">Cargando...</div>

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-gray-900 dark:text-white">Tu carrito está vacío</h1>
        <p className="text-gray-400 dark:text-neutral-500 mb-10">Parece que aún no has elegido tus herramientas profesionales.</p>
        <Link href="/" className="bg-orange-600 hover:bg-orange-500 text-black px-10 py-4 rounded-xl font-black inline-block uppercase transition-all shadow-lg shadow-orange-900/40">
          Volver a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 uppercase border-l-4 border-orange-500 pl-4 tracking-tighter text-gray-900 dark:text-white">
        Tu <span className="text-orange-500">Carrito</span>
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        {/* LISTADO DE PRODUCTOS EN EL CARRITO */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-4 md:p-6 rounded-2xl flex items-center gap-4 md:gap-6 group hover:border-gray-300 dark:hover:border-neutral-700 transition-all shadow-sm dark:shadow-none">
              <div className="relative h-20 w-20 md:h-24 md:w-24 bg-gray-100 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
                <Image 
                  src={item.image || 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=200'} 
                  alt={item.name} 
                  fill 
                  className="object-contain p-2 group-hover:scale-110 transition-transform" 
                />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-bold uppercase text-sm md:text-base leading-tight text-gray-900 dark:text-neutral-100 truncate">{item.name}</h3>
                <p className="text-orange-500 font-black text-base md:text-lg mt-1">
                  ${item.price.toLocaleString('es-CO')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 font-black hover:bg-gray-200 dark:hover:bg-neutral-700"
                    aria-label="Quitar una unidad"
                  >−</button>
                  <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 font-black hover:bg-gray-200 dark:hover:bg-neutral-700"
                    aria-label="Agregar una unidad"
                  >+</button>
                </div>
              </div>
              <button 
                onClick={() => removeFromCart(item.id)} 
                className="text-gray-300 dark:text-neutral-600 hover:text-red-500 transition-colors p-2 shrink-0"
                title="Eliminar producto"
              >
                <span className="text-xl md:text-2xl">✕</span>
              </button>
            </div>
          ))}
          
          <div className="pt-4">
            <button onClick={clearCart} className="text-xs text-gray-400 dark:text-neutral-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors">
              🗑️ Vaciar todo el carrito
            </button>
          </div>
        </div>

        {/* PANEL DE RESUMEN Y FINALIZACIÓN */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-6 md:p-8 rounded-3xl h-fit lg:sticky lg:top-24 shadow-md dark:shadow-none">
          <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 uppercase tracking-tighter text-gray-900 dark:text-white">Resumen de compra</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-gray-500 dark:text-neutral-400">
              <span>Productos ({items.reduce((a, i) => a + i.quantity, 0)})</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-neutral-400">
              <span>Envío</span>
              <span className="text-green-500 font-bold italic">Gratis</span>
            </div>
          </div>

          <div className="flex justify-between mb-6 text-2xl font-black text-gray-900 dark:text-white border-t border-gray-200 dark:border-neutral-800 pt-6">
            <span>TOTAL</span>
            <span className="text-orange-500">${total.toLocaleString('es-CO')}</span>
          </div>

          <div className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Nombre completo"
              value={customer.customerName}
              onChange={e => setCustomer({ ...customer, customerName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={customer.phone}
              onChange={e => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white"
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={customer.email}
              onChange={e => setCustomer({ ...customer, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white"
            />
            <textarea
              placeholder="Dirección de entrega (incluye barrio y ciudad)"
              value={customer.address}
              onChange={e => setCustomer({ ...customer, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white resize-none"
              rows={2}
            />
          </div>

          {checkoutError && (
            <p className="text-red-500 text-sm mb-4 font-bold">{checkoutError}</p>
          )}

          <button
            onClick={handlePayCheckout}
            disabled={submitting}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-black font-black py-4 md:py-5 rounded-2xl transition-all transform active:scale-95 shadow-lg shadow-orange-900/50 uppercase flex items-center justify-center gap-3"
          >
            {submitting ? 'Procesando...' : 'Pagar pedido 💳'}
          </button>

          <button
            onClick={handleWhatsappCheckout}
            className="w-full mt-3 bg-transparent border border-gray-200 dark:border-neutral-700 hover:border-orange-500 text-gray-600 dark:text-neutral-300 font-bold py-3 rounded-2xl transition-all uppercase text-xs flex items-center justify-center gap-2"
          >
            O finalizar por WhatsApp 📲
          </button>

          <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-6 text-center uppercase tracking-widest">
            Pago seguro con Wompi (PSE, Nequi, tarjetas). El total final se confirma en el servidor.
          </p>
        </div>
      </div>
    </div>
  )
}