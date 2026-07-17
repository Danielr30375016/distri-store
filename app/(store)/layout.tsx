import Navbar from '@/components/Navbar'
import WhatsAppButton from '@/components/WhatsAppButton'
import SiteFooter from '@/components/SiteFooter'

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

      <SiteFooter />
    </div>
  )
}
