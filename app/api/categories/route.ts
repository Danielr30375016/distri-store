import { NextResponse } from 'next/server'
import { getProducts } from '../../../lib/data'

export async function GET() {
  const products = await getProducts()
  const categories = Array.from(new Set(products.map(p => p.category))).sort()
  return NextResponse.json(categories)
}
