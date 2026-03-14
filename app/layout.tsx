import './globals.css'
import { Inter } from 'next/font/google'
import { CartProvider } from '../src/context/CartContext'
import Navbar from '../components/Navbar'
import WhatsAppButton from '../components/WhatsAppButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DistriStore | Catálogo de Herramientas Profesionales',
  description: 'Explora nuestra selección de herramientas de alta calidad.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <CartProvider>
          {/* El Navbar ahora es el protagonista en la parte superior */}
          <header className="w-full z-50 sticky top-0 shadow-2xl">
            <Navbar />
          </header>

          <main className="min-h-[80vh]">
            {children}
          </main>

          <WhatsAppButton />
          
          <footer className="bg-neutral-900 border-t border-neutral-800 py-12 mt-20">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-neutral-500 text-sm font-bold tracking-widest">
                &copy; {new Date().getFullYear()} DISTRI-STORE. CALIDAD PROFESIONAL.
              </p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}