import 'dotenv/config'
import { prisma } from '../lib/db'

async function main() {
  // Seguridad: el seed BORRA el catálogo; nunca ejecutarlo en producción.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed borra todos los productos; no se ejecuta en producción.')
  }
  // Limpiar datos existentes (sin ids explícitos: rompían la secuencia autoincrement)
  await prisma.product.deleteMany()

  // Insertar productos
  await prisma.product.createMany({
    data: [
      {
        name: "Martillo Pro",
        price: 15000,
        images: ["/products/martillo-pro.svg"],
        desc: "Martillo de acero forjado con mango ergonómico.",
        category: "Manuales"
      },
      {
        name: "Taladro Inalámbrico",
        price: 120000,
        images: ["/products/taladro-inalambrico.svg"],
        desc: "Taladro de 18V con dos baterías incluidas.",
        category: "Eléctricas"
      },
      {
        name: "Caja de Herramientas",
        price: 45000,
        images: ["/products/caja-de-herramientas.svg"],
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