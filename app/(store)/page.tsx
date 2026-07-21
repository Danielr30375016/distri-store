import { getProducts, getActiveBanners, getCategories } from '@/lib/data'
import ProductCard from '@/components/ProductCard'
import HeroCarousel from '@/components/HeroCarousel'
import Link from 'next/link'

// Lee siempre datos frescos de la BD (categorías, banners, productos)
// para reflejar los cambios hechos desde el admin sin necesidad de rebuild.
export const dynamic = 'force-dynamic'

export default async function Home() {
  const [products, banners, categories] = await Promise.all([
    getProducts(),
    getActiveBanners(),
    getCategories(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-12">

      {/* 1. HERO CARRUSEL (banners administrables desde el admin) */}
      <HeroCarousel banners={banners} />

      {/* 2. BOTONES DE ACCESO RÁPIDO (Personalidad DistriStore) */}
      <div className="flex flex-wrap gap-4 justify-center">
        {['🔥 Lo más vendido', '🏷️ Ofertas del mes', '🆕 Recién llegados', ].map((label) => (
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

      {/* 4. CATEGORÍAS DINÁMICAS (desde el admin) */}
      {categories.length > 0 && (
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
            {categories.map((cat) => (
              <Link key={cat.id} href={`/productos?categoria=${encodeURIComponent(cat.name)}`}>
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl overflow-hidden flex flex-col items-center justify-start hover:border-orange-500 transition-all cursor-pointer hover:-translate-y-1 group shadow-sm dark:shadow-none">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {cat.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-3xl md:text-5xl group-hover:rotate-12 transition-transform">📦</span>
                    )}
                  </div>
                  <span className="font-bold text-xs md:text-sm text-gray-700 dark:text-neutral-200 text-center leading-tight p-3">
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
              images={p.images}
              discount={p.discount}
              stock={p.stock}
            />
          ))}
        </div>
      </section>

    </div>
  )
}