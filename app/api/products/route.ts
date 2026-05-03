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
    const { name, price, image, desc, category } = body
    if (!name || price == null || !desc || !category) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    const product = await createProduct({ name, price: Number(price), image: image || null, desc, category })
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error('Error al crear producto:', err)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}