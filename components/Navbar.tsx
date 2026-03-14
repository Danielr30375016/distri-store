'use client'
import Link from 'next/link'
import { useCart } from '../src/context/CartContext'
import { useState } from 'react'

export default function Navbar() {
  const { totalItems } = useCart()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/productos?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <nav className="bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 py-4 px-6 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* LOGO */}
        <Link href="/" className="text-2xl font-black text-white tracking-tighter flex items-center gap-1 group">
          DISTRI<span className="text-orange-500 group-hover:rotate-12 transition-transform">STORE</span>
        </Link>

        {/* BUSCADOR (Inspirado en Rhino) */}
        <form onSubmit={handleSearch} className="w-full md:w-1/2 relative">
          <input 
            type="text" 
            placeholder="Busca herramientas, marcas y más..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-full px-6 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-orange-500">
            🔍
          </button>
        </form>

        {/* BOTONES */}
        <div className="flex items-center gap-6">
          <Link href="/productos" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-orange-500 transition">
            Catálogo
          </Link>
          <Link href="/carrito" className="relative group">
            <span className="text-2xl group-hover:scale-110 transition-transform block">🛒</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-600 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}