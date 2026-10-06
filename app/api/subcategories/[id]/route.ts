import { NextResponse } from 'next/server'
import { deleteSubcategory } from '../../../../lib/data'
import { requireAdmin } from '../../../../lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deleteSubcategory(Number(id))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la subcategoría' }, { status: 500 })
  }
}
