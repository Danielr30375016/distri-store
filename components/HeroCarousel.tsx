'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import type { Banner } from '../lib/data'

const FALLBACK: Banner = {
  id: 0,
  image: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?q=80&w=1200',
  title: 'Tu próximo gran proyecto empieza aquí',
  isPromo: true,
  price: null,
  order: 0,
  active: true,
}

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const slides = banners.length > 0 ? banners : [FALLBACK]
  const [index, setIndex] = useState(0)

  const next = useCallback(() => setIndex(i => (i + 1) % slides.length), [slides.length])
  const prev = () => setIndex(i => (i - 1 + slides.length) % slides.length)

  // Auto-avance cada 5 s (solo si hay más de un banner)
  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [slides.length, next])

  return (
    <section className="relative w-full h-[350px] md:h-[500px] rounded-3xl overflow-hidden group shadow-2xl shadow-orange-900/10">
      {slides.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <Image
            src={b.image}
            alt={b.title || 'Banner promocional'}
            fill
            unoptimized
            className="object-cover"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-transparent flex flex-col justify-center p-8 md:p-16">
            {b.isPromo && (
              <span className="text-orange-500 font-bold tracking-widest text-sm mb-2 uppercase italic">
                Promoción Exclusiva
              </span>
            )}
            {b.title && (
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 max-w-xl leading-tight tracking-tighter uppercase">
                {b.title}
              </h2>
            )}
            {b.isPromo && b.price != null && (
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 text-3xl md:text-4xl font-black mb-6">
                ${b.price.toLocaleString('es-CO')}
              </p>
            )}
            <Link
              href="/productos?oferta=1"
              className="bg-orange-600 hover:bg-orange-500 text-black font-black py-4 px-10 rounded-xl w-fit transition-all transform hover:-translate-y-1 shadow-lg shadow-orange-900/50 uppercase tracking-tighter"
            >
              Ver Ofertas Ahora
            </Link>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-orange-500' : 'w-2 bg-white/60 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
