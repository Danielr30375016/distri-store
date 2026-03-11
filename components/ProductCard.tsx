'use client'
import Image from 'next/image' // IMPORTANTE
import Link from 'next/link'
import { useCart } from '../src/context/CartContext'

interface Props {
  id: number; name: string; price: number; image?: string
}

export default function ProductCard({ id, name, price, image }: Props) {
  const { addItem } = useCart()

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden hover:border-orange-500 transition group">
      <Link href={`/productos/${id}`}>
        <div className="relative h-48 w-full bg-neutral-800">
          {image ? (
            <Image 
              src={image} 
              alt={name} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl">🛠️</div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{name}</h3>
        <p className="text-orange-500 font-semibold mb-4">${price.toLocaleString()}</p>
        <button 
          onClick={() => addItem({ id, name, price })}
          className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold py-2 rounded-lg transition"
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  )
}