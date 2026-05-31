'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import { Product } from '../lib/data'

interface CatalogClientProps {
  products: Product[]
  initialCategory?: string
  initialSearch?: string
}

export default function CatalogClient({ products, initialCategory = '', initialSearch = '' }: CatalogClientProps) {
  const [search, setSearch] = useState(initialSearch)
  const [maxPrice, setMaxPrice] = useState(2000000)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setSelectedCategory(initialCategory)
  }, [initialCategory])

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) &&
    product.price <= maxPrice &&
    (selectedCategory === '' || product.category === selectedCategory)
  )

  const categorias = [
    { n: 'Eléctricas', i: 'https://images.unsplash.com/photo-1504148455328-497c596d229c?w=200' },
    { n: 'Manuales', i: 'https://images.unsplash.com/photo-1586864387917-f539b1684bb0?w=200' },
    { n: 'Almacenamiento', i: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=200' },
    { n: 'Seguridad', i: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=200' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* CATEGORÍAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-16">
        {categorias.map((cat) => (
          <div
            key={cat.n}
            onClick={() => setSelectedCategory(selectedCategory === cat.n ? '' : cat.n)}
            className={`bg-white dark:bg-neutral-900 border rounded-2xl p-3 md:p-4 flex flex-col items-center hover:border-orange-500 transition-all cursor-pointer group shadow-sm dark:shadow-none ${
              selectedCategory === cat.n
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                : 'border-gray-200 dark:border-neutral-800'
            }`}
          >
            <div className="w-full h-24 md:h-32 relative mb-3 md:mb-4 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800">
              <img src={cat.i} alt={cat.n} className="object-cover w-full h-full group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
            </div>
            <span className="font-bold uppercase text-xs tracking-widest text-gray-700 dark:text-neutral-200">{cat.n}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* FILTROS MÓVIL: botón toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-3 font-bold text-sm text-gray-700 dark:text-white"
          >
            <span>🔧 Filtros{selectedCategory ? ` · ${selectedCategory}` : ''}</span>
            <span className="text-orange-500">{showFilters ? '▲' : '▼'}</span>
          </button>
          {showFilters && (
            <div className="mt-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 space-y-6 shadow-sm">
              <div>
                <h3 className="text-orange-500 font-black uppercase text-sm mb-3">Buscar</h3>
                <input
                  type="text"
                  placeholder="Nombre de herramienta..."
                  value={search}
                  className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
            </div>
          )}
        </div>

        {/* FILTROS DESKTOP */}
        <aside className="hidden md:block w-64 space-y-8 shrink-0">
          <div>
            <h3 className="text-orange-500 font-black uppercase text-sm mb-4">Buscar</h3>
            <input
              type="text"
              placeholder="Nombre de herramienta..."
              value={search}
              className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <h3 className="text-orange-500 font-black uppercase text-sm mb-4">Precio Máximo</h3>
            <input
              type="range" min="0" max="2000000" step="50000"
              className="w-full accent-orange-500"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-neutral-500 mt-2 font-bold">
              <span>$0</span>
              <span className="text-gray-900 dark:text-white">${maxPrice.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </aside>

        {/* GRID DE PRODUCTOS */}
        <div className="flex-grow min-w-0">
          <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 uppercase italic tracking-tighter text-gray-900 dark:text-white">
            Resultados <span className="text-orange-500">({filteredProducts.length})</span>
          </h2>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="py-16 md:py-20 text-center bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-dashed border-gray-300 dark:border-neutral-800">
              <p className="text-gray-400 dark:text-neutral-500 uppercase font-bold tracking-widest text-sm">No hay herramientas con esos criterios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}