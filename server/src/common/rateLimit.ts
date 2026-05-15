import { Request, Response, NextFunction } from 'express'

interface Window {
  count: number
  resetAt: number
}

/**
 * Simple in-process sliding-window rate limiter.
 * Good for single-instance deployments. Swap for Redis-backed limiter when scaling horizontally.
 */
function createRateLimiter(options: {
  windowMs: number
  max: number
  message?: string
}) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options
  const store = new Map<string, Window>()

  setInterval(() => {
    const now = Date.now()
    for (const [key, win] of store.entries()) {
      if (win.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
      || req.socket.remoteAddress
      || 'unknown'

    const now = Date.now()
    let win = store.get(ip)

    if (!win || win.resetAt < now) {
      win = { count: 0, resetAt: now + windowMs }
      store.set(ip, win)
    }

    win.count++

    if (win.count > max) {
      res.setHeader('Retry-After', Math.ceil((win.resetAt - now) / 1000))
      res.status(429).json({ error: message })
      return
    }

    next()
  }
}


export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many auth attempts, please try again in 15 minutes.',
})

export const respondLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many submissions from this IP, please try again later.',
})
