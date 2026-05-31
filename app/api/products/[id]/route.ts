import { NextResponse } from 'next/server'
import { getProductById, updateProduct, deleteProduct } from '../../../../lib/data'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = await getProductById(Number(id))
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  return NextResponse.json(product)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!await verifyAdminToken(token ?? '')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, price, image, desc, category, discount, stock } = body
    const product = await updateProduct(Number(id), {
      ...(name && { name }),
      ...(price != null && { price: Number(price) }),
      ...(desc && { desc }),
      ...(category && { category }),
      image: image ?? null,
      discount: discount != null ? Number(discount) : 0,
      stock: stock !== false,
    })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!await verifyAdminToken(token ?? '')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deleteProduct(Number(id))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}