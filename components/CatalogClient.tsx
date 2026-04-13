'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import { Product } from '../lib/data'

interface CatalogClientProps {
  products: Product[]
  initialCategory?: string
}

export default function CatalogClient({ products, initialCategory = '' }: CatalogClientProps) {
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState(2000000)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)

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
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {categorias.map((cat) => (
          <div
            key={cat.n}
            onClick={() => setSelectedCategory(selectedCategory === cat.n ? '' : cat.n)}
            className={`bg-neutral-900 border rounded-2xl p-4 flex flex-col items-center hover:border-orange-500 transition-all cursor-pointer group ${
              selectedCategory === cat.n ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-800'
            }`}
          >
            <div className="w-full h-32 relative mb-4 overflow-hidden rounded-xl bg-neutral-800">
              <img src={cat.i} alt={cat.n} className="object-cover w-full h-full group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
            </div>
            <span className="font-bold uppercase text-xs tracking-widest">{cat.n}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-64 space-y-8">
          <div>
            <h3 className="text-orange-500 font-black uppercase text-sm mb-4">Buscar</h3>
            <input
              type="text"
              placeholder="Nombre de herramienta..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div>
            <h3 className="text-orange-500 font-black uppercase text-sm mb-4">Precio Máximo</h3>
            <input
              type="range"
              min="0"
              max="2000000"
              step="50000"
              className="w-full accent-orange-500"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-2 font-bold">
              <span>$0</span>
              <span className="text-white">${maxPrice.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </aside>

        <div className="flex-grow">
          <h2 className="text-3xl font-black mb-8 uppercase italic tracking-tighter">
            Resultados <span className="text-orange-500">({filteredProducts.length})</span>
          </h2>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-neutral-900 rounded-3xl border border-dashed border-neutral-800">
              <p className="text-neutral-500 uppercase font-bold tracking-widest">No hay herramientas con esos criterios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}