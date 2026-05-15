import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { eq, lt } from 'drizzle-orm'
import { registerUser, loginUser } from './auth.service'
import { ApiError } from '../../common/errors'
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../../common/auth'
import { db } from '../../db'
import { users, refreshTokenDenylist } from '../../db/schema'

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8)
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
})

const REFRESH_COOKIE = 'refreshToken'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000
}

// Prune expired denylist rows opportunistically (runs at most once per minute)
let lastPrune = 0
async function pruneExpiredDenylist() {
  const now = Date.now()
  if (now - lastPrune < 60_000) return
  lastPrune = now
  await db.delete(refreshTokenDenylist).where(lt(refreshTokenDenylist.expiresAt, new Date()))
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.safeParse(req.body)
    if (!body.success) {
      throw ApiError.badRequest(body.error.issues[0].message)
    }

    const { name, email, password } = body.data
    const { user, accessToken, refreshToken } = await registerUser(name, email, password)

    res.cookie(REFRESH_COOKIE, refreshToken.token, COOKIE_OPTIONS)
    res.status(201).json({ user, accessToken })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) {
      throw ApiError.badRequest(body.error.issues[0].message)
    }

    const { email, password } = body.data
    const { user, accessToken, refreshToken } = await loginUser(email, password)

    res.cookie(REFRESH_COOKIE, refreshToken.token, COOKIE_OPTIONS)
    res.status(200).json({ user, accessToken })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[REFRESH_COOKIE]
    if (!token) throw ApiError.unauthorized()

    const { userId, jti } = verifyRefreshToken(token)

    // Check denylist — covers logout + rotation revocation
    const [denied] = await db
      .select({ jti: refreshTokenDenylist.jti })
      .from(refreshTokenDenylist)
      .where(eq(refreshTokenDenylist.jti, jti))
      .limit(1)
    if (denied) throw ApiError.unauthorized()

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) throw ApiError.unauthorized()

    // Revoke the old refresh token (rotation)
    await db.insert(refreshTokenDenylist).values({
      jti,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    const accessToken = generateAccessToken(userId)
    const newRefreshToken = generateRefreshToken(userId)

    void pruneExpiredDenylist()

    res.cookie(REFRESH_COOKIE, newRefreshToken.token, COOKIE_OPTIONS)
    res.status(200).json({ accessToken, user })
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[REFRESH_COOKIE]
    if (token) {
      try {
        const { jti } = verifyRefreshToken(token)
        await db.insert(refreshTokenDenylist).values({
          jti,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }).onConflictDoNothing()
      } catch {
        // Token already expired or malformed — still clear the cookie
      }
    }
    res.clearCookie(REFRESH_COOKIE)
    res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}