import Link from 'next/link'
import { site, osmEmbedUrl, osmLink } from '@/lib/site'

const paymentMethods = [
  { icon: '💳', label: 'Tarjeta de crédito' },
  { icon: '🏧', label: 'Tarjeta débito' },
  { icon: '📱', label: 'Nequi' },
  { icon: '🔑', label: 'Llave' },
  { icon: '🧾', label: 'Sistecrédito' },
  { icon: '🏦', label: 'PSE / Transferencia' },
  { icon: '💵', label: 'Efectivo' },
]

export default function SiteFooter() {
  return (
    <footer className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 mt-16">
      {/* ENCUÉNTRANOS */}
      <section id="encuentranos" className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-8 uppercase italic tracking-tighter border-l-4 border-orange-500 pl-4">
          Encuén<span className="text-orange-500">tranos</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mapa */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800 h-[300px] md:h-[360px] bg-gray-100 dark:bg-neutral-800">
            <iframe
              title="Ubicación de la sede"
              src={osmEmbedUrl(site.map)}
              className="w-full h-full"
              loading="lazy"
            />
          </div>

          {/* Datos de contacto */}
          <div className="flex flex-col justify-center gap-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-1">Dirección</h3>
                <p className="text-gray-500 dark:text-neutral-400 text-sm">{site.address}</p>
                <p className="text-gray-500 dark:text-neutral-400 text-sm">{site.city}</p>
                <a
                  href={osmLink(site.map)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline text-xs font-bold uppercase tracking-widest inline-block mt-1"
                >
                  Ver en el mapa →
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📞</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-1">Teléfono</h3>
                <a href={`tel:${site.phoneWhatsapp}`} className="text-gray-500 dark:text-neutral-400 text-sm hover:text-orange-500">{site.phoneDisplay}</a>
                <a
                  href={`https://wa.me/${site.phoneWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-green-600 dark:text-green-400 hover:underline text-xs font-bold uppercase tracking-widest mt-0.5"
                >
                  Escribir por WhatsApp →
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">✉️</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-1">Correo</h3>
                <a href={`mailto:${site.email}`} className="text-gray-500 dark:text-neutral-400 text-sm hover:text-orange-500">{site.email}</a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🕒</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-1">Horario</h3>
                <p className="text-gray-500 dark:text-neutral-400 text-sm">{site.hours}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEDIOS DE PAGO */}
      <section id="pagos" className="border-t border-gray-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase italic tracking-tighter border-l-4 border-orange-500 pl-4">
            Medios de <span className="text-orange-500">pago</span>
          </h2>
          <p className="text-gray-500 dark:text-neutral-400 text-sm mb-8 pl-5">
            Aceptamos múltiples formas de pago. Coordiná el pago al finalizar tu pedido por WhatsApp.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {paymentMethods.map(m => (
              <div
                key={m.label}
                className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl p-4 flex flex-col items-center text-center gap-2"
              >
                <span className="text-3xl">{m.icon}</span>
                <span className="text-xs font-bold text-gray-700 dark:text-neutral-200 leading-tight">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PIE */}
      <div className="border-t border-gray-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-black text-gray-900 dark:text-white tracking-tighter text-sm">
            DISTRI<span className="text-orange-500">STORE</span>
          </span>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-400">
            <Link href="/productos" className="hover:text-orange-500">Catálogo</Link>
            <Link href="/marcas" className="hover:text-orange-500">Marcas</Link>
            <a href="#encuentranos" className="hover:text-orange-500">Encuéntranos</a>
            <a href="#pagos" className="hover:text-orange-500">Pagos</a>
          </div>
          <p className="text-gray-400 dark:text-neutral-500 text-xs font-medium">
            &copy; 2026 {site.name} &mdash; Calidad Profesional
          </p>
        </div>
      </div>
    </footer>
  )
}
