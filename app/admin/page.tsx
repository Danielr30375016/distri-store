'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: number
  name: string
  price: number
  image: string | null
  desc: string
  category: string
}

const emptyForm = { name: '', price: '', image: '', desc: '', category: '' }

const NAME_MAX = 80
const DESC_MAX = 600

function formatPrice(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('es-AR')
}

function parsePrice(formatted: string): number {
  return Number(formatted.replace(/\./g, '').replace(/,/g, ''))
}

export default function AdminPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  async function fetchProducts() {
    setLoading(true)
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }

  async function fetchCategories() {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data)
  }

  useEffect(() => { fetchProducts(); fetchCategories() }, [])

  function openCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setShowNewCategory(false)
    setNewCategory('')
    setShowForm(true)
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      price: formatPrice(String(product.price)),
      image: product.image ?? '',
      desc: product.desc,
      category: product.category,
    })
    setEditingId(product.id)
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowNewCategory(false)
    setNewCategory('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      price: parsePrice(form.price),
      image: form.image || null,
      desc: form.desc,
      category: form.category,
    }

    try {
      const res = editingId
        ? await fetch(`/api/products/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (res.ok) {
        closeForm()
        await fetchProducts()
        await fetchCategories()
      } else {
        const data = await res.json()
        setError(data.error || 'Error al guardar')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Seguro que querés eliminar este producto?')) return
    setDeletingId(id)

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchProducts()
      }
    } finally {
      setDeletingId(null)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter">
          DISTRI<span className="text-orange-500">STORE</span>
          <span className="text-neutral-500 font-medium text-sm ml-2">/ Admin</span>
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={openCreate}
            className="bg-orange-600 hover:bg-orange-500 text-black font-black px-4 py-2 rounded-xl text-sm uppercase tracking-tighter transition-all"
          >
            + Nuevo Producto
          </button>
          <button
            onClick={handleLogout}
            className="text-neutral-500 hover:text-white text-sm font-medium transition-all"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabla de productos */}
        {loading ? (
          <p className="text-neutral-500 text-center py-16">Cargando productos...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500 mb-4">No hay productos todavía.</p>
            <button onClick={openCreate} className="text-orange-500 hover:text-orange-400 font-bold">
              Crear el primer producto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-neutral-400 uppercase text-xs tracking-widest">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-900 transition-colors">
                    <td className="px-4 py-3 text-neutral-500">{p.id}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-neutral-800 text-orange-400 text-xs font-bold px-2 py-1 rounded-full">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-orange-400">
                      ${p.price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="bg-red-950 hover:bg-red-900 disabled:opacity-50 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                          {deletingId === p.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-black tracking-tighter mb-6">
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Nombre *</label>
                    <span className={`text-xs font-medium ${form.name.length >= NAME_MAX ? 'text-red-400' : 'text-neutral-500'}`}>{form.name.length}/{NAME_MAX}</span>
                  </div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, NAME_MAX) })}
                    required
                    maxLength={NAME_MAX}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Precio *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-bold">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: formatPrice(e.target.value) })}
                      required
                      placeholder="0"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Categoría *</label>
                  {!showNewCategory ? (
                    <div className="flex gap-2">
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        required
                        className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                      >
                        <option value="">Seleccionar...</option>
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setShowNewCategory(true); setForm({ ...form, category: '' }) }}
                        className="bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-bold px-3 rounded-xl transition-all whitespace-nowrap"
                        title="Nueva categoría"
                      >
                        + Nueva
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => { setNewCategory(e.target.value); setForm({ ...form, category: e.target.value }) }}
                        placeholder="Nombre de la nueva categoría"
                        required
                        autoFocus
                        className="flex-1 bg-neutral-800 border border-orange-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => { setShowNewCategory(false); setNewCategory(''); setForm({ ...form, category: '' }) }}
                        className="bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-bold px-3 rounded-xl transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Descripción *</label>
                    <span className={`text-xs font-medium ${form.desc.length >= DESC_MAX ? 'text-red-400' : 'text-neutral-500'}`}>{form.desc.length}/{DESC_MAX}</span>
                  </div>
                  <textarea
                    value={form.desc}
                    onChange={(e) => setForm({ ...form, desc: e.target.value.slice(0, DESC_MAX) })}
                    required
                    rows={3}
                    maxLength={DESC_MAX}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-all resize-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">URL de imagen</label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://... o /products/mi-producto.jpg"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                  />
                  {form.image && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-800 flex items-center justify-center h-40">
                      <img
                        src={form.image}
                        alt="Preview"
                        className="h-full w-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-black py-2.5 rounded-xl text-sm uppercase tracking-tighter transition-all"
                >
                  {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
