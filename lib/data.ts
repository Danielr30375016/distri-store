import { prisma } from './db'

export interface Product {
  id: number
  name: string
  price: number
  images: string[]
  desc: string
  category: string
  subcategory: string | null
  reference: string | null
  brand: string | null
  discount: number
  stock: boolean
}

export interface Brand {
  id: number
  name: string
}

export interface Subcategory {
  id: number
  name: string
  categoryId: number
}

export interface Category {
  id: number
  name: string
  subcategories: Subcategory[]
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Martillo Pro",
    price: 15000,
    images: ["/products/martillo-pro.svg"],
    desc: "Martillo de acero forjado con mango ergonómico.",
    category: "Manuales",
    subcategory: "Martillos",
    reference: "MP-001",
    brand: "Stanley",
    discount: 0,
    stock: true,
  },
  {
    id: 2,
    name: "Taladro Inalámbrico",
    price: 120000,
    images: ["/products/taladro-inalambrico.svg"],
    desc: "Taladro de 18V con dos baterías incluidas.",
    category: "Eléctricas",
    subcategory: "Taladros",
    reference: "TI-018",
    brand: "DeWalt",
    discount: 10,
    stock: true,
  },
  {
    id: 3,
    name: "Caja de Herramientas",
    price: 45000,
    images: ["/products/caja-de-herramientas.svg"],
    desc: "Caja de plástico reforzado con compartimentos.",
    category: "Almacenamiento",
    subcategory: null,
    reference: "CH-100",
    brand: "Truper",
    discount: 0,
    stock: false,
  },
]

export async function getProducts(): Promise<Product[]> {
  try {
    return await prisma.product.findMany()
  } catch {
    return mockProducts
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    return await prisma.product.findUnique({
      where: { id }
    })
  } catch {
    return mockProducts.find(p => p.id === id) || null
  }
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  try {
    return await prisma.product.create({ data })
  } catch (err) {
    console.error('[createProduct] Error:', err)
    throw err
  }
}

export async function updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<Product> {
  return prisma.product.update({ where: { id }, data })
}

export async function deleteProduct(id: number): Promise<void> {
  await prisma.product.delete({ where: { id } })
}

/* ----------------------------- Marcas ----------------------------- */

export async function getBrands(): Promise<Brand[]> {
  try {
    return await prisma.brand.findMany({ orderBy: { name: 'asc' } })
  } catch {
    return []
  }
}

export async function createBrand(name: string): Promise<Brand> {
  return prisma.brand.create({ data: { name } })
}

export async function deleteBrand(id: number): Promise<void> {
  await prisma.brand.delete({ where: { id } })
}

/* --------------------- Categorías y subcategorías --------------------- */

export async function getCategories(): Promise<Category[]> {
  try {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { subcategories: { orderBy: { name: 'asc' } } },
    })
  } catch {
    return []
  }
}

export async function createCategory(name: string): Promise<Category> {
  return prisma.category.create({
    data: { name },
    include: { subcategories: true },
  })
}

export async function deleteCategory(id: number): Promise<void> {
  await prisma.category.delete({ where: { id } })
}

export async function createSubcategory(categoryId: number, name: string): Promise<Subcategory> {
  return prisma.subcategory.create({ data: { categoryId, name } })
}

export async function deleteSubcategory(id: number): Promise<void> {
  await prisma.subcategory.delete({ where: { id } })
}
