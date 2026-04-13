import { prisma } from './db'

export interface Product {
  id: number
  name: string
  price: number
  image: string | null
  desc: string
  category: string
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Martillo Pro",
    price: 15000,
    image: "https://images.unsplash.com/photo-1586864387917-f539b1684bb0?q=80&w=500",
    desc: "Martillo de acero forjado con mango ergonómico.",
    category: "Manuales"
  },
  {
    id: 2,
    name: "Taladro Inalámbrico",
    price: 120000,
    image: "https://images.unsplash.com/photo-1504148455328-497c596d229c?q=80&w=500",
    desc: "Taladro de 18V con dos baterías incluidas.",
    category: "Eléctricas"
  },
  {
    id: 3,
    name: "Caja de Herramientas",
    price: 45000,
    image: "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?q=80&w=500",
    desc: "Caja de plástico reforzado con compartimentos.",
    category: "Almacenamiento"
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