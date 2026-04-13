import 'dotenv/config'
import { prisma } from '../lib/db'

async function main() {
  // Limpiar datos existentes
  await prisma.product.deleteMany()

  // Insertar productos
  await prisma.product.createMany({
    data: [
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
  })

  console.log('Datos sembrados exitosamente')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })