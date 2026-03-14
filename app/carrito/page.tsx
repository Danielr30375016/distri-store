'use client'
import { useCart } from '../../src/context/CartContext'
import Image from 'next/image'
import Link from 'next/link'

export default function CartPage() {
  const { items, removeFromCart, clearCart } = useCart()

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  // FUNCIÓN PARA ENVIAR EL PEDIDO A WHATSAPP
  const handleCheckout = () => {
    const telefono = "573000000000" // 👈 REEMPLAZA CON TU NÚMERO (incluye código de país)
    
    // Formateamos la lista de productos para el mensaje
    const listaProductos = items.map(item => 
      `- ${item.name} (x${item.quantity}): $${(item.price * item.quantity).toLocaleString('es-CO')}`
    ).join('%0A') // %0A es un salto de línea en URL

    const mensaje = `¡Hola! Quisiera realizar el siguiente pedido en DistriStore:%0A%0A${listaProductos}%0A%0A*TOTAL A PAGAR: $${total.toLocaleString('es-CO')}*`
    
    // Abrimos el enlace de WhatsApp
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-black mb-6 uppercase tracking-tighter">Tu carrito está vacío</h1>
        <p className="text-neutral-500 mb-10">Parece que aún no has elegido tus herramientas profesionales.</p>
        <Link href="/" className="bg-orange-600 hover:bg-orange-500 text-black px-10 py-4 rounded-xl font-black inline-block uppercase transition-all shadow-lg shadow-orange-900/40">
          Volver a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-8 uppercase border-l-4 border-orange-500 pl-4 tracking-tighter">
        Tu <span className="text-orange-500">Carrito</span>
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LISTADO DE PRODUCTOS EN EL CARRITO */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex items-center gap-6 group hover:border-neutral-700 transition-all">
              <div className="relative h-24 w-24 bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
                <Image 
                  src={item.image || 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=200'} 
                  alt={item.name} 
                  fill 
                  className="object-contain p-2 group-hover:scale-110 transition-transform" 
                />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold uppercase text-base leading-tight text-neutral-100">{item.name}</h3>
                <p className="text-orange-500 font-black text-lg mt-1">
                  ${item.price.toLocaleString('es-CO')} <span className="text-neutral-500 text-sm font-normal">x {item.quantity}</span>
                </p>
              </div>
              <button 
                onClick={() => removeFromCart(item.id)} 
                className="text-neutral-600 hover:text-red-500 transition-colors p-2"
                title="Eliminar producto"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
          ))}
          
          <div className="pt-4">
            <button onClick={clearCart} className="text-xs text-neutral-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors">
              🗑️ Vaciar todo el carrito
            </button>
          </div>
        </div>

        {/* PANEL DE RESUMEN Y FINALIZACIÓN */}
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl h-fit lg:sticky lg:top-24 shadow-xl">
          <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter text-white">Resumen de compra</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-neutral-400">
              <span>Productos ({items.length})</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Envío</span>
              <span className="text-green-500 font-bold italic">Gratis</span>
            </div>
          </div>

          <div className="flex justify-between mb-10 text-2xl font-black text-white border-t border-neutral-800 pt-6">
            <span>TOTAL</span>
            <span className="text-orange-500">${total.toLocaleString('es-CO')}</span>
          </div>

          <button 
            onClick={handleCheckout}
            className="w-full bg-orange-600 hover:bg-orange-500 text-black font-black py-5 rounded-2xl transition-all transform active:scale-95 shadow-lg shadow-orange-900/50 uppercase flex items-center justify-center gap-3"
          >
            Finalizar por WhatsApp 📲
          </button>
          
          <p className="text-[10px] text-neutral-500 mt-6 text-center uppercase tracking-widest">
            Al finalizar serás redirigido para concretar el pago y envío.
          </p>
        </div>
      </div>
    </div>
  )
}