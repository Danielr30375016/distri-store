'use client'
import { useParams } from 'next/navigation'
import { useCart } from '../../../src/context/CartContext'
import Link from 'next/link'
import Image from 'next/image'
import { PRODUCTOS } from '../../../lib/data' // Asegúrate de que tus productos estén aquí

export default function ProductoDetalle() {
  const params = useParams()
  const { addItem } = useCart()

  const producto = PRODUCTOS.find(p => p.id === Number(params.id))

  if (!producto) {
    return <div className="text-center py-20">Producto no encontrado</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/productos" className="text-orange-500 hover:underline mb-6 inline-block">
        ← Volver al catálogo
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
        <div className="relative h-80 w-full bg-neutral-800 rounded-xl overflow-hidden">
          <Image 
            src={producto.image} 
            alt={producto.name} 
            fill 
            className="object-cover"
          />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold mb-2">{producto.name}</h1>
          <p className="text-2xl text-orange-500 font-semibold mb-6">
            ${producto.price.toLocaleString()}
          </p>
          <p className="text-neutral-400 mb-8 leading-relaxed">
            {producto.desc || "Sin descripción disponible."}
          </p>
          
          <button 
            onClick={() => addItem({ id: producto.id, name: producto.name, price: producto.price })}
            className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold py-4 rounded-xl transition"
          >
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  )
}