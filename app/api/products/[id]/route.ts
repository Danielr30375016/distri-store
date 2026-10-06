import { NextResponse } from 'next/server'
import { getProductById, updateProduct, deleteProduct } from '../../../../lib/data'
import { requireAdmin } from '../../../../lib/auth'
import { firstZodError, parseId, productUpdateSchema } from '../../../../lib/validation'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  const id = parseId((await params).id)
  const product = id ? await getProductById(id) : null
  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }
  return NextResponse.json(product)
}

export async function PUT(request: Request, { params }: Ctx) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  // BUG corregido: antes, si el body no traía "discount" o "stock", se reseteaban a 0 / true.
  // Ahora solo se actualizan los campos enviados.
  const parsed = productUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }

  try {
    const product = await updateProduct(id, parsed.data)
    return NextResponse.json(product)
  } catch (err) {
    console.error('Error al actualizar producto:', err)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    await deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
