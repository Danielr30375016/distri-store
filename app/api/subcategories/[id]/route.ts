import { NextResponse } from 'next/server'
import { deleteSubcategory } from '../../../../lib/data'
import { requireAdmin } from '../../../../lib/auth'
import { parseId } from '../../../../lib/validation'

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
    await deleteSubcategory(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la subcategoría' }, { status: 500 })
  }
}
