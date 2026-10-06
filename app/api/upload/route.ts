import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAdmin } from '../../../lib/auth'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
// SVG eliminado: un SVG puede contener <script> y ejecutar JavaScript (XSS almacenado).
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

export async function POST(request: Request) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Falta configurar BLOB_READ_WRITE_TOKEN (Vercel Blob).' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }
    if (!(file.type in ALLOWED)) {
      return NextResponse.json({ error: 'Formato de imagen no permitido' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen supera los 5 MB' }, { status: 400 })
    }

    // No usar el nombre original tal cual (puede traer ../, espacios o caracteres raros)
    const base = file.name.replace(/\.[^.]*$/, '').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || 'imagen'
    const blob = await put(`products/${base}.${ALLOWED[file.type]}`, file, {
      contentType: file.type,
      access: 'public',
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('Error al subir imagen:', err)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}
