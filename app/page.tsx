'use client'
// Importamos usando rutas relativas para evitar líos con el @
import { PRODUCTOS } from '../lib/data'
import ProductCard from '../components/ProductCard'

export default function Home() {
  return (
    <main>
      <h1 className="text-3xl font-bold mb-6 text-orange-500">
        Productos destacados
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {PRODUCTOS.map((p: any) => (
          <ProductCard 
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            image={p.image}
          />
        ))}
      </div>
    </main>
  )
}