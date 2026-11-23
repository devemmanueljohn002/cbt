import { NextRequest, NextResponse } from 'next/server'
// First gate only: checks that a session cookie exists. FastAPI verifies the session and role server-side.
export function middleware(req: NextRequest) {
  if (req.cookies.has(process.env.SESSION_COOKIE_NAME || 'sid')) return NextResponse.next()
  if (req.nextUrl.pathname.startsWith('/api/')) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  return NextResponse.redirect(new URL('/login', req.url))
}
export const config = { matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/api/admin/:path*'] }
