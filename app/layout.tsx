import './globals.css'
import { ReactNode } from 'react'
import Navbar from '../components/Navbar'
import { CartProvider } from '../src/context/CartContext'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        <CartProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  )
}