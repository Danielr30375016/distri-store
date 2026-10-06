import { NextResponse } from 'next/server'
import { updateBanner, deleteBanner } from '../../../../lib/data'
import { requireAdmin } from '../../../../lib/auth'
import { bannerUpdateSchema, firstZodError, parseId } from '../../../../lib/validation'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const parsed = bannerUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  try {
    // BUG corregido: antes cualquier edición sin isPromo borraba el precio (price: null).
    const data = { ...parsed.data }
    if (data.isPromo === false) data.price = null
    const banner = await updateBanner(id, data)
    return NextResponse.json(banner)
  } catch (err) {
    console.error('Error al actualizar banner:', err)
    return NextResponse.json({ error: 'Error al actualizar el banner' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  try {
    await deleteBanner(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el banner' }, { status: 500 })
  }
}
