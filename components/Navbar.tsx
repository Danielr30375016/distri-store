'use client'
import Link from 'next/link'
import { useCart } from '../src/context/CartContext'
import { useTheme } from '../src/context/ThemeContext'

export default function Navbar() {
  const { totalItems } = useCart()
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 py-3 px-4 shadow-sm dark:shadow-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* LOGO */}
        <Link href="/" className="text-xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-1 group shrink-0">
          DISTRI<span className="text-orange-500 group-hover:rotate-12 transition-transform">STORE</span>
        </Link>

        {/* LINKS + ICONOS */}
        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/productos"
            className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-400 hover:text-orange-500 dark:hover:text-orange-500 transition"
          >
            Catálogo
          </Link>

          {/* TOGGLE TEMA */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 transition-all text-base"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* CARRITO */}
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
