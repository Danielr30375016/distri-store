/**
 * Integración con Wompi (Colombia) vía Web Checkout hospedado.
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 */

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Firma de integridad exigida por Wompi para el Web Checkout. */
export async function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string = 'COP'
): Promise<string> {
  const secret = process.env.WOMPI_INTEGRITY_SECRET
  if (!secret) throw new Error('WOMPI_INTEGRITY_SECRET no está definida')
  return sha256Hex(`${reference}${amountInCents}${currency}${secret}`)
}

/** Verifica el checksum de un evento (webhook) enviado por Wompi. */
export async function verifyWompiEventSignature(
  properties: string[],
  timestamp: number,
  checksum: string
): Promise<boolean> {
  const secret = process.env.WOMPI_EVENTS_SECRET
  if (!secret) throw new Error('WOMPI_EVENTS_SECRET no está definida')
  const raw = `${properties.join('')}${timestamp}${secret}`
  const expected = (await sha256Hex(raw)).toUpperCase()
  return expected === checksum.toUpperCase()
}

export async function buildWompiCheckoutUrl(params: {
  orderId: number
  amountInCents: number
  currency?: string
  redirectUrl: string
  customerEmail: string
}): Promise<string> {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
  if (!publicKey) throw new Error('NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está definida')

  const currency = params.currency ?? 'COP'
  const reference = String(params.orderId)
  const signature = await generateIntegritySignature(reference, params.amountInCents, currency)

  const url = new URL('https://checkout.wompi.co/p/')
  url.searchParams.set('public-key', publicKey)
  url.searchParams.set('currency', currency)
  url.searchParams.set('amount-in-cents', String(params.amountInCents))
  url.searchParams.set('reference', reference)
  url.searchParams.set('signature:integrity', signature)
  url.searchParams.set('redirect-url', params.redirectUrl)
  url.searchParams.set('customer-data:email', params.customerEmail)

  return url.toString()
}
