import CatalogClient from '@/components/CatalogClient'
import { getProducts, getActiveBanners } from '@/lib/data'

// Datos siempre frescos para reflejar cambios del admin sin rebuild.
export const dynamic = 'force-dynamic'

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ categoria?: string; subcategoria?: string; marca?: string; q?: string; oferta?: string }>
}) {
  const [products, banners] = await Promise.all([getProducts(), getActiveBanners()])
  const params = searchParams ? await searchParams : undefined

  return (
    <CatalogClient
      products={products}
      banners={banners}
      initialCategory={params?.categoria ?? ''}
      initialSubcategory={params?.subcategoria ?? ''}
      initialBrand={params?.marca ?? ''}
      initialSearch={params?.q ?? ''}
      initialOffers={params?.oferta === '1' || params?.oferta === 'true'}
    />
  )
}
