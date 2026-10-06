import { NextResponse } from 'next/server'
import { getBrands, createBrand } from '../../../lib/data'
import { requireAdmin } from '../../../lib/auth'

export async function GET() {
  const brands = await getBrands()
  return NextResponse.json(brands)
}

export async function POST(request: Request) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { name, image } = await request.json()
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }
    const brand = await createBrand(String(name).trim(), image ? String(image).trim() : null)
    return NextResponse.json(brand, { status: 201 })
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Esa marca ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear la marca' }, { status: 500 })
  }
}
