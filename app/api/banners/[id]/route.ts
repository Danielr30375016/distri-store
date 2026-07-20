import { NextResponse } from 'next/server'
import { updateBanner, deleteBanner } from '../../../../lib/data'
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
    const body = await request.json()
    const { image, title, isPromo, price, order, active } = body
    const banner = await updateBanner(Number(id), {
      ...(image != null ? { image: String(image).trim() } : {}),
      ...(title != null ? { title: String(title).slice(0, 120) } : {}),
      ...(isPromo != null ? { isPromo: isPromo === true } : {}),
      price: isPromo && price != null && price !== '' ? Number(price) : null,
      ...(order != null ? { order: Number(order) } : {}),
      ...(active != null ? { active: active !== false } : {}),
    })
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
  if (!await isAuthed()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const { id } = await params
    await deleteBanner(Number(id))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el banner' }, { status: 500 })
  }
}
