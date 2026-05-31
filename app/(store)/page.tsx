import { getProducts } from '@/lib/data'
import ProductCard from '@/components/ProductCard'
import Image from 'next/image'
import Link from 'next/link'

export default async function Home() {
  const products = await getProducts()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-12">
      
      {/* 1. HERO BANNER (Inspirado en la estructura de Rhino) */}
      <section className="relative w-full h-[350px] md:h-[500px] rounded-3xl overflow-hidden group shadow-2xl shadow-orange-900/10">
        <Image 
          src="https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?q=80&w=1200" 
          alt="Banner Promocional" 
          fill 
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-transparent flex flex-col justify-center p-8 md:p-16">
          <span className="text-orange-500 font-bold tracking-widest text-sm mb-2 uppercase italic">Promoción Exclusiva</span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4 max-w-xl leading-tight tracking-tighter">
            TU PRÓXIMO <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 uppercase">Gran Proyecto</span> EMPIEZA AQUÍ
          </h2>
          <p className="text-neutral-300 mb-8 max-w-md text-lg">
            Equipos profesionales con hasta 40% de descuento. Calidad garantizada para los trabajos más exigentes.
          </p>
          <button className="bg-orange-600 hover:bg-orange-500 text-black font-black py-4 px-10 rounded-xl w-fit transition-all transform hover:-translate-y-1 shadow-lg shadow-orange-900/50 uppercase tracking-tighter">
            Ver Ofertas Ahora
          </button>
        </div>
      </section>

      {/* 2. BOTONES DE ACCESO RÁPIDO (Personalidad DistriStore) */}
      <div className="flex flex-wrap gap-4 justify-center">
        {['🔥 Lo más vendido', '🏷️ Ofertas del mes', '🆕 Recién llegados', '💎 Premium'].map((label) => (
          <button key={label} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-orange-500 text-gray-700 dark:text-white px-6 py-2 rounded-full text-sm font-bold transition-all hover:bg-orange-50 dark:hover:bg-neutral-800 shadow-sm dark:shadow-none">
            {label}
          </button>
        ))}
      </div>

      {/* 3. SECCIÓN DE CONFIANZA (Iconos de Beneficios) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { icon: '🏦', title: 'Transferencia', desc: 'Desde tu Banco' },
          { icon: '🛡️', title: 'Compra Segura', desc: 'Protección Total' },
          { icon: '📦', title: 'Gran Catálogo', desc: 'Miles de Productos' },
          { icon: '💬', title: 'Asesoría', desc: 'Expertos en Línea' },
        ].map((item) => (
          <div key={item.title} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-4 md:p-6 rounded-2xl flex flex-col items-center text-center hover:border-orange-500/40 transition-all group shadow-sm dark:shadow-none">
            <span className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</span>
            <h3 className="font-bold text-gray-900 dark:text-neutral-100 mb-1 leading-none text-sm md:text-base">{item.title}</h3>
            <p className="text-xs text-gray-400 dark:text-neutral-500">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* 4. CATEGORÍAS CON EFECTO NEÓN */}
      <section>
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight border-l-4 border-orange-500 pl-4">
            Explorar <span className="text-orange-500 uppercase">Categorías</span>
          </h2>
          <Link href="/productos" className="text-sm text-gray-400 dark:text-neutral-500 hover:text-orange-500 transition font-bold uppercase tracking-widest">
            Ver Todo →
          </Link>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {[
            { name: 'Eléctricas', icon: '⚡', color: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]' },
            { name: 'Manuales', icon: '🔧', color: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]' },
            { name: 'Almacenamiento', icon: '📦', color: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]' },
            { name: 'Seguridad', icon: '🦺', color: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]' },
            { name: 'Medición', icon: '📏', color: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]' },
          ].map((cat) => (
            <Link key={cat.name} href={`/productos?categoria=${encodeURIComponent(cat.name)}`}>
              <div
                className={`bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-4 md:p-6 rounded-3xl flex flex-col items-center justify-center gap-2 md:gap-3 hover:border-orange-500 transition-all cursor-pointer hover:-translate-y-1 group shadow-sm dark:shadow-none ${cat.color}`}
              >
                <span className="text-2xl md:text-4xl group-hover:rotate-12 transition-transform">{cat.icon}</span>
                <span className="font-bold text-xs text-gray-700 dark:text-neutral-200 text-center leading-tight">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. LISTADO DE PRODUCTOS DESTACADOS */}
      <section className="mt-4">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6 md:mb-8 border-l-4 border-orange-500 pl-4 tracking-tight">
          PRODUCTOS <span className="text-orange-500 uppercase">Destacados</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {products.map(p => (
            <ProductCard 
              key={p.id} 
              id={p.id} 
              name={p.name} 
              price={p.price} 
              image={p.image}
              discount={p.discount}
              stock={p.stock}
            />
          ))}
        </div>
      </section>

    </div>
  )
}