'use client'
import { useParams } from 'next/navigation'
import { useCart } from '../../../src/context/CartContext'
import { useState, useEffect } from 'react'
import { Product } from '../../../lib/data'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '../../../components/ProductCard'

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-2xl mb-20">
        {/* Lado Izquierdo: Imagen */}
        <div className="relative h-[400px] bg-neutral-800 rounded-2xl overflow-hidden group">
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
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase leading-none tracking-tighter">{product.name}</h1>
          <p className="text-3xl font-light text-neutral-400 mb-8">
            ${product.price.toLocaleString('es-CO')}
          </p>
          
          <div className="bg-black/40 p-6 rounded-2xl mb-8 border border-neutral-800">
            <h4 className="text-white font-bold mb-2 uppercase text-xs tracking-widest">Descripción</h4>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {product.desc}
            </p>
          </div>

          <button 
            onClick={() => addToCart(product)}
            className="bg-orange-600 hover:bg-orange-500 text-black font-black py-5 px-8 rounded-2xl transition-all transform active:scale-95 shadow-lg shadow-orange-900/40 uppercase tracking-tighter"
          >
            AÑADIR AL CARRITO 🛒
          </button>
        </div>
      </div>

      {/* SECCIÓN DE PRODUCTOS RELACIONADOS */}
      <section className="border-t border-neutral-800 pt-16">
        <h2 className="text-2xl font-black text-white mb-10 uppercase italic tracking-tighter">
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