import { NextResponse } from 'next/server'
import { getProducts, createProduct } from '../../../lib/data'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '../../../lib/auth'

export async function GET() {
  const products = await getProducts()
  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!await verifyAdminToken(token ?? '')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, price, images, desc, category, subcategory, reference, brand, discount, stock, quantity } = body
    if (!name || price == null || !desc || !category) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    const cleanImages = Array.isArray(images)
      ? images.filter((i: unknown): i is string => typeof i === 'string' && i.trim() !== '').slice(0, 6)
      : []
    const product = await createProduct({
      name,
      price: Number(price),
      images: cleanImages,
      desc,
      category,
      subcategory: subcategory?.trim() || null,
      reference: reference?.trim() || null,
      brand: brand?.trim() || null,
      discount: Number(discount ?? 0),
      stock: stock !== false,
      quantity: Math.max(0, Number(quantity ?? 0) || 0),
    })
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error('Error al crear producto:', err)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}