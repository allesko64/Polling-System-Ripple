import { NextFunction, Request, Response } from 'express'
import { ApiError } from './errors'
import { verifyAccessToken } from './auth'
import { db } from '../db/index'
import { polls } from '../db/schema'
import { eq } from 'drizzle-orm/sql/expressions/conditions'
import { getIO } from './socket'



export async function requireAuth(req: Request , res: Response , next: NextFunction){
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) {
            return next(ApiError.unauthorized())
        }
        const userId = verifyAccessToken(token)
        if (!userId) {
            return next(ApiError.unauthorized())
        }
        req.user = { userId }
        next()
    } catch (error) {
        next(ApiError.unauthorized())
    }
}

export async function optionalAuth(req: Request , res: Response , next: NextFunction){
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (token) {
            const userId = verifyAccessToken(token)
            if (userId) {
                req.user = { userId }
            }
        }
    }   
    catch (error) {
        // Ignore errors and proceed without authentication
    }
    next()
}

export async function checkPollExpiry(req: Request, res: Response, next: NextFunction) {
  try {
    const pollId = req.params.pollId as string
    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)

    if (!poll) {
      return next(ApiError.notFound('Poll not found'))
    }

    if (poll.status === 'active' && poll.expiresAt < new Date()) {
      await db.update(polls)
        .set({ status: 'closed' })
        .where(eq(polls.id, pollId))

        const io = getIO()
        io.to(`poll:${pollId}`).emit('poll:status_changed', { status: 'closed' })

      res.status(410).json({ error: 'Poll has expired' })
      return
    }

    next()
  } catch (error) {
    next(error)
  }
}