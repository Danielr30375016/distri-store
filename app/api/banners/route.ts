import { NextResponse } from 'next/server'
import { getBanners, createBanner } from '../../../lib/data'
import { requireAdmin } from '../../../lib/auth'

export async function GET() {
  const banners = await getBanners()
  return NextResponse.json(banners)
}

export async function POST(request: Request) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { image, title, isPromo, price, order, active } = body
    if (!image || typeof image !== 'string' || !image.trim()) {
      return NextResponse.json({ error: 'La imagen es obligatoria' }, { status: 400 })
    }
    const banner = await createBanner({
      image: image.trim(),
      title: (title ?? '').toString().slice(0, 120),
      isPromo: isPromo === true,
      price: isPromo && price != null && price !== '' ? Number(price) : null,
      order: Number(order ?? 0),
      active: active !== false,
    })
    return NextResponse.json(banner, { status: 201 })
  } catch (err) {
    console.error('Error al crear banner:', err)
    return NextResponse.json({ error: 'Error al crear el banner' }, { status: 500 })
  }
}
