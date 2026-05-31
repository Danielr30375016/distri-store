'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/src/context/ThemeContext'

interface Product {
  id: number
  name: string
  price: number
  image: string | null
  desc: string
  category: string
  discount: number
  stock: boolean
}

const emptyForm = { name: '', price: '', image: '', desc: '', category: '', discount: '0', stock: true }

const NAME_MAX = 80
const DESC_MAX = 600
const PAGE_SIZE = 15

type SortField = 'id' | 'name' | 'category' | 'price' | 'discount'
type SortDir = 'asc' | 'desc'

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
  const { theme, toggleTheme } = useTheme()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  // Búsqueda, orden y paginación
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortField, setSortField] = useState<SortField>('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter(p => {
      if (filterCategory && p.category !== filterCategory) return false
      if (!q) return true
      return (
        String(p.id).includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    })
  }, [products, search, filterCategory])

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let va: string | number = a[sortField]
      let vb: string | number = b[sortField]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredProducts, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE))
  const pagedProducts = sortedProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
      discount: String(product.discount ?? 0),
      stock: product.stock,
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
      discount: Math.min(100, Math.max(0, Number(form.discount) || 0)),
      stock: form.stock,
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

  async function handleDelete(product: Product) {
    setConfirmDelete(product)
  }

  async function confirmDeleteAction() {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    setConfirmDelete(null)
    try {
      const res = await fetch(`/api/products/${confirmDelete.id}`, { method: 'DELETE' })
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
    <div className="min-h-screen bg-orange-50 dark:bg-neutral-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-6 py-4 flex justify-between items-center shadow-sm dark:shadow-none">
        <h1 className="text-xl font-black tracking-tighter">
          DISTRI<span className="text-orange-500">STORE</span>
          <span className="text-gray-400 dark:text-neutral-500 font-medium text-sm ml-2">/ Admin</span>
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="bg-orange-600 hover:bg-orange-500 text-black font-black px-4 py-2 rounded-xl text-sm uppercase tracking-tighter transition-all"
          >
            + Nuevo Producto
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 transition-all text-base"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-all"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar por ID, nombre o categoría..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-400 dark:placeholder-neutral-500"
          />
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(search || filterCategory) && (
            <button
              onClick={() => { setSearch(''); setFilterCategory(''); setPage(1) }}
              className="bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white text-xs font-bold px-4 rounded-xl transition-all"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Tabla de productos */}
        {loading ? (
          <p className="text-gray-400 dark:text-neutral-500 text-center py-16">Cargando productos...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 dark:text-neutral-500 mb-4">No hay productos todavía.</p>
            <button onClick={openCreate} className="text-orange-500 hover:text-orange-400 font-bold">
              Crear el primer producto
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-neutral-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 uppercase text-xs tracking-widest select-none">
                  <tr>
                    {([
                      { field: 'id', label: 'ID', align: 'text-left' },
                      { field: 'name', label: 'Nombre', align: 'text-left' },
                      { field: 'category', label: 'Categoría', align: 'text-left' },
                      { field: 'price', label: 'Precio', align: 'text-right' },
                      { field: 'discount', label: 'Descuento', align: 'text-center' },
                    ] as { field: SortField; label: string; align: string }[]).map(col => (
                      <th
                        key={col.field}
                        onClick={() => handleSort(col.field)}
                        className={`px-4 py-3 ${col.align} cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors group`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <span className="text-[10px] opacity-50 group-hover:opacity-100">
                            {sortField === col.field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {pagedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-neutral-500">
                        Sin resultados para esa búsqueda.
                      </td>
                    </tr>
                  ) : pagedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-orange-50/80 dark:hover:bg-neutral-900 transition-colors">
                      <td className="px-4 py-3 text-gray-400 dark:text-neutral-500">{p.id}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className="bg-orange-100 dark:bg-neutral-800 text-orange-600 dark:text-orange-400 text-xs font-bold px-2 py-1 rounded-full">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-orange-400">
                        ${p.price.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.discount > 0 ? (
                          <span className="bg-green-950 text-green-400 text-xs font-black px-2 py-1 rounded-full">
                            -{p.discount}%
                          </span>
                        ) : (
                          <span className="text-neutral-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.stock ? (
                          <span className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs font-black px-2 py-1 rounded-full">En stock</span>
                        ) : (
                          <span className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-black px-2 py-1 rounded-full">Agotado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deletingId === p.id}
                            className="bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 disabled:opacity-50 text-red-700 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
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

            {/* Paginación */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-gray-400 dark:text-neutral-500 text-xs">
                {filteredProducts.length === 0
                  ? 'Sin resultados'
                  : `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredProducts.length)} de ${filteredProducts.length} productos`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-all text-xs font-bold"
                >
                  «
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-all text-xs font-bold"
                >
                  ‹ Ant
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                  .reduce<(number | '...')[]>((acc, n, i, arr) => {
                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                    acc.push(n)
                    return acc
                  }, [])
                  .map((n, i) =>
                    n === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-neutral-600 text-xs">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n as number)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                          page === n
                            ? 'bg-orange-600 border-orange-600 text-black'
                            : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-all text-xs font-bold"
                >
                  Sig ›
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-all text-xs font-bold"
                >
                  »
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🗑️</div>
              <h2 className="text-lg font-black tracking-tighter text-gray-900 dark:text-white mb-2">
                ¿Eliminar producto?
              </h2>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                Estás por eliminar <span className="font-bold text-gray-900 dark:text-white">{confirmDelete.name}</span>.
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-white font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAction}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl text-sm uppercase tracking-tighter transition-all"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-black tracking-tighter mb-6 text-gray-900 dark:text-white">
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest">Nombre *</label>
                    <span className={`text-xs font-medium ${form.name.length >= NAME_MAX ? 'text-red-400' : 'text-gray-400 dark:text-neutral-500'}`}>{form.name.length}/{NAME_MAX}</span>
                  </div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, NAME_MAX) })}
                    required
                    maxLength={NAME_MAX}
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Precio *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-400 text-sm font-bold">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: formatPrice(e.target.value) })}
                      required
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Descuento (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="100"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-400 text-sm font-bold">%</span>
                  </div>
                  {Number(form.discount) > 0 && (
                    <p className="text-green-400 text-xs mt-1 font-bold">
                      Precio final: ${Math.round(parsePrice(form.price) * (1 - Number(form.discount) / 100)).toLocaleString('es-AR')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Categoría *</label>
                  {!showNewCategory ? (
                    <div className="flex gap-2">
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        required
                        className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                      >
                        <option value="">Seleccionar...</option>
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setShowNewCategory(true); setForm({ ...form, category: '' }) }}
                        className="bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-white text-xs font-bold px-3 rounded-xl transition-all whitespace-nowrap"
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
                        className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-orange-500 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => { setShowNewCategory(false); setNewCategory(''); setForm({ ...form, category: '' }) }}
                        className="bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-white text-xs font-bold px-3 rounded-xl transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest">Descripción *</label>
                    <span className={`text-xs font-medium ${form.desc.length >= DESC_MAX ? 'text-red-400' : 'text-gray-400 dark:text-neutral-500'}`}>{form.desc.length}/{DESC_MAX}</span>
                  </div>
                  <textarea
                    value={form.desc}
                    onChange={(e) => setForm({ ...form, desc: e.target.value.slice(0, DESC_MAX) })}
                    required
                    rows={3}
                    maxLength={DESC_MAX}
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all resize-none"
                  />
                </div>

                <div className="col-span-2">                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-2">Stock</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, stock: !form.stock })}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      form.stock ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      form.stock ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className={`ml-3 text-sm font-bold ${
                    form.stock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {form.stock ? 'En stock' : 'Agotado'}
                  </span>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">URL de imagen</label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://... o /products/mi-producto.jpg"
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                  />
                  {form.image && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center h-40">
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
                  className="flex-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-white font-bold py-2.5 rounded-xl text-sm transition-all"
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
