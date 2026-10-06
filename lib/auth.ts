import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'admin_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7 // 7 días
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET no está definida')
  return new TextEncoder().encode(secret)
}

export async function createAdminSession(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecret())
}

export async function verifyAdminSession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, getSessionSecret())
    return payload.role === 'admin'
  } catch {
    return false
  }
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  })
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/** Verifica la sesión de admin a partir de las cookies de un Request de ruta API. */
export async function requireAdmin(request: Request | NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
  const token = match?.[1]
  return verifyAdminSession(token)
}

export { SESSION_COOKIE }

// --- Rate limiting de intentos de login (respaldado en base de datos) ---

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function isIpLocked(ip: string): Promise<boolean> {
  const { prisma } = await import('./db')
  const record = await prisma.loginAttempt.findUnique({ where: { ip } })
  if (!record?.lockedUntil) return false
  return record.lockedUntil > new Date()
}

export async function registerFailedAttempt(ip: string): Promise<void> {
  const { prisma } = await import('./db')
  const record = await prisma.loginAttempt.upsert({
    where: { ip },
    create: { ip, attempts: 1 },
    update: { attempts: { increment: 1 } },
  })

  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    await prisma.loginAttempt.update({
      where: { ip },
      data: {
        lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
        attempts: 0,
      },
    })
  }
}

export async function clearFailedAttempts(ip: string): Promise<void> {
  const { prisma } = await import('./db')
  await prisma.loginAttempt.deleteMany({ where: { ip } })
}
