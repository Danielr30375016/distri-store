'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '../src/context/CartContext'

interface ProductProps {
  id: number
  name: string
  price: number
  image?: string
}

export default function ProductCard({ id, name, price, image }: ProductProps) {
  const { addToCart } = useCart()

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col group hover:border-orange-500/50 transition-all duration-300">
      
      {/* IMAGEN DEL PRODUCTO */}
      <div className="relative h-52 w-full bg-neutral-800 overflow-hidden">
        <Link href={`/productos/${id}`}>
          <Image
            src={image || "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=500"}
            alt={name}
            fill
            className="object-contain p-6 group-hover:scale-110 transition-transform duration-500"
          />
        </Link>
      </div>

      {/* DETALLES */}
      <div className="p-5 flex flex-col flex-grow">
        <Link href={`/productos/${id}`}>
          <h3 className="text-neutral-100 font-bold text-lg mb-2 group-hover:text-orange-500 transition-colors line-clamp-2 uppercase tracking-tighter">
            {name}
          </h3>
        </Link>
        
        <p className="text-orange-500 font-black text-xl mb-6">
          ${price.toLocaleString('es-CO')}
        </p>

        {/* BOTÓN DE ACCIÓN */}
        <button
          onClick={() => addToCart({ id, name, price, image })}
          className="mt-auto w-full bg-orange-600 hover:bg-orange-500 text-black font-black py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase text-xs"
        >
          <span>🛒</span> Agregar al carrito
        </button>
      </div>
    </div>
  )
}