import { NextResponse } from 'next/server'
import { deleteBrand, updateBrand } from '../../../../lib/data'
import { requireAdmin } from '../../../../lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const { id } = await params
    const { name, image } = await request.json()
    const brand = await updateBrand(Number(id), {
      ...(name != null && String(name).trim() ? { name: String(name).trim() } : {}),
      ...(image !== undefined ? { image: image ? String(image).trim() : null } : {}),
    })
    return NextResponse.json(brand)
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Esa marca ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al actualizar la marca' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deleteBrand(Number(id))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la marca' }, { status: 500 })
  }
}
