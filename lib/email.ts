import { Resend } from 'resend'
import { site } from './site'

interface OrderForEmail {
  id: number
  reference: string
  customerName: string
  email: string
  phone: string
  address: string
  total: number
  items: { name: string; price: number; quantity: number }[]
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

/** Escapa HTML: el nombre/dirección los escribe el cliente y podrían traer <a>, <img>, etc. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function orderUrl(reference: string): string | null {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  return base ? `${base}/pedido/${encodeURIComponent(reference)}` : null
}

function formatCOP(value: number): string {
  return `$${value.toLocaleString('es-CO')}`
}

function itemsHtml(items: OrderForEmail['items']): string {
  return items
    .map(
      i =>
        `<tr><td>${esc(i.name)}</td><td>x${i.quantity}</td><td>${formatCOP(i.price * i.quantity)}</td></tr>`
    )
    .join('')
}

export async function sendOrderConfirmation(order: OrderForEmail): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY no configurada, se omite el envío de confirmación')
    return
  }
  const from = process.env.ORDER_NOTIFICATIONS_FROM_EMAIL ?? `pedidos@${site.name.toLowerCase()}.com`

  await resend.emails.send({
    from,
    to: order.email,
    subject: `Pedido ${order.reference} recibido - ${site.name}`,
    html: `
      <h2>¡Gracias por tu pedido, ${esc(order.customerName)}!</h2>
      <p>Recibimos tu pedido ${order.reference}. Te avisaremos cuando el pago sea confirmado.</p>
      ${orderUrl(order.reference) ? `<p><a href="${orderUrl(order.reference)}">Ver estado del pedido</a></p>` : ''}
      <table>${itemsHtml(order.items)}</table>
      <p><strong>Total: ${formatCOP(order.total)}</strong></p>
      <p>Dirección de entrega: ${esc(order.address)}</p>
    `,
  })
}

export async function sendPaymentConfirmedEmail(order: OrderForEmail): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const from = process.env.ORDER_NOTIFICATIONS_FROM_EMAIL ?? `pedidos@${site.name.toLowerCase()}.com`

  await resend.emails.send({
    from,
    to: order.email,
    subject: `Pago confirmado - Pedido ${order.reference}`,
    html: `
      <h2>¡Tu pago fue confirmado!</h2>
      <p>El pedido ${order.reference} por ${formatCOP(order.total)} ya está siendo preparado.</p>
    `,
  })
}

export async function sendAdminOrderAlert(order: OrderForEmail): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const from = process.env.ORDER_NOTIFICATIONS_FROM_EMAIL ?? `pedidos@${site.name.toLowerCase()}.com`

  await resend.emails.send({
    from,
    to: site.email,
    subject: `Nuevo pago confirmado - Pedido ${order.reference}`,
    html: `
      <h2>Nuevo pago confirmado</h2>
      <p>Cliente: ${esc(order.customerName)} (${esc(order.phone)}, ${esc(order.email)})</p>
      <table>${itemsHtml(order.items)}</table>
      <p><strong>Total: ${formatCOP(order.total)}</strong></p>
      <p>Dirección: ${esc(order.address)}</p>
    `,
  })
}
