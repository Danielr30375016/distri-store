import { z } from 'zod'

const trimmedString = (max: number) => z.string().trim().min(1).max(max)
const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform(v => (v ? v : null))

/** Solo URLs https o rutas locales (/products/x.svg). Bloquea javascript:, data:, http:, //host, etc. */
export function isSafeImageUrl(value: string): boolean {
  const v = value.trim()
  if (v.startsWith('/') && !v.startsWith('//')) return true
  try {
    return new URL(v).protocol === 'https:'
  } catch {
    return false
  }
}

const imageUrl = z.string().trim().min(1).max(2000).refine(isSafeImageUrl, 'Debe ser una URL https')
const optionalImageUrl = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .nullable()
  .refine(v => !v || isSafeImageUrl(v), 'Debe ser una URL https')
  .transform(v => (v ? v : null))

// IMPORTANTE: se usa z.boolean() y no z.coerce.boolean(), porque coerce convierte
// el string "false" en true.

// Campos SIN valores por defecto: así sirven para el schema de actualización.
// (En Zod 4, `.partial()` conserva los `.default()`, y un PUT parcial reseteaba
// discount a 0, stock a true, quantity a 0 e images a [].)
const productFields = {
  name: trimmedString(200),
  price: z.coerce.number().int().min(0).max(1_000_000_000),
  images: z.array(imageUrl).max(6),
  desc: trimmedString(5000),
  category: trimmedString(120),
  subcategory: optionalTrimmed(120),
  reference: optionalTrimmed(120),
  brand: optionalTrimmed(120),
  discount: z.coerce.number().int().min(0).max(100),
  stock: z.boolean(),
  quantity: z.coerce.number().int().min(0).max(1_000_000),
}

export const productCreateSchema = z.object({
  ...productFields,
  images: productFields.images.default([]),
  discount: productFields.discount.default(0),
  stock: productFields.stock.default(true),
  quantity: productFields.quantity.default(0),
})

export const productUpdateSchema = z.object(productFields).partial()

const bannerFields = {
  image: imageUrl,
  title: z.string().trim().max(120),
  isPromo: z.boolean(),
  price: z.coerce.number().int().min(0).max(1_000_000_000).nullable(),
  order: z.coerce.number().int().min(-1000).max(1000),
  active: z.boolean(),
}

export const bannerCreateSchema = z.object({
  ...bannerFields,
  title: bannerFields.title.default(''),
  isPromo: bannerFields.isPromo.default(false),
  price: bannerFields.price.optional(),
  order: bannerFields.order.default(0),
  active: bannerFields.active.default(true),
})

export const bannerUpdateSchema = z.object(bannerFields).partial()

export const brandCreateSchema = z.object({
  name: trimmedString(120),
  image: optionalImageUrl,
})

export const brandUpdateSchema = brandCreateSchema.partial()

export const categoryCreateSchema = z.object({
  name: trimmedString(120),
  image: optionalImageUrl,
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export const subcategoryCreateSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: trimmedString(120),
})

export const checkoutSchema = z.object({
  customerName: trimmedString(150),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^[+\d\s()-]+$/, 'Teléfono inválido'),
  email: z.string().trim().toLowerCase().email().max(200),
  address: trimmedString(300),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
})

/** Convierte el id de la URL a entero positivo, o null si no es válido. */
export function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 && n <= 2_147_483_647 ? n : null
}

/** Formatea el primer error de un ZodError para devolverlo en la respuesta de la API. */
export function firstZodError(error: z.ZodError): string {
  const issue = error.issues[0]
  return issue ? `${issue.path.join('.')}: ${issue.message}` : 'Datos inválidos'
}
