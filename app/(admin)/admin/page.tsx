'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/src/context/ThemeContext'
import { compressImage } from '@/lib/imageCompress'

interface Product {
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
  quantity: number
}

interface Subcategory {
  id: number
  name: string
  categoryId: number
}

interface Category {
  id: number
  name: string
  image: string | null
  subcategories: Subcategory[]
}

interface Brand {
  id: number
  name: string
  image: string | null
}

interface Banner {
  id: number
  image: string
  title: string
  isPromo: boolean
  price: number | null
  order: number
  active: boolean
}

const emptyBanner = {
  image: '',
  title: '',
  isPromo: false,
  price: '',
  order: '0',
  active: true,
}

const emptyForm = {
  name: '',
  price: '',
  images: [] as string[],
  desc: '',
  category: '',
  subcategory: '',
  reference: '',
  brand: '',
  discount: '0',
  stock: true,
  quantity: '0',
}

const MAX_IMAGES = 6

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
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])

  // Banners del carrusel
  const [banners, setBanners] = useState<Banner[]>([])
  const [showBanners, setShowBanners] = useState(false)
  const [bannerForm, setBannerForm] = useState(emptyBanner)
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null)
  const [bannerBusy, setBannerBusy] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerError, setBannerError] = useState('')

  // Manejo de imágenes (hasta 6, por URL o subida desde la PC)
  const [imgUrl, setImgUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [imgError, setImgError] = useState('')

  // Modal de gestión de catálogo (marcas / categorías / subcategorías)
  const [showCatalog, setShowCatalog] = useState(false)
  const [catalogTab, setCatalogTab] = useState<'marcas' | 'categorias'>('categorias')
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandImage, setNewBrandImage] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [newCatImage, setNewCatImage] = useState('')
  const [newSubName, setNewSubName] = useState<Record<number, string>>({})
  const [catalogError, setCatalogError] = useState('')
  const [catalogBusy, setCatalogBusy] = useState(false)
  const [catalogUploading, setCatalogUploading] = useState('') // clave del item que está subiendo imagen

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
        p.category.toLowerCase().includes(q) ||
        (p.brand?.toLowerCase().includes(q) ?? false) ||
        (p.reference?.toLowerCase().includes(q) ?? false)
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

  // Subcategorías disponibles según la categoría elegida en el formulario
  const formSubcategories = useMemo(() => {
    return categories.find(c => c.name === form.category)?.subcategories ?? []
  }, [categories, form.category])

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

  async function fetchBrands() {
    const res = await fetch('/api/brands')
    const data = await res.json()
    setBrands(data)
  }

  async function fetchBanners() {
    const res = await fetch('/api/banners')
    const data = await res.json()
    setBanners(Array.isArray(data) ? data : [])
  }

  useEffect(() => { fetchProducts(); fetchCategories(); fetchBrands(); fetchBanners() }, [])

  /* --------------------------- Banners --------------------------- */

  function resetBannerForm() {
    setBannerForm(emptyBanner)
    setEditingBannerId(null)
    setBannerError('')
  }

  function editBanner(b: Banner) {
    setBannerForm({
      image: b.image,
      title: b.title,
      isPromo: b.isPromo,
      price: b.price != null ? String(b.price) : '',
      order: String(b.order),
      active: b.active,
    })
    setEditingBannerId(b.id)
    setBannerError('')
  }

  async function handleBannerImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0]
    e.target.value = ''
    if (!original) return
    setBannerUploading(true)
    setBannerError('')
    try {
      const file = await compressImage(original)
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.url) {
        setBannerForm(prev => ({ ...prev, image: data.url }))
      } else {
        setBannerError(data.error || 'Error al subir la imagen')
      }
    } catch {
      setBannerError('Error de conexión al subir la imagen')
    } finally {
      setBannerUploading(false)
    }
  }

  async function saveBanner() {
    if (!bannerForm.image.trim()) {
      setBannerError('La imagen es obligatoria')
      return
    }
    setBannerBusy(true)
    setBannerError('')
    const payload = {
      image: bannerForm.image.trim(),
      title: bannerForm.title.trim(),
      isPromo: bannerForm.isPromo,
      price: bannerForm.isPromo ? (parsePrice(bannerForm.price) || null) : null,
      order: Number(bannerForm.order) || 0,
      active: bannerForm.active,
    }
    try {
      const res = editingBannerId
        ? await fetch(`/api/banners/${editingBannerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      if (res.ok) {
        resetBannerForm()
        await fetchBanners()
      } else {
        const data = await res.json()
        setBannerError(data.error || 'Error al guardar el banner')
      }
    } finally {
      setBannerBusy(false)
    }
  }

  async function deleteBannerItem(id: number) {
    await fetch(`/api/banners/${id}`, { method: 'DELETE' })
    if (editingBannerId === id) resetBannerForm()
    await fetchBanners()
  }

  function openCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setImgUrl('')
    setImgError('')
    setShowForm(true)
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      price: formatPrice(String(product.price)),
      images: product.images ?? [],
      desc: product.desc,
      category: product.category,
      subcategory: product.subcategory ?? '',
      reference: product.reference ?? '',
      brand: product.brand ?? '',
      discount: String(product.discount ?? 0),
      stock: product.stock,
      quantity: String(product.quantity ?? 0),
    })
    setEditingId(product.id)
    setError('')
    setImgUrl('')
    setImgError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setImgUrl('')
    setImgError('')
  }

  function addImageUrl() {
    const url = imgUrl.trim()
    if (!url) return
    if (form.images.length >= MAX_IMAGES) {
      setImgError(`Máximo ${MAX_IMAGES} imágenes`)
      return
    }
    setForm({ ...form, images: [...form.images, url] })
    setImgUrl('')
    setImgError('')
  }

  function removeImage(index: number) {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
    setImgError('')
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (files.length === 0) return

    const available = MAX_IMAGES - form.images.length
    if (available <= 0) {
      setImgError(`Máximo ${MAX_IMAGES} imágenes`)
      return
    }

    setUploading(true)
    setImgError('')
    const uploaded: string[] = []
    try {
      for (const original of files.slice(0, available)) {
        const file = await compressImage(original)
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok && data.url) {
          uploaded.push(data.url)
        } else {
          setImgError(data.error || 'Error al subir la imagen')
        }
      }
      if (uploaded.length > 0) {
        setForm(prev => ({ ...prev, images: [...prev.images, ...uploaded].slice(0, MAX_IMAGES) }))
      }
      if (files.length > available) {
        setImgError(`Solo se agregaron ${available}; el máximo es ${MAX_IMAGES} imágenes`)
      }
    } catch {
      setImgError('Error de conexión al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      price: parsePrice(form.price),
      images: form.images,
      desc: form.desc,
      category: form.category,
      subcategory: form.subcategory,
      reference: form.reference,
      brand: form.brand,
      discount: Math.min(100, Math.max(0, Number(form.discount) || 0)),
      stock: form.stock,
      quantity: Math.max(0, Number(form.quantity) || 0),
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

  /* --------- Gestión de catálogo (marcas / categorías / subcategorías) --------- */

  // Sube un archivo (comprimido) y devuelve la URL, o null si falla.
  async function uploadFile(file: File): Promise<string | null> {
    const compressed = await compressImage(file)
    const fd = new FormData()
    fd.append('file', compressed)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok && data.url) return data.url
    setCatalogError(data.error || 'Error al subir la imagen')
    return null
  }

  async function addBrand() {
    const name = newBrandName.trim()
    if (!name) return
    setCatalogBusy(true)
    setCatalogError('')
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: newBrandImage || null }),
      })
      if (res.ok) {
        setNewBrandName('')
        setNewBrandImage('')
        await fetchBrands()
      } else {
        const data = await res.json()
        setCatalogError(data.error || 'Error al crear la marca')
      }
    } finally {
      setCatalogBusy(false)
    }
  }

  async function setBrandImage(id: number, image: string | null) {
    const res = await fetch(`/api/brands/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    })
    if (res.ok) await fetchBrands()
    else {
      const data = await res.json()
      setCatalogError(data.error || 'Error al actualizar la marca')
    }
  }

  async function deleteBrandItem(id: number) {
    const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' })
    if (res.ok) await fetchBrands()
    else {
      const data = await res.json().catch(() => ({}))
      setCatalogError(data.error || 'Error al eliminar la marca')
    }
  }

  async function addCategory() {
    const name = newCatName.trim()
    if (!name) return
    setCatalogBusy(true)
    setCatalogError('')
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: newCatImage || null }),
      })
      if (res.ok) {
        setNewCatName('')
        setNewCatImage('')
        await fetchCategories()
      } else {
        const data = await res.json()
        setCatalogError(data.error || 'Error al crear la categoría')
      }
    } finally {
      setCatalogBusy(false)
    }
  }

  async function setCategoryImage(id: number, image: string | null) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    })
    if (res.ok) await fetchCategories()
    else {
      const data = await res.json()
      setCatalogError(data.error || 'Error al actualizar la categoría')
    }
  }

  async function deleteCategoryItem(id: number) {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (res.ok) await fetchCategories()
    else {
      const data = await res.json().catch(() => ({}))
      setCatalogError(data.error || 'Error al eliminar la categoría')
    }
  }

  // Maneja la subida de imagen para "nueva marca/categoría" o un item existente.
  async function handleCatalogImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'new-brand' | 'new-cat' | { type: 'brand' | 'cat'; id: number }
  ) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const key = typeof target === 'string' ? target : `${target.type}-${target.id}`
    setCatalogUploading(key)
    setCatalogError('')
    try {
      const url = await uploadFile(file)
      if (!url) return
      if (target === 'new-brand') setNewBrandImage(url)
      else if (target === 'new-cat') setNewCatImage(url)
      else if (target.type === 'brand') await setBrandImage(target.id, url)
      else await setCategoryImage(target.id, url)
    } finally {
      setCatalogUploading('')
    }
  }

  async function addSubcategory(categoryId: number) {
    const name = (newSubName[categoryId] ?? '').trim()
    if (!name) return
    setCatalogBusy(true)
    setCatalogError('')
    try {
      const res = await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, name }),
      })
      if (res.ok) {
        setNewSubName(prev => ({ ...prev, [categoryId]: '' }))
        await fetchCategories()
      } else {
        const data = await res.json()
        setCatalogError(data.error || 'Error al crear la subcategoría')
      }
    } finally {
      setCatalogBusy(false)
    }
  }

  async function deleteSubcategoryItem(id: number) {
    await fetch(`/api/subcategories/${id}`, { method: 'DELETE' })
    await fetchCategories()
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
            onClick={() => { setShowBanners(true); resetBannerForm() }}
            className="bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-white font-bold px-4 py-2 rounded-xl text-sm uppercase tracking-tighter transition-all"
          >
            🖼️ Banners
          </button>
          <button
            onClick={() => { setShowCatalog(true); setCatalogError('') }}
            className="bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-white font-bold px-4 py-2 rounded-xl text-sm uppercase tracking-tighter transition-all"
          >
            🏷️ Categorías
          </button>
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
            placeholder="Buscar por ID, nombre, categoría, marca o referencia..."
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
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
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
                    <th className="px-4 py-3 text-left">Marca</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {pagedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400 dark:text-neutral-500">
                        Sin resultados para esa búsqueda.
                      </td>
                    </tr>
                  ) : pagedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-orange-50/80 dark:hover:bg-neutral-900 transition-colors">
                      <td className="px-4 py-3 text-gray-400 dark:text-neutral-500">{p.id}</td>
                      <td className="px-4 py-3 font-medium">
                        {p.name}
                        {p.reference && <span className="block text-[10px] text-gray-400 dark:text-neutral-500 font-normal">Ref: {p.reference}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-orange-100 dark:bg-neutral-800 text-orange-600 dark:text-orange-400 text-xs font-bold px-2 py-1 rounded-full">
                          {p.category}
                        </span>
                        {p.subcategory && <span className="block text-[10px] text-gray-400 dark:text-neutral-500 mt-1">{p.subcategory}</span>}
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
                      <td className="px-4 py-3 text-gray-600 dark:text-neutral-300 text-xs">{p.brand || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${
                          p.quantity === 0
                            ? 'text-red-500'
                            : p.quantity <= 5
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-700 dark:text-neutral-200'
                        }`}>
                          {p.quantity ?? 0}
                        </span>
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

      {/* Modal gestión de banners */}
      {showBanners && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-8 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-black tracking-tighter text-gray-900 dark:text-white">Banners del carrusel</h2>
              <button onClick={() => { setShowBanners(false); resetBannerForm() }} className="text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Formulario crear / editar banner */}
              <div className="border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 space-y-4">
                <h3 className="font-black text-sm uppercase tracking-tighter text-gray-900 dark:text-white">
                  {editingBannerId ? 'Editar banner' : 'Nuevo banner'}
                </h3>

                {/* Imagen */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Imagen *</label>
                  {bannerForm.image ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 mb-2 bg-gray-100 dark:bg-neutral-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bannerForm.image} alt="Vista previa" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBannerForm(prev => ({ ...prev, image: '' }))}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/70 text-white text-xs hover:bg-red-600 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className={`flex items-center justify-center gap-2 w-full border border-dashed rounded-xl px-4 py-6 text-sm font-bold transition-all cursor-pointer ${
                      bannerUploading
                        ? 'border-orange-500 text-orange-500 cursor-wait'
                        : 'border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-neutral-400 hover:border-orange-500 hover:text-orange-500'
                    }`}>
                      {bannerUploading ? '⏳ Subiendo...' : '📁 Subir imagen del banner'}
                      <input type="file" accept="image/*" disabled={bannerUploading} onChange={handleBannerImageUpload} className="hidden" />
                    </label>
                  )}
                  <input
                    type="text"
                    value={bannerForm.image}
                    onChange={e => setBannerForm({ ...bannerForm, image: e.target.value })}
                    placeholder="…o pega una URL de imagen"
                    className="mt-2 w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>

                {/* Descripción corta */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Descripción corta</label>
                  <input
                    type="text"
                    value={bannerForm.title}
                    onChange={e => setBannerForm({ ...bannerForm, title: e.target.value.slice(0, 120) })}
                    placeholder="Ej. Todo en herramientas hasta 40% OFF"
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Orden */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Orden</label>
                    <input
                      type="number"
                      value={bannerForm.order}
                      onChange={e => setBannerForm({ ...bannerForm, order: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                  {/* Precio (solo si está en promo) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Precio (opcional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={bannerForm.price}
                        onChange={e => setBannerForm({ ...bannerForm, price: formatPrice(e.target.value) })}
                        disabled={!bannerForm.isPromo}
                        placeholder="0"
                        className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={bannerForm.isPromo} onChange={e => setBannerForm({ ...bannerForm, isPromo: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                    <span className="text-sm font-bold text-gray-700 dark:text-neutral-300">En promoción</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={bannerForm.active} onChange={e => setBannerForm({ ...bannerForm, active: e.target.checked })} className="w-4 h-4 accent-green-500" />
                    <span className="text-sm font-bold text-gray-700 dark:text-neutral-300">Visible en la web</span>
                  </label>
                </div>

                {bannerError && (
                  <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{bannerError}</p>
                )}

                <div className="flex gap-2">
                  {editingBannerId && (
                    <button onClick={resetBannerForm} className="flex-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={saveBanner}
                    disabled={bannerBusy || bannerUploading}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-black py-2.5 rounded-xl text-sm uppercase tracking-tighter transition-all"
                  >
                    {bannerBusy ? 'Guardando...' : editingBannerId ? 'Guardar cambios' : 'Agregar banner'}
                  </button>
                </div>
              </div>

              {/* Lista de banners */}
              {banners.length === 0 ? (
                <p className="text-gray-400 dark:text-neutral-500 text-sm text-center py-6">No hay banners todavía. El home mostrará una imagen por defecto.</p>
              ) : (
                <div className="space-y-2">
                  {banners.map(b => (
                    <div key={b.id} className="flex items-center gap-3 border border-gray-200 dark:border-neutral-800 rounded-xl p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image} alt={b.title} className="w-20 h-12 object-cover rounded-lg bg-gray-100 dark:bg-neutral-800 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{b.title || <span className="text-gray-400">(sin texto)</span>}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500">Orden {b.order}</span>
                          {b.isPromo && <span className="text-[10px] font-black bg-orange-100 dark:bg-neutral-800 text-orange-600 dark:text-orange-400 px-1.5 rounded-full">PROMO{b.price != null ? ` $${b.price.toLocaleString('es-CO')}` : ''}</span>}
                          <span className={`text-[10px] font-black px-1.5 rounded-full ${b.active ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400'}`}>
                            {b.active ? 'Visible' : 'Oculto'}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => editBanner(b)} className="bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                        Editar
                      </button>
                      <button onClick={() => deleteBannerItem(b.id)} className="bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal gestión de catálogo */}
      {showCatalog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-8 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-black tracking-tighter text-gray-900 dark:text-white">Gestionar catálogo</h2>
              <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-4">
              {(['categorias', 'marcas'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setCatalogTab(tab); setCatalogError('') }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    catalogTab === tab
                      ? 'bg-orange-600 text-black'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'categorias' ? 'Categorías y subcategorías' : 'Marcas'}
                </button>
              ))}
            </div>

            {catalogError && (
              <p className="text-red-400 text-sm mx-6 mt-3 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{catalogError}</p>
            )}

            <div className="p-6 overflow-y-auto">
              {catalogTab === 'marcas' ? (
                <>
                  {/* Alta de marca con imagen opcional */}
                  <div className="border border-gray-200 dark:border-neutral-800 rounded-xl p-3 mb-5">
                    <div className="flex gap-3">
                      <label className={`shrink-0 w-16 h-16 rounded-lg border border-dashed flex items-center justify-center overflow-hidden cursor-pointer text-center text-[10px] font-bold transition-all ${
                        catalogUploading === 'new-brand' ? 'border-orange-500 text-orange-500' : 'border-gray-300 dark:border-neutral-600 text-gray-400 hover:border-orange-500 hover:text-orange-500'
                      } bg-gray-50 dark:bg-neutral-800`}>
                        {newBrandImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={newBrandImage} alt="" className="w-full h-full object-contain" />
                        ) : catalogUploading === 'new-brand' ? '⏳' : '📁 Logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleCatalogImageUpload(e, 'new-brand')} />
                      </label>
                      <div className="flex-1 flex flex-col gap-2">
                        <input
                          type="text"
                          value={newBrandName}
                          onChange={e => setNewBrandName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBrand() } }}
                          placeholder="Nueva marca (ej. Bosch)"
                          className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newBrandImage}
                            onChange={e => setNewBrandImage(e.target.value)}
                            placeholder="…o pega la URL del logo"
                            className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 transition-all"
                          />
                          <button
                            onClick={addBrand}
                            disabled={catalogBusy}
                            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-black px-4 rounded-xl text-sm transition-all"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {brands.length === 0 ? (
                    <p className="text-gray-400 dark:text-neutral-500 text-sm text-center py-8">No hay marcas todavía.</p>
                  ) : (
                    <div className="space-y-2">
                      {brands.map(b => (
                        <div key={b.id} className="flex items-center gap-3 border border-gray-200 dark:border-neutral-800 rounded-xl p-2">
                          <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                            {b.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={b.image} alt={b.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-lg">🏷️</span>
                            )}
                          </div>
                          <span className="flex-1 min-w-0 truncate font-bold text-gray-900 dark:text-white">{b.name}</span>
                          <label className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                            catalogUploading === `brand-${b.id}` ? 'text-orange-500' : 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-white'
                          }`}>
                            {catalogUploading === `brand-${b.id}` ? '⏳' : (b.image ? 'Cambiar' : 'Imagen')}
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleCatalogImageUpload(e, { type: 'brand', id: b.id })} />
                          </label>
                          {b.image && (
                            <button onClick={() => setBrandImage(b.id, null)} className="text-gray-400 hover:text-red-500 text-xs font-bold" title="Quitar imagen">Quitar</button>
                          )}
                          <button onClick={() => deleteBrandItem(b.id)} className="bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Alta de categoría con imagen opcional */}
                  <div className="border border-gray-200 dark:border-neutral-800 rounded-xl p-3 mb-5">
                    <div className="flex gap-3">
                      <label className={`shrink-0 w-16 h-16 rounded-lg border border-dashed flex items-center justify-center overflow-hidden cursor-pointer text-center text-[10px] font-bold transition-all ${
                        catalogUploading === 'new-cat' ? 'border-orange-500 text-orange-500' : 'border-gray-300 dark:border-neutral-600 text-gray-400 hover:border-orange-500 hover:text-orange-500'
                      } bg-gray-50 dark:bg-neutral-800`}>
                        {newCatImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={newCatImage} alt="" className="w-full h-full object-cover" />
                        ) : catalogUploading === 'new-cat' ? '⏳' : '📁 Foto'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleCatalogImageUpload(e, 'new-cat')} />
                      </label>
                      <div className="flex-1 flex flex-col gap-2">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }}
                          placeholder="Nueva categoría (ej. Eléctricas)"
                          className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCatImage}
                            onChange={e => setNewCatImage(e.target.value)}
                            placeholder="…o pega la URL de la imagen"
                            className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 transition-all"
                          />
                          <button
                            onClick={addCategory}
                            disabled={catalogBusy}
                            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-black px-4 rounded-xl text-sm transition-all"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {categories.length === 0 ? (
                    <p className="text-gray-400 dark:text-neutral-500 text-sm text-center py-8">No hay categorías todavía.</p>
                  ) : (
                    <div className="space-y-4">
                      {categories.map(cat => (
                        <div key={cat.id} className="border border-gray-200 dark:border-neutral-800 rounded-xl p-3">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                              {cat.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg">📦</span>
                              )}
                            </div>
                            <span className="flex-1 min-w-0 truncate font-bold text-gray-900 dark:text-white">{cat.name}</span>
                            <label className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                              catalogUploading === `cat-${cat.id}` ? 'text-orange-500' : 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-white'
                            }`}>
                              {catalogUploading === `cat-${cat.id}` ? '⏳' : (cat.image ? 'Cambiar' : 'Imagen')}
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleCatalogImageUpload(e, { type: 'cat', id: cat.id })} />
                            </label>
                            {cat.image && (
                              <button onClick={() => setCategoryImage(cat.id, null)} className="text-gray-400 hover:text-red-500 text-xs font-bold" title="Quitar imagen">Quitar</button>
                            )}
                            <button
                              onClick={() => deleteCategoryItem(cat.id)}
                              className="text-red-500 hover:text-red-400 text-xs font-bold"
                              title="Eliminar categoría (y sus subcategorías)"
                            >
                              Eliminar
                            </button>
                          </div>
                          {cat.subcategories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {cat.subcategories.map(sub => (
                                <span key={sub.id} className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full pl-3 pr-2 py-1 text-xs font-medium">
                                  {sub.name}
                                  <button onClick={() => deleteSubcategoryItem(sub.id)} className="text-gray-400 hover:text-red-500" title="Eliminar">✕</button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newSubName[cat.id] ?? ''}
                              onChange={e => setNewSubName(prev => ({ ...prev, [cat.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubcategory(cat.id) } }}
                              placeholder="Nueva subcategoría"
                              className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 transition-all"
                            />
                            <button
                              onClick={() => addSubcategory(cat.id)}
                              disabled={catalogBusy}
                              className="bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50 text-gray-700 dark:text-white text-xs font-bold px-3 rounded-lg transition-all"
                            >
                              + Sub
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-8 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="text-lg font-black tracking-tighter p-6 pb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-neutral-800">
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col min-h-0 flex-1">
              <div className="grid grid-cols-2 gap-4 p-6 overflow-y-auto">
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

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Categoría *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })}
                    required
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategoría */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Subcategoría</label>
                  <select
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    disabled={formSubcategories.length === 0}
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all disabled:opacity-50"
                  >
                    <option value="">{formSubcategories.length === 0 ? 'Sin subcategorías' : 'Seleccionar...'}</option>
                    {formSubcategories.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Marca</label>
                  <select
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                  >
                    <option value="">Sin marca</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Referencia */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Referencia</label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="Ej. ABC-123"
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>

                {/* Cantidad disponible */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Cantidad</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="0"
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1">Unidades disponibles en inventario</p>
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

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-2">Stock</label>
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
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest">Imágenes</label>
                    <span className="text-xs font-medium text-gray-400 dark:text-neutral-500">{form.images.length}/{MAX_IMAGES}</span>
                  </div>

                  {/* Miniaturas de las imágenes agregadas */}
                  {form.images.length > 0 && (
                    <div className="grid grid-cols-6 gap-2 mb-3">
                      {form.images.map((img, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800">
                          <img
                            src={img}
                            alt={`Imagen ${i + 1}`}
                            className="h-full w-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
                          />
                          {i === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-orange-600 text-black text-[8px] font-black text-center uppercase tracking-tighter py-0.5">Portada</span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            title="Quitar imagen"
                            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/70 text-white text-xs hover:bg-red-600 transition-all"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {form.images.length < MAX_IMAGES && (
                    <>
                      {/* Agregar por URL */}
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={imgUrl}
                          onChange={(e) => setImgUrl(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl() } }}
                          placeholder="Pegá una URL: https://... o /products/foto.jpg"
                          className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={addImageUrl}
                          className="bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-white text-xs font-bold px-4 rounded-xl transition-all whitespace-nowrap"
                        >
                          + URL
                        </button>
                      </div>

                      {/* Subir desde la PC */}
                      <label className={`flex items-center justify-center gap-2 w-full border border-dashed rounded-xl px-4 py-3 text-sm font-bold transition-all cursor-pointer ${
                        uploading
                          ? 'border-orange-500 text-orange-500 cursor-wait'
                          : 'border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-neutral-400 hover:border-orange-500 hover:text-orange-500'
                      }`}>
                        {uploading ? '⏳ Subiendo...' : '📁 Subir desde la PC'}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={uploading}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}

                  {imgError && (
                    <p className="text-red-400 text-xs mt-2 font-medium">{imgError}</p>
                  )}
                </div>

                {error && (
                  <p className="col-span-2 text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 dark:border-neutral-800">
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
