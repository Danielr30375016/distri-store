'use client'
import Link from 'next/link'
import { useCart } from '../src/context/CartContext'

export default function Navbar() {
  const { items } = useCart()
  
  // Calculamos el total de artículos (ej: 2 martillos + 1 taladro = 3)
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <nav className="bg-neutral-950 border-b border-neutral-800 py-4 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-black text-orange-500 tracking-tighter">
          DISTRI-STORE
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/productos" className="text-neutral-400 hover:text-white transition">
            Productos
          </Link>
          
          <Link href="/carrito" className="relative p-2 bg-neutral-900 rounded-full border border-neutral-800 hover:border-orange-500 transition">
            <span className="text-xl">🛒</span>
            
            {/* El Badge: Solo se muestra si hay items */}
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-black text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-neutral-950 animate-in fade-in zoom-in duration-300">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}