import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { users } from '../../db/schema'
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken
} from '../../common/auth'
import { ApiError } from '../../common/errors'

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing.length > 0) {
    throw ApiError.conflict('Email already in use')
  }

  const hashed = await hashPassword(password)

  const [user] = await db
    .insert(users)
    .values({ name, email, password: hashed })
    .returning()

  const accessToken = generateAccessToken(user.id)
  const refreshToken = generateRefreshToken(user.id)

  return { user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken }
}

export async function loginUser(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    throw ApiError.unauthorized('Invalid credentials')
  }

  const valid = await comparePassword(password, user.password)

  if (!valid) {
    throw ApiError.unauthorized('Invalid credentials')
  }

  const accessToken = generateAccessToken(user.id)
  const refreshToken = generateRefreshToken(user.id)

  // refreshToken is now { token, jti } — callers use .token for the cookie
  return { user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken }
}