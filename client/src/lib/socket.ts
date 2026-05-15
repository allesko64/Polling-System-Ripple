import { io, type Socket } from 'socket.io-client'

/**
 * Socket.io server origin (no /api suffix).
 * Prefer VITE_SOCKET_URL in production; falls back to API host without /api.
 */
export function getSocketUrl(): string {
  const fromEnv = import.meta.env.VITE_SOCKET_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  return apiBase.replace(/\/api\/?$/, '')
}

export function createSocket(): Socket {
  return io(getSocketUrl(), { withCredentials: true })
}
