import { NextResponse } from 'next/server'
import { deleteBrand, updateBrand } from '../../../../lib/data'
import { requireAdmin } from '../../../../lib/auth'
import { isSafeImageUrl, parseId } from '../../../../lib/validation'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const id = parseId((await params).id)
    if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    const { name, image } = await request.json()
    const brand = await updateBrand(id, {
      ...(name != null && String(name).trim().slice(0, 120) ? { name: String(name).trim().slice(0, 120) } : {}),
      ...(image !== undefined ? { image: typeof image === 'string' && isSafeImageUrl(image) ? image.trim() : null } : {}),
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
    const id = parseId((await params).id)
    if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    await deleteBrand(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la marca' }, { status: 500 })
  }
}
