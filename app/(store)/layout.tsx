import Navbar from '@/components/Navbar'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-orange-50 dark:bg-neutral-950 text-gray-900 dark:text-white transition-colors duration-300">
      <header className="w-full z-50 sticky top-0 shadow-sm dark:shadow-2xl">
        <Navbar />
      </header>

      <main className="min-h-[80vh] bg-orange-50 dark:bg-neutral-950">
        {children}
      </main>

      <WhatsAppButton />

      <footer className="bg-orange-50 dark:bg-neutral-900 border-t border-orange-100 dark:border-neutral-800 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-black text-gray-900 dark:text-white tracking-tighter text-sm">
            DISTRI<span className="text-orange-500">STORE</span>
          </span>
          <p className="text-gray-400 dark:text-neutral-500 text-xs font-medium">
            &copy; {new Date().getFullYear()} Distri-Store &mdash; Calidad Profesional
          </p>
        </div>
      </footer>
    </div>
  )
}
