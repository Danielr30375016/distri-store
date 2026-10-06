'use client'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export interface CartItem {
  id: number
  name: string
  /** Precio mostrado al agregar. El precio REAL se recalcula en el servidor al pagar. */
  price: number
  image?: string
  quantity: number
}

type AddableProduct = Omit<CartItem, 'quantity'>

interface CartContextType {
  items: CartItem[]
  addToCart: (product: AddableProduct, quantity?: number) => void
  updateQuantity: (id: number, quantity: number) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  hydrated: boolean
}

const STORAGE_KEY = 'distri-cart'
const MAX_QTY = 99

const CartContext = createContext<CartContextType | undefined>(undefined)

/** Valida lo que viene de localStorage (puede estar corrupto o manipulado). */
function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data
      .filter(
        (i): i is CartItem =>
          i &&
          Number.isInteger(i.id) &&
          typeof i.name === 'string' &&
          Number.isFinite(i.price) &&
          Number.isInteger(i.quantity) &&
          i.quantity > 0
      )
      .map(i => ({ ...i, quantity: Math.min(i.quantity, MAX_QTY) }))
  } catch {
    return []
  }
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    try {
      setItems(parseStoredCart(localStorage.getItem(STORAGE_KEY)))
    } catch {
      /* localStorage bloqueado (modo privado, etc.) */
    }
    setHydrated(true)
  }, [])

  // Guardar solo después de haber cargado (antes se guardaba [] en el primer render)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignorar */
    }
  }, [items, hydrated])

  const addToCart = (product: AddableProduct, quantity = 1) => {
    setItems(prev => {
      const exists = prev.find(item => item.id === product.id)
      if (exists) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, ...product, quantity: Math.min(item.quantity + quantity, MAX_QTY) }
            : item
        )
      }
      return [...prev, { ...product, quantity: Math.min(quantity, MAX_QTY) }]
    })
  }

  const updateQuantity = (id: number, quantity: number) => {
    setItems(prev =>
      quantity <= 0
        ? prev.filter(i => i.id !== id)
        : prev.map(i => (i.id === id ? { ...i, quantity: Math.min(Math.floor(quantity), MAX_QTY) } : i))
    )
  }

  const removeFromCart = (id: number) => setItems(prev => prev.filter(item => item.id !== id))
  const clearCart = () => setItems([])

  const value = useMemo(
    () => ({
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      hydrated,
      totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    [items, hydrated]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe estar dentro de CartProvider')
  }
  return context
}
