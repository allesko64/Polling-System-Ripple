import { Router } from 'express'
import { createPoll, deletePoll, getAnalytics, getPoll , getPollById, getPublicPollFeed, getStats, publishPoll , submitResponse } from './polls.controller'
import { requireAuth  , optionalAuth , checkPollExpiry} from '../../common/middleware'
import { respondLimiter } from '../../common/rateLimit'

const router = Router()

router.post('/', requireAuth, createPoll)
router.get('/', requireAuth, getPoll)
router.get('/feed', getPublicPollFeed)
router.get('/:pollId/analytics', requireAuth, getAnalytics)
router.get('/:pollId/stats', optionalAuth, getStats)
router.get('/:pollId', optionalAuth, getPollById)
router.post('/:pollId/publish', requireAuth, publishPoll)
router.post('/:pollId/respond', respondLimiter, optionalAuth, checkPollExpiry, submitResponse)
router.delete('/:pollId', requireAuth, deletePoll)

export default router