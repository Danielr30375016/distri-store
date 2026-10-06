/**
 * Integración con Wompi (Colombia) vía Web Checkout hospedado.
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 *       https://docs.wompi.co/docs/colombia/eventos/
 *
 * Variables de entorno:
 *   NEXT_PUBLIC_WOMPI_PUBLIC_KEY  pub_test_... (sandbox) / pub_prod_... (producción)
 *   WOMPI_INTEGRITY_SECRET        test_integrity_... / prod_integrity_...  (solo servidor)
 *   WOMPI_EVENTS_SECRET           test_events_...    / prod_events_...     (solo servidor)
 */

export type WompiStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'

export interface WompiTransaction {
  id: string
  status: WompiStatus
  reference: string
  amount_in_cents: number
  currency: string
  payment_method_type?: string | null
}

const encoder = new TextEncoder()

async function sha256Hex(input: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(input))
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Comparación en tiempo constante (evita ataques de timing al comparar firmas). */
function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a)
  const bb = encoder.encode(b)
  let diff = ab.length ^ bb.length
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0)
  return diff === 0
}

function wompiApiBase(): string {
  const key = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? ''
  return key.startsWith('pub_prod_') ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1'
}

/**
 * Firma de integridad exigida por Wompi para el Web Checkout:
 * SHA256(<referencia><montoEnCentavos><moneda>[<fechaExpiración>]<secretoIntegridad>)
 */
export async function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string = 'COP',
  expirationTime: string = ''
): Promise<string> {
  const secret = process.env.WOMPI_INTEGRITY_SECRET
  if (!secret) throw new Error('WOMPI_INTEGRITY_SECRET no está definida')
  return sha256Hex(`${reference}${amountInCents}${currency}${expirationTime}${secret}`)
}

/** Lee "transaction.id" dentro de un objeto. */
function getProp(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Verifica el checksum de un evento (webhook) enviado por Wompi:
 * SHA256( valores de signature.properties + timestamp + secreto de eventos )
 *
 * OJO: las propiedades ("transaction.id", "transaction.status"...) son relativas a
 * `event.data`, NO a la raíz del evento. Antes se leían desde la raíz, todos los valores
 * quedaban vacíos y el webhook rechazaba todos los pagos con 401.
 */
export async function verifyWompiEvent(
  event: { data?: unknown; signature?: { properties?: unknown; checksum?: unknown }; timestamp?: unknown },
  headerChecksum?: string | null
): Promise<boolean> {
  const secret = process.env.WOMPI_EVENTS_SECRET
  if (!secret) throw new Error('WOMPI_EVENTS_SECRET no está definida')

  const properties = event.signature?.properties
  const checksum = headerChecksum || event.signature?.checksum
  if (!Array.isArray(properties) || properties.length === 0 || typeof checksum !== 'string') return false
  if (typeof event.timestamp !== 'number' && typeof event.timestamp !== 'string') return false

  const values = properties.map(p => String(getProp(event.data, String(p)) ?? '')).join('')
  const expected = await sha256Hex(`${values}${event.timestamp}${secret}`)
  return safeEqual(expected.toUpperCase(), checksum.toUpperCase())
}

export async function buildWompiCheckoutUrl(params: {
  reference: string
  amountInCents: number
  currency?: string
  redirectUrl: string
  /** ISO 8601. Pasado este momento Wompi no permite pagar (evita pagos de pedidos ya expirados). */
  expirationTime: string
  customerEmail: string
  customerName: string
  customerPhone: string
  address: string
}): Promise<string> {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
  if (!publicKey) throw new Error('NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está definida')

  const currency = params.currency ?? 'COP'
  const signature = await generateIntegritySignature(
    params.reference,
    params.amountInCents,
    currency,
    params.expirationTime
  )

  const url = new URL('https://checkout.wompi.co/p/')
  url.searchParams.set('public-key', publicKey)
  url.searchParams.set('currency', currency)
  url.searchParams.set('amount-in-cents', String(params.amountInCents))
  url.searchParams.set('reference', params.reference)
  url.searchParams.set('signature:integrity', signature)
  url.searchParams.set('redirect-url', params.redirectUrl)
  url.searchParams.set('expiration-time', params.expirationTime)
  url.searchParams.set('customer-data:email', params.customerEmail)
  url.searchParams.set('customer-data:full-name', params.customerName)
  // Wompi espera el celular sin espacios ni símbolos
  url.searchParams.set('customer-data:phone-number', params.customerPhone.replace(/[^\d]/g, '').slice(-10))
  url.searchParams.set('shipping-address:address-line-1', params.address.slice(0, 200))
  url.searchParams.set('shipping-address:country', 'CO')

  return url.toString()
}

/** Consulta una transacción directamente a la API de Wompi (fuente confiable). */
export async function fetchWompiTransaction(id: string): Promise<WompiTransaction | null> {
  if (!/^[\w-]{5,80}$/.test(id)) return null
  try {
    const res = await fetch(`${wompiApiBase()}/transactions/${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data as WompiTransaction) ?? null
  } catch {
    return null
  }
}
