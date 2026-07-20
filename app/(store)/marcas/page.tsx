import Link from 'next/link'
import { getBrands, getProducts } from '@/lib/data'

export default async function MarcasPage() {
  const [brands, products] = await Promise.all([getBrands(), getProducts()])

  // Conteo de productos por marca
  const countByBrand = new Map<string, number>()
  for (const p of products) {
    if (p.brand) countByBrand.set(p.brand, (countByBrand.get(p.brand) ?? 0) + 1)
  }

  // Imagen por marca (las administradas pueden tener logo)
  const imageByBrand = new Map<string, string | null>()
  for (const b of brands) imageByBrand.set(b.name, b.image)

  // Marcas administradas + cualquier marca usada en productos que no esté en la lista
  const brandNames = new Set(brands.map(b => b.name))
  for (const name of countByBrand.keys()) brandNames.add(name)
  const allBrands = Array.from(brandNames).sort((a, b) => a.localeCompare(b))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase italic tracking-tighter text-gray-900 dark:text-white border-l-4 border-orange-500 pl-4">
        Nuestras <span className="text-orange-500">Marcas</span>
      </h1>
      <p className="text-gray-500 dark:text-neutral-400 text-sm mb-8 pl-5">
        Seleccioná una marca para ver todos sus productos y filtrarlos por categoría, subcategoría o referencia.
      </p>

      {allBrands.length === 0 ? (
        <div className="py-16 md:py-20 text-center bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-dashed border-gray-300 dark:border-neutral-800">
          <p className="text-gray-400 dark:text-neutral-500 uppercase font-bold tracking-widest text-sm">Todavía no hay marcas cargadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allBrands.map(name => (
            <Link
              key={name}
              href={`/productos?marca=${encodeURIComponent(name)}`}
              className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-orange-500 hover:-translate-y-1 transition-all group shadow-sm dark:shadow-none min-h-[130px]"
            >
              {imageByBrand.get(name) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageByBrand.get(name) as string}
                  alt={name}
                  className="h-12 w-full object-contain group-hover:scale-110 transition-transform"
                />
              ) : (
                <span className="text-3xl group-hover:scale-110 transition-transform">🏷️</span>
              )}
              <span className="font-black text-gray-900 dark:text-white text-center uppercase tracking-tighter leading-tight group-hover:text-orange-500 transition-colors">
                {name}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-neutral-500 font-bold">
                {countByBrand.get(name) ?? 0} producto{(countByBrand.get(name) ?? 0) === 1 ? '' : 's'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
