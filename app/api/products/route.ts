import { NextResponse } from 'next/server'
import { getProducts, createProduct } from '../../../lib/data'
import { requireAdmin } from '../../../lib/auth'
import { firstZodError, productCreateSchema } from '../../../lib/validation'

export async function GET() {
  const products = await getProducts()
  return NextResponse.json(products)
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const parsed = productCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }

  try {
    const product = await createProduct(parsed.data)
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error('Error al crear producto:', err)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
