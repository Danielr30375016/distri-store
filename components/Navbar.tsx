'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useCart } from '../src/context/CartContext'
import { useTheme } from '../src/context/ThemeContext'

interface Subcategory {
  id: number
  name: string
  categoryId: number
}
interface Category {
  id: number
  name: string
  subcategories: Subcategory[]
}

export default function Navbar() {
  const { totalItems } = useCart()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [openCats, setOpenCats] = useState(false)
  const catsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((data: Category[]) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  // Cerrar el menú de categorías al hacer clic afuera
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (catsRef.current && !catsRef.current.contains(e.target as Node)) {
        setOpenCats(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/productos?q=${encodeURIComponent(q)}` : '/productos')
  }

  return (
    <nav className="bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 shadow-sm dark:shadow-xl transition-colors duration-300">
      {/* Fila principal: logo + buscador + iconos */}
      <div className="max-w-7xl mx-auto flex items-center gap-3 md:gap-6 py-3 px-4">
        {/* LOGO */}
        <Link href="/" className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-1 group shrink-0">
          DISTRI<span className="text-orange-500 group-hover:rotate-12 transition-transform">STORE</span>
        </Link>

        {/* BUSCADOR (estilo Mercado Libre) */}
        <form onSubmit={submitSearch} className="flex-1 max-w-2xl hidden sm:flex">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar productos, marcas y más..."
            className="flex-1 min-w-0 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-l-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all placeholder-gray-400 dark:placeholder-neutral-500"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="bg-orange-600 hover:bg-orange-500 text-black font-black px-5 rounded-r-xl transition-all"
          >
            🔍
          </button>
        </form>

        {/* ICONOS */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0 ml-auto sm:ml-0">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 transition-all text-base"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

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

      {/* Buscador en móvil (debajo del logo) */}
      <form onSubmit={submitSearch} className="sm:hidden flex px-4 pb-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar productos, marcas y más..."
          className="flex-1 min-w-0 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-l-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all placeholder-gray-400 dark:placeholder-neutral-500"
        />
        <button type="submit" aria-label="Buscar" className="bg-orange-600 hover:bg-orange-500 text-black font-black px-5 rounded-r-xl transition-all">
          🔍
        </button>
      </form>

      {/* Fila secundaria: categorías + accesos */}
      <div className="border-t border-gray-100 dark:border-neutral-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-widest">
          {/* Menú Categorías */}
          <div className="relative" ref={catsRef}>
            <button
              onClick={() => setOpenCats(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition whitespace-nowrap"
            >
              <span className="text-sm">☰</span> Categorías
              <span className="text-[9px] opacity-60">▼</span>
            </button>

            {openCats && (
              <div className="absolute left-0 top-full mt-1 w-72 max-h-[70vh] overflow-y-auto bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 normal-case tracking-normal">
                {categories.length === 0 ? (
                  <p className="text-gray-400 dark:text-neutral-500 text-sm px-3 py-4 text-center">Sin categorías todavía</p>
                ) : (
                  categories.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/productos?categoria=${encodeURIComponent(cat.name)}`}
                      onClick={() => setOpenCats(false)}
                      className="block px-3 py-2 rounded-lg font-bold text-sm text-gray-900 dark:text-white hover:bg-orange-50 dark:hover:bg-neutral-800 hover:text-orange-600 transition"
                    >
                      {cat.name}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <Link href="/productos" className="px-3 py-2 rounded-lg text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-orange-500 transition whitespace-nowrap">
            Catálogo
          </Link>
          <Link href="/productos?oferta=1" className="px-3 py-2 rounded-lg text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-neutral-800 transition whitespace-nowrap">
            🏷️ Ofertas
          </Link>
          <Link href="/marcas" className="px-3 py-2 rounded-lg text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-orange-500 transition whitespace-nowrap">
            Marcas
          </Link>
        </div>
      </div>
    </nav>
  )
}
