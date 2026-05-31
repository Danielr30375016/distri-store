'use client'
import { useParams } from 'next/navigation'
import { useCart } from '@/src/context/CartContext'
import { useState, useEffect } from 'react'
import { Product } from '@/lib/data'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'

export default function ProductDetailPage() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [relacionados, setRelacionados] = useState<Product[]>([])

  useEffect(() => {
    async function fetchData() {
      const prodRes = await fetch(`/api/products/${id}`)
      const prod: Product = await prodRes.json()
      setProduct(prod)
      const productsRes = await fetch('/api/products')
      const products: Product[] = await productsRes.json()
      setRelacionados(products.filter((p: Product) => p.id !== Number(id)).sort(() => 0.5 - Math.random()).slice(0, 3))
    }
    fetchData()
  }, [id])

  if (!product) return <div className="text-center py-20 uppercase font-black">Cargando...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link href="/productos" className="text-orange-500 mb-8 inline-block hover:underline font-bold uppercase text-xs tracking-widest">
        ← Volver al catálogo
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-md dark:shadow-none mb-16 md:mb-20">
        {/* Lado Izquierdo: Imagen */}
        <div className="relative h-[280px] md:h-[400px] bg-gray-100 dark:bg-neutral-800 rounded-2xl overflow-hidden group">
          {!product.stock && (
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-10 flex items-center justify-center">
              <span className="bg-red-600 text-white text-sm font-black px-4 py-2 rounded-xl uppercase tracking-wider shadow-lg">Agotado</span>
            </div>
          )}
          <Image 
            src={product.image || 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=600'} 
            alt={product.name}
            fill
            unoptimized
            className="object-contain p-8 group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Lado Derecho: Info */}
        <div className="flex flex-col justify-center">
          <span className="text-orange-500 font-black mb-2 uppercase tracking-tighter text-sm italic">Calidad Garantizada</span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 uppercase leading-none tracking-tighter">{product.name}</h1>
          
          {product.discount > 0 && product.stock ? (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-green-500 text-black text-sm font-black px-3 py-1 rounded-lg">
                  -{product.discount}% OFF
                </span>
              </div>
              <p className="text-gray-400 dark:text-neutral-500 text-lg line-through">
                ${product.price.toLocaleString('es-CO')}
              </p>
              <p className="text-3xl md:text-4xl font-black text-orange-500">
                ${Math.round(product.price * (1 - product.discount / 100)).toLocaleString('es-CO')}
              </p>
            </div>
          ) : (
            <p className="text-2xl md:text-3xl font-light text-gray-500 dark:text-neutral-400 mb-8">
              ${product.price.toLocaleString('es-CO')}
            </p>
          )}
          
          <div className="bg-gray-50 dark:bg-black/40 p-6 rounded-2xl mb-8 border border-gray-200 dark:border-neutral-800">
            <h4 className="text-gray-900 dark:text-white font-bold mb-2 uppercase text-xs tracking-widest">Descripción</h4>
            <p className="text-gray-500 dark:text-neutral-500 text-sm leading-relaxed">
              {product.desc}
            </p>
          </div>

          <div className="mb-4">
            {product.stock ? (
              <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> En stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red-500 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Agotado
              </span>
            )}
          </div>

          <button 
            onClick={() => product.stock && addToCart({ ...product, price: product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price })}
            disabled={!product.stock}
            className={`py-4 md:py-5 px-8 rounded-2xl transition-all font-black uppercase tracking-tighter ${
              product.stock
                ? 'bg-orange-600 hover:bg-orange-500 text-black transform active:scale-95 shadow-lg shadow-orange-900/40'
                : 'bg-gray-200 dark:bg-neutral-700 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
            }`}
          >
            {product.stock ? 'AÑADIR AL CARRITO 🛒' : 'SIN STOCK'}
          </button>
        </div>
      </div>

      {/* SECCIÓN DE PRODUCTOS RELACIONADOS */}
      <section className="border-t border-gray-200 dark:border-neutral-800 pt-12 md:pt-16">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-8 md:mb-10 uppercase italic tracking-tighter">
          También te <span className="text-orange-500">puede interesar</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {relacionados.map(p => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </section>
    </div>
  )
}