import { NextResponse } from 'next/server'
import { getCategories, createCategory } from '../../../lib/data'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '../../../lib/auth'

export async function GET() {
  const categories = await getCategories()
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!await verifyAdminToken(token ?? '')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { name } = await request.json()
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }
    const category = await createCategory(String(name).trim())
    return NextResponse.json(category, { status: 201 })
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Esa categoría ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 })
  }
}
