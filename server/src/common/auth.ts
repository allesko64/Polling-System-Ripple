import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const SALT_ROUNDS = 12

interface TokenPayload {
  userId: string
  type: 'access' | 'refresh'
  jti?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' } as TokenPayload,
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: '15m' }
  )
}

export function generateRefreshToken(userId: string): { token: string; jti: string } {
  const jti = randomUUID()
  const token = jwt.sign(
    { userId, type: 'refresh', jti } as TokenPayload,
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )
  return { token, jti }
}

export function verifyAccessToken(token: string): string {
  const payload = jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET!
  ) as TokenPayload

  if (payload.type !== 'access') {
    throw new Error('Invalid token type')
  }

  return payload.userId
}

/** Returns { userId, jti } so callers can check the denylist. */
export function verifyRefreshToken(token: string): { userId: string; jti: string } {
  const payload = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET!
  ) as TokenPayload

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type')
  }

  return { userId: payload.userId, jti: payload.jti! }
}