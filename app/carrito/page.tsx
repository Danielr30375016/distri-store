'use client'
import { useState } from 'react' // Para las notas del cliente
import { useCart } from '../../src/context/CartContext'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const [customerNote, setCustomerNote] = useState('')

  const handleCheckout = () => {
    const phoneNumber = "573001234567" // Tu número real
    
    const productsList = items
      .map((item) => `- ${item.name} (x${item.quantity}): $${(item.price * item.quantity).toLocaleString()}`)
      .join("\n")

    const message = encodeURIComponent(
      `*NUEVO PEDIDO - DISTRISTORE* 🛠️\n\n` +
      `*Productos:*\n${productsList}\n\n` +
      `*Total: $${total.toLocaleString()}*\n\n` +
      (customerNote ? `*Nota del cliente:* ${customerNote}\n\n` : '') +
      `¿Me confirman para proceder con el pago?`
    )

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank")
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center text-4xl mb-6">📭</div>
        <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
        <p className="text-neutral-500 mb-8">Parece que aún no has agregado herramientas.</p>
        <Link href="/productos" className="bg-orange-600 text-black px-8 py-3 rounded-xl font-bold hover:bg-orange-500 transition">
          Ir a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-black mb-8 text-orange-500">MI CARRITO</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 flex items-center gap-4">
              <div className="relative h-20 w-20 bg-neutral-800 rounded-xl overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-2xl">🛠️</div>
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-orange-500">${item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center bg-neutral-950 rounded-lg p-1 border border-neutral-800">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 hover:text-orange-500">-</button>
                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 hover:text-orange-500">+</button>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-neutral-600 hover:text-red-500">🗑️</button>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
            <h2 className="font-bold mb-4">Notas del pedido</h2>
            <textarea 
              placeholder="Ej: Dirección de entrega o nombre..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm focus:border-orange-500 outline-none transition h-24 resize-none"
              onChange={(e) => setCustomerNote(e.target.value)}
            />
          </div>

          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
            <div className="flex justify-between items-center mb-6">
              <span className="text-neutral-400">Total a pagar</span>
              <span className="text-3xl font-black text-orange-500">${total.toLocaleString()}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-orange-600 hover:bg-orange-500 text-black font-black py-4 rounded-xl transition shadow-lg shadow-orange-900/20"
            >
              COMPRAR POR WHATSAPP
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}