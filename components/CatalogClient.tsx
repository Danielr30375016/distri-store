'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { Product } from '../lib/data'

interface CatalogClientProps {
  products: Product[]
  initialCategory?: string
  initialSubcategory?: string
  initialBrand?: string
  initialSearch?: string
  initialOffers?: boolean
}

export default function CatalogClient({
  products,
  initialCategory = '',
  initialSubcategory = '',
  initialBrand = '',
  initialSearch = '',
  initialOffers = false,
}: CatalogClientProps) {
  const [search, setSearch] = useState(initialSearch)
  const [maxPrice, setMaxPrice] = useState(2000000)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory)
  const [selectedBrand, setSelectedBrand] = useState(initialBrand)
  const [onlyOffers, setOnlyOffers] = useState(initialOffers)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { setSelectedCategory(initialCategory) }, [initialCategory])
  useEffect(() => { setSelectedBrand(initialBrand) }, [initialBrand])
  useEffect(() => { setSelectedSubcategory(initialSubcategory) }, [initialSubcategory])
  useEffect(() => { setOnlyOffers(initialOffers) }, [initialOffers])
  useEffect(() => { setSearch(initialSearch) }, [initialSearch])

  // Listas derivadas de los productos
  const categories = useMemo(
    () => Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort(),
    [products]
  )
  const brands = useMemo(
    () => Array.from(new Set(products.map(p => p.brand).filter((b): b is string => !!b))).sort(),
    [products]
  )
  const subcategories = useMemo(() => {
    const source = selectedCategory
      ? products.filter(p => p.category === selectedCategory)
      : products
    return Array.from(new Set(source.map(p => p.subcategory).filter((s): s is string => !!s))).sort()
  }, [products, selectedCategory])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((product) => {
      if (product.price > maxPrice) return false
      if (onlyOffers && !(product.discount > 0)) return false
      if (selectedCategory && product.category !== selectedCategory) return false
      if (selectedSubcategory && product.subcategory !== selectedSubcategory) return false
      if (selectedBrand && product.brand !== selectedBrand) return false
      if (!q) return true
      return (
        product.name.toLowerCase().includes(q) ||
        (product.reference?.toLowerCase().includes(q) ?? false) ||
        (product.brand?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [products, search, maxPrice, selectedCategory, selectedSubcategory, selectedBrand, onlyOffers])

  const hasActiveFilters = search || selectedCategory || selectedSubcategory || selectedBrand || onlyOffers || maxPrice < 2000000

  function clearFilters() {
    setSearch('')
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSelectedBrand('')
    setOnlyOffers(false)
    setMaxPrice(2000000)
  }

  const filterControls = (
    <div className="space-y-6">
      <label className="flex items-center gap-3 cursor-pointer select-none bg-orange-50 dark:bg-neutral-800 border border-orange-200 dark:border-neutral-700 rounded-xl px-4 py-3">
        <input
          type="checkbox"
          checked={onlyOffers}
          onChange={(e) => setOnlyOffers(e.target.checked)}
          className="w-4 h-4 accent-orange-500"
        />
        <span className="text-sm font-black uppercase text-orange-600 dark:text-orange-500">🏷️ Solo ofertas</span>
      </label>

      <div>
        <h3 className="text-orange-500 font-black uppercase text-sm mb-3">Buscar</h3>
        <input
          type="text"
          placeholder="Nombre, referencia o marca..."
          value={search}
          className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div>
        <h3 className="text-orange-500 font-black uppercase text-sm mb-3">Categoría</h3>
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory('') }}
          className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
        >
          <option value="">Todas</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {subcategories.length > 0 && (
        <div>
          <h3 className="text-orange-500 font-black uppercase text-sm mb-3">Subcategoría</h3>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
          >
            <option value="">Todas</option>
            {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {brands.length > 0 && (
        <div>
          <h3 className="text-orange-500 font-black uppercase text-sm mb-3">Marca</h3>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
          >
            <option value="">Todas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}

      <div>
        <h3 className="text-orange-500 font-black uppercase text-sm mb-3">Precio Máximo</h3>
        <input
          type="range" min="0" max="2000000" step="50000"
          className="w-full accent-orange-500"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
        />
        <div className="flex justify-between text-[10px] text-gray-400 dark:text-neutral-500 mt-2 font-bold">
          <span>$0</span>
          <span className="text-gray-900 dark:text-white">${maxPrice.toLocaleString('es-CO')}</span>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all uppercase tracking-widest"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* CATEGORÍAS RÁPIDAS */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => { setSelectedCategory(''); setSelectedSubcategory('') }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              selectedCategory === ''
                ? 'bg-orange-600 border-orange-600 text-black'
                : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-orange-500'
            }`}
          >
            Todo
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setSelectedSubcategory('') }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                selectedCategory === cat
                  ? 'bg-orange-600 border-orange-600 text-black'
                  : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-orange-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* FILTROS MÓVIL: botón toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-3 font-bold text-sm text-gray-700 dark:text-white"
          >
            <span>🔧 Filtros{hasActiveFilters ? ' · activos' : ''}</span>
            <span className="text-orange-500">{showFilters ? '▲' : '▼'}</span>
          </button>
          {showFilters && (
            <div className="mt-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm">
              {filterControls}
            </div>
          )}
        </div>

        {/* FILTROS DESKTOP */}
        <aside className="hidden md:block w-64 shrink-0">
          {filterControls}
        </aside>

        {/* GRID DE PRODUCTOS */}
        <div className="flex-grow min-w-0">
          <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 uppercase italic tracking-tighter text-gray-900 dark:text-white">
            {onlyOffers ? <>🏷️ Ofertas </> : selectedBrand ? <>Marca <span className="text-orange-500">{selectedBrand}</span> </> : 'Resultados '}
            <span className="text-orange-500">({filteredProducts.length})</span>
          </h2>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="py-16 md:py-20 text-center bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-dashed border-gray-300 dark:border-neutral-800">
              <p className="text-gray-400 dark:text-neutral-500 uppercase font-bold tracking-widest text-sm">No hay productos con esos criterios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
