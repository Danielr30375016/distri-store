import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from './lib/auth'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value

  const isAuthorized = await verifyAdminToken(token ?? '')

  if (!isAuthorized) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/((?!login).*)'],
}
