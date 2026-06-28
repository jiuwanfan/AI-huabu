import type express from 'express'

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

function defaultPort(protocol: string) {
  if (protocol === 'http:') return 80
  if (protocol === 'https:') return 443
  return undefined
}

export function isAllowedLocalOrigin(origin: string | undefined, servicePort: number) {
  if (!origin) return true

  try {
    const parsed = new URL(origin)
    const host = parsed.hostname.toLowerCase()
    const port = parsed.port ? Number(parsed.port) : defaultPort(parsed.protocol)

    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      LOOPBACK_HOSTS.has(host) &&
      port === servicePort
    )
  } catch {
    return false
  }
}

export function requireLocalOrigin(servicePort: number): express.RequestHandler {
  return (request, response, next) => {
    if (isAllowedLocalOrigin(request.headers.origin, servicePort)) {
      next()
      return
    }

    response.status(403).json({
      ok: false,
      error: 'AI Huabu only accepts browser requests from its local canvas page.'
    })
  }
}
