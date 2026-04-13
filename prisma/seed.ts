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
        image: "/products/martillo-pro.svg",
        desc: "Martillo de acero forjado con mango ergonómico.",
        category: "Manuales"
      },
      {
        id: 2,
        name: "Taladro Inalámbrico",
        price: 120000,
        image: "/products/taladro-inalambrico.svg",
        desc: "Taladro de 18V con dos baterías incluidas.",
        category: "Eléctricas"
      },
      {
        id: 3,
        name: "Caja de Herramientas",
        price: 45000,
        image: "/products/caja-de-herramientas.svg",
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