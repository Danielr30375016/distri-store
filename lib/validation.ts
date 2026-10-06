import { z } from 'zod'

const trimmedString = (max: number) => z.string().trim().min(1).max(max)
const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform(v => (v ? v : null))

export const productCreateSchema = z.object({
  name: trimmedString(200),
  price: z.coerce.number().int().min(0),
  images: z.array(z.string().trim().min(1)).max(6).default([]),
  desc: trimmedString(5000),
  category: trimmedString(120),
  subcategory: optionalTrimmed(120),
  reference: optionalTrimmed(120),
  brand: optionalTrimmed(120),
  discount: z.coerce.number().int().min(0).max(100).default(0),
  stock: z.coerce.boolean().default(true),
  quantity: z.coerce.number().int().min(0).default(0),
})

export const productUpdateSchema = productCreateSchema.partial()

export const bannerCreateSchema = z.object({
  image: trimmedString(2000),
  title: z.string().trim().max(120).default(''),
  isPromo: z.coerce.boolean().default(false),
  price: z.coerce.number().int().min(0).optional().nullable(),
  order: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(true),
})

export const bannerUpdateSchema = bannerCreateSchema.partial()

export const brandCreateSchema = z.object({
  name: trimmedString(120),
  image: optionalTrimmed(2000),
})

export const brandUpdateSchema = brandCreateSchema.partial()

export const categoryCreateSchema = z.object({
  name: trimmedString(120),
  image: optionalTrimmed(2000),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export const subcategoryCreateSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: trimmedString(120),
})

export const checkoutSchema = z.object({
  customerName: trimmedString(150),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(200),
  address: trimmedString(300),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).max(999),
      })
    )
    .min(1),
})

/** Formatea el primer error de un ZodError para devolverlo en la respuesta de la API. */
export function firstZodError(error: z.ZodError): string {
  const issue = error.issues[0]
  return issue ? `${issue.path.join('.')}: ${issue.message}` : 'Datos inválidos'
}
