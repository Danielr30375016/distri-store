import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import {
  createAdminSession,
  setAdminSessionCookie,
  getClientIp,
  isIpLocked,
  registerFailedAttempt,
  clearFailedAttempts,
} from '../../../../lib/auth'

export async function POST(request: Request) {
  const ip = getClientIp(request)

  try {
    if (await isIpLocked(ip)) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.' },
        { status: 429 }
      )
    }

    const { password } = await request.json()
    const passwordHash = process.env.ADMIN_PASSWORD_HASH

    if (!passwordHash) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD_HASH no configurada' }, { status: 500 })
    }

    const valid = typeof password === 'string' && (await bcrypt.compare(password, passwordHash))

    if (!valid) {
      await registerFailedAttempt(ip)
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    await clearFailedAttempts(ip)
    const token = await createAdminSession()
    await setAdminSessionCookie(token)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
