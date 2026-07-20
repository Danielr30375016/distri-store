// Comprime y redimensiona una imagen en el navegador antes de subirla.
// Reduce drásticamente el peso (p. ej. de ~5 MB a ~150-250 KB) para ahorrar
// almacenamiento y ancho de banda en Vercel Blob y acelerar la carga de la web.

const MAX_DIMENSION = 1400 // lado máximo en px
const QUALITY = 0.82

export async function compressImage(file: File): Promise<File> {
  // No tocar SVG/GIF (animaciones/vectores) ni archivos que no sean imagen raster.
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/webp', QUALITY)
    )
    if (!blob) return file

    // Si la "compresión" no ayudó (imagen ya muy chica), conservar el original.
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([blob], newName, { type: 'image/webp' })
  } catch {
    // Ante cualquier fallo, subir el archivo original.
    return file
  }
}
