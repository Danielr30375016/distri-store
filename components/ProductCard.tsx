'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '../src/context/CartContext'

interface ProductProps {
  id: number
  name: string
  price: number
  image: string | null
  discount?: number
  stock?: boolean
}

export default function ProductCard({ id, name, price, image, discount = 0, stock = true }: ProductProps) {
  const { addToCart } = useCart()
  const hasDiscount = discount > 0
  const finalPrice = hasDiscount ? Math.round(price * (1 - discount / 100)) : price

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden flex flex-col group hover:border-orange-500/50 transition-all duration-300 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none">
      
      {/* IMAGEN DEL PRODUCTO */}
      <div className="relative h-52 w-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
        {!stock && (
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-10 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-lg">Agotado</span>
          </div>
        )}
        {hasDiscount && stock && (
          <div className="absolute top-3 left-3 z-10 bg-green-500 text-black text-xs font-black px-2 py-1 rounded-lg shadow-lg">
            -{discount}% OFF
          </div>
        )}
        <Link href={`/productos/${id}`}>
          <Image
            src={image ?? "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=500"}
            alt={name}
            fill
            unoptimized
            className="object-contain p-6 group-hover:scale-110 transition-transform duration-500"
          />
        </Link>
      </div>

      {/* DETALLES */}
      <div className="p-5 flex flex-col flex-grow">
        <Link href={`/productos/${id}`}>
          <h3 className="text-gray-900 dark:text-neutral-100 font-bold text-lg mb-2 group-hover:text-orange-500 transition-colors line-clamp-2 uppercase tracking-tighter">
            {name}
          </h3>
        </Link>
        
        {hasDiscount ? (
          <div className="mb-6">
            <p className="text-gray-400 dark:text-neutral-500 text-sm line-through">
              ${price.toLocaleString('es-CO')}
            </p>
            <p className="text-orange-500 font-black text-xl">
              ${finalPrice.toLocaleString('es-CO')}
            </p>
          </div>
        ) : (
          <p className="text-orange-500 font-black text-xl mb-6">
            ${price.toLocaleString('es-CO')}
          </p>
        )}

        {/* BOTÓN DE ACCIÓN */}
        <button
          onClick={() => stock && addToCart({ id, name, price: finalPrice, image: image ?? undefined })}
          disabled={!stock}
          className={`mt-auto w-full font-black py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase text-xs ${
            stock
              ? 'bg-orange-600 hover:bg-orange-500 text-black'
              : 'bg-gray-200 dark:bg-neutral-700 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
          }`}
        >
          {stock ? <><span>🛒</span> Agregar al carrito</> : 'Sin stock'}
        </button>
      </div>
    </div>
  )
}