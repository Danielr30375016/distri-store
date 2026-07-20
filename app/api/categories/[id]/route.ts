import { NextResponse } from 'next/server'
import { deleteCategory, updateCategory } from '../../../../lib/data'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '../../../../lib/auth'

async function isAuthed() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return verifyAdminToken(token ?? '')
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthed()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const { id } = await params
    const { name, image } = await request.json()
    const category = await updateCategory(Number(id), {
      ...(name != null && String(name).trim() ? { name: String(name).trim() } : {}),
      ...(image !== undefined ? { image: image ? String(image).trim() : null } : {}),
    })
    return NextResponse.json(category)
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Esa categoría ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al actualizar la categoría' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthed()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deleteCategory(Number(id))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la categoría' }, { status: 500 })
  }
}
