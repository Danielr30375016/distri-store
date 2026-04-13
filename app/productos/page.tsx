import CatalogClient from '../../components/CatalogClient'
import { getProducts } from '../../lib/data'

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ categoria?: string }>
}) {
  const products = await getProducts()
  const params = searchParams ? await searchParams : undefined

  return <CatalogClient products={products} initialCategory={params?.categoria ?? ''} />
}