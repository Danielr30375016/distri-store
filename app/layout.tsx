import './globals.css'
import { Inter } from 'next/font/google'
import { CartProvider } from '../src/context/CartContext'
import { ThemeProvider } from '../src/context/ThemeContext'

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
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ds-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.className} bg-orange-50 dark:bg-black text-gray-900 dark:text-white min-h-screen transition-colors duration-300`}>
        <ThemeProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}