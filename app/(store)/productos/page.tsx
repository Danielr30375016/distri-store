import CatalogClient from '@/components/CatalogClient'
import { getProducts } from '@/lib/data'

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ categoria?: string; subcategoria?: string; marca?: string; q?: string }>
}) {
  const products = await getProducts()
  const params = searchParams ? await searchParams : undefined

  return (
    <CatalogClient
      products={products}
      initialCategory={params?.categoria ?? ''}
      initialSubcategory={params?.subcategoria ?? ''}
      initialBrand={params?.marca ?? ''}
      initialSearch={params?.q ?? ''}
    />
  )
}
