'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

// 1. Definimos la estructura de un producto en el carrito
interface CartItem {
  id: number
  name: string
  price: number
  image?: string
  quantity: number
}

// 2. Definimos qué funciones y datos ofrece el carrito (Aquí estaba tu error de TS)
interface CartContextType {
  items: CartItem[]
  addToCart: (product: any) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  totalItems: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('distri-cart')
    if (savedCart) setItems(JSON.parse(savedCart))
  }, [])

  // Guardar en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('distri-cart', JSON.stringify(items))
  }, [items])

  const addToCart = (product: any) => {
    setItems(prev => {
      const exists = prev.find(item => item.id === product.id)
      if (exists) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  )
}

// Hook personalizado para usar el carrito
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe estar dentro de CartProvider') // Este es el error que veías antes
  }
  return context
}