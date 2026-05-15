import { pollSchema, submitResponseSchema } from "./polls.schema";
import { PollsService } from "./polls.service";
import { ApiError } from "../../common/errors";
import { NextFunction , Request ,Response } from "express";

const pollsService = new PollsService()

export async function createPoll(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            throw ApiError.unauthorized('User not authenticated')
        }

        const body = pollSchema.safeParse(req.body)
        if (!body.success) {
            throw ApiError.badRequest(body.error.issues[0].message)
        }

        const { title, description , expiresAt ,isAnonymous ,questions } = body.data
        const pollData = { title,
            description,
            isAnonymous : isAnonymous || false,
            expiresAt : new Date(expiresAt), 
            questions,
            creatorId: req.user!.userId }

        const createdPoll = await pollsService.createPoll(pollData)
        res.status(201).json(createdPoll)
    }
    catch (error) {
        next(error)
    }
}

export async function getPoll(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId
        if (!userId) {
            throw ApiError.badRequest('User ID is required')
        }  
        // select all polls created by the user
        const polls = await pollsService.getPollsByUserId(userId)
        res.status(200).json(polls)
    }   catch (error) {
        next(error)
    }
    
}

export async function getPollById(req: Request, res: Response, next: NextFunction) {
        try {
            const pollId = req.params.pollId as string
            if (!pollId) {
                throw ApiError.badRequest('Poll ID is required')
            }
            const poll = await pollsService.getPollById(pollId)
            res.status(200).json(poll)
        } catch (error) {
            next(error) 
        }
}

export async function publishPoll(req : Request, res: Response, next: NextFunction) {
    try {
        const pollId = req.params.pollId as string
        const userId = req.user!.userId
        if (!pollId || !userId) {
            throw ApiError.badRequest('Poll ID and User ID are required')
        }
        const result = await pollsService.publishPoll(pollId, userId)
        res.status(200).json(result)
    } catch (error) {
        next(error)
    }
}
export async function submitResponse(req: Request, res: Response, next: NextFunction) {
    try {   
        const pollId = req.params.pollId as string
        const userId = req.user ? req.user.userId : null

        const body = submitResponseSchema.safeParse(req.body)
        if (!body.success) {
        throw ApiError.badRequest(body.error.issues[0].message)
        }

        const { visitorId, answers } = body.data

        if (!userId && !visitorId) {
        throw ApiError.badRequest('Either user ID or visitor ID is required')
        }

        const result = await pollsService.submitResponse(pollId, userId, visitorId, answers)
        res.status(201).json(result)
    }
    catch (error) {
        next(error)
    }
}



export async function getStats(req: Request, res: Response, next: NextFunction) {
    try {
        const pollId = req.params.pollId as string
        const userId = req.user ? req.user.userId : null
        const visitorId = req.query.visitorId as string
        const stats = await pollsService.getStats(pollId , userId , visitorId)
        res.status(200).json(stats)
    }
    catch (error) {
        next(error)
    }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
        const pollId = req.params.pollId as string
        const userId = req.user!.userId
        if (!pollId || !userId) {
            throw ApiError.badRequest('Poll ID and User ID are required')
        }
        const { totalResponses, questionStats, timeline } = await pollsService.getAnalytics(pollId, userId)

        res.status(200).json({
            totalResponses,
            questionStats,
            timeline
        })
    }   catch (error) { 

        next(error) 
    }
}

export async function deletePoll(req: Request, res: Response, next: NextFunction) {
  try {
    const pollId = req.params.pollId as string
    await pollsService.deletePoll(pollId, req.user!.userId)
    res.status(200).json({ message: 'Poll deleted' })
  } catch (err) {
    next(err)
  }
}