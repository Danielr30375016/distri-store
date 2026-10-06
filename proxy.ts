import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminSession, SESSION_COOKIE } from './lib/auth'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value

  const isAuthorized = await verifyAdminSession(token)

  if (!isAuthorized) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/((?!login).*)'],
}
