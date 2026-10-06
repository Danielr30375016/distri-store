import { NextResponse } from 'next/server'
import { getBanners, createBanner } from '../../../lib/data'
import { requireAdmin } from '../../../lib/auth'
import { bannerCreateSchema, firstZodError } from '../../../lib/validation'

export async function GET() {
  const banners = await getBanners()
  return NextResponse.json(banners)
}

export async function POST(request: Request) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const parsed = bannerCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  try {
    const { price, ...rest } = parsed.data
    const banner = await createBanner({ ...rest, price: rest.isPromo ? (price ?? null) : null })
    return NextResponse.json(banner, { status: 201 })
  } catch (err) {
    console.error('Error al crear banner:', err)
    return NextResponse.json({ error: 'Error al crear el banner' }, { status: 500 })
  }
}
