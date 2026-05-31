import { prisma } from './db'

export interface Product {
  id: number
  name: string
  price: number
  image: string | null
  desc: string
  category: string
  discount: number
  stock: boolean
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Martillo Pro",
    price: 15000,
    image: "/products/martillo-pro.svg",
    desc: "Martillo de acero forjado con mango ergonómico.",
    category: "Manuales",
    discount: 0,
    stock: true,
  },
  {
    id: 2,
    name: "Taladro Inalámbrico",
    price: 120000,
    image: "/products/taladro-inalambrico.svg",
    desc: "Taladro de 18V con dos baterías incluidas.",
    category: "Eléctricas",
    discount: 10,
    stock: true,
  },
  {
    id: 3,
    name: "Caja de Herramientas",
    price: 45000,
    image: "/products/caja-de-herramientas.svg",
    desc: "Caja de plástico reforzado con compartimentos.",
    category: "Almacenamiento",
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