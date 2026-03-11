import ProductCard from '../../components/ProductCard'

const PRODUCTOS = [
  { id: 1, name: "Martillo Pro", price: 15000 },
  { id: 2, name: "Taladro Inalámbrico", price: 120000 },
  { id: 3, name: "Caja de Herramientas", price: 45000 },
]

export default function ProductosPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Nuestros Productos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRODUCTOS.map(p => <ProductCard key={p.id} {...p} />)}
      </div>
    </div>
  )
}