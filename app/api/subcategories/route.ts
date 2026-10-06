import { NextResponse } from 'next/server'
import { createSubcategory } from '../../../lib/data'
import { requireAdmin } from '../../../lib/auth'

export async function POST(request: Request) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { categoryId, name } = await request.json()
    if (!categoryId || !name || !String(name).trim()) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    const subcategory = await createSubcategory(Number(categoryId), String(name).trim())
    return NextResponse.json(subcategory, { status: 201 })
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Esa subcategoría ya existe en la categoría' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear la subcategoría' }, { status: 500 })
  }
}
