import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function proxy(request: NextRequest, context: { params: { path: string[] } }) {
  const base = (process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
  const path = (context.params.path || []).map(encodeURIComponent).join('/')
  const target = `${base}/api/v1/${path}${request.nextUrl.search}`
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('connection')
  headers.delete('content-length')
  let body: ArrayBuffer | undefined
  if (!['GET', 'HEAD'].includes(request.method)) body = await request.arrayBuffer()

  try {
    const upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store' })
    const responseHeaders = new Headers()
    upstream.headers.forEach((value, key) => {
      if (!['content-length', 'content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders.append(key, value)
      }
    })
    return new Response(request.method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch {
    return Response.json({ error: 'The Championship API is unavailable. Start the FastAPI backend and try again.' }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy
export const PUT = proxy
export const DELETE = proxy
export const OPTIONS = proxy
