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
  const [activeImg, setActiveImg] = useState(0)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      // BUG corregido: si el producto no existía se guardaba {error: ...} como producto
      // y la página se rompía al leer product.images / product.price.
      try {
        setNotFound(false)
        const prodRes = await fetch(`/api/products/${id}`)
        if (!prodRes.ok) {
          if (!cancelled) setNotFound(true)
          return
        }
        const prod: Product = await prodRes.json()
        if (cancelled) return
        setProduct(prod)
        setActiveImg(0)
        const productsRes = await fetch('/api/products')
        const products: Product[] = productsRes.ok ? await productsRes.json() : []
        if (cancelled) return
        // Relacionados: priorizar la misma categoría
        const others = products.filter(p => p.id !== prod.id)
        const sameCat = others.filter(p => p.category === prod.category)
        const pool = sameCat.length >= 3 ? sameCat : others
        setRelacionados([...pool].sort(() => 0.5 - Math.random()).slice(0, 3))
      } catch {
        if (!cancelled) setNotFound(true)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [id])

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase mb-4">Producto no encontrado</h1>
        <Link href="/productos" className="text-orange-500 font-bold hover:underline">← Volver al catálogo</Link>
      </div>
    )
  }
  if (!product) return <div className="text-center py-20 uppercase font-black">Cargando...</div>

  const available = product.stock && product.quantity > 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link href="/productos" className="text-orange-500 mb-8 inline-block hover:underline font-bold uppercase text-xs tracking-widest">
        ← Volver al catálogo
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-md dark:shadow-none mb-16 md:mb-20">
        {/* Lado Izquierdo: Carrusel de imágenes */}
        <div className="flex flex-col gap-3">
          <div className="relative h-[280px] md:h-[400px] bg-gray-100 dark:bg-neutral-800 rounded-2xl overflow-hidden group">
            {!available && (
              <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-10 flex items-center justify-center">
                <span className="bg-red-600 text-white text-sm font-black px-4 py-2 rounded-xl uppercase tracking-wider shadow-lg">Agotado</span>
              </div>
            )}
            <Image
              src={product.images?.[activeImg] || 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=600'}
              alt={product.name}
              fill
              unoptimized
              className="object-contain p-8 transition-transform duration-500"
            />

            {/* Flechas del carrusel */}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg((activeImg - 1 + product.images.length) % product.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800 text-gray-900 dark:text-white shadow-lg backdrop-blur transition-all"
                  aria-label="Imagen anterior"
                >
                  ‹
                </button>
                <button
                  onClick={() => setActiveImg((activeImg + 1) % product.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800 text-gray-900 dark:text-white shadow-lg backdrop-blur transition-all"
                  aria-label="Imagen siguiente"
                >
                  ›
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {activeImg + 1} / {product.images.length}
                </div>
              </>
            )}
          </div>

          {/* Miniaturas seleccionables */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-6 gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative h-16 md:h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800 border-2 transition-all ${
                    activeImg === i
                      ? 'border-orange-500'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill unoptimized className="object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lado Derecho: Info */}
        <div className="flex flex-col justify-center">
          <span className="text-orange-500 font-black mb-2 uppercase tracking-tighter text-sm italic">
            {product.brand ? product.brand : 'Calidad Garantizada'}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-2 uppercase leading-none tracking-tighter">{product.name}</h1>
          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            {product.reference && (
              <span className="bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 font-bold px-2 py-1 rounded-full">Ref: {product.reference}</span>
            )}
            <Link href={`/productos?categoria=${encodeURIComponent(product.category)}`} className="bg-orange-100 dark:bg-neutral-800 text-orange-600 dark:text-orange-400 font-bold px-2 py-1 rounded-full hover:underline">
              {product.category}
            </Link>
            {product.subcategory && (
              <span className="bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 font-bold px-2 py-1 rounded-full">{product.subcategory}</span>
            )}
          </div>

          {product.discount > 0 && available ? (
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
            {available ? (
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
            onClick={() => available && addToCart({ id: product.id, name: product.name, image: product.images?.[0], price: product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price })}
            disabled={!available}
            className={`py-4 md:py-5 px-8 rounded-2xl transition-all font-black uppercase tracking-tighter ${
              available
                ? 'bg-orange-600 hover:bg-orange-500 text-black transform active:scale-95 shadow-lg shadow-orange-900/40'
                : 'bg-gray-200 dark:bg-neutral-700 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
            }`}
          >
            {available ? 'AÑADIR AL CARRITO 🛒' : 'SIN STOCK'}
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