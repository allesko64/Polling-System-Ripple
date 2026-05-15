import { db } from "../../db/index";
import {polls , questions , options, responses , answers as answersTable} from "../../db/schema"
import { eq  , count, inArray , and, sql, or, gt} from "drizzle-orm";
import { ApiError } from "../../common/errors";
import { getIO } from "../../common/socket";




export class PollsService {
    async createPoll(pollData: any) {
        try {
            const result = await db.transaction(async (trx) => {
                const [poll] = await trx.insert(polls).values({
                    creatorId: pollData.creatorId,
                    title: pollData.title,
                    description: pollData.description,
                    isAnonymous: pollData.isAnonymous,
                    expiresAt: pollData.expiresAt,
                    status: 'active'
                }).returning()

                for (let i = 0; i < pollData.questions.length; i++) {
                    const question = pollData.questions[i]
                    const [insertedQuestion] = await trx.insert( questions).values({
                        pollId: poll.id,
                        questionText: question.questionText,
                        orderIndex: i,
                        isMandatory: question.isMandatory
                    }).returning()

                    for (let j = 0; j < question.options.length; j++) {
                        const option = question.options[j]
                        await trx.insert(options).values({
                            questionId: insertedQuestion.id,
                            optionText: option.optionText,
                            orderIndex: j
                        })
                    }
                }
                return poll
            }
            )
                    
            return result

            
                
        } catch (error) {
            console.error('Error creating poll:', error)
            throw error
        }
    }
    async getPollsByUserId(userId: string) {
        try {
            // Fetch polls with a response count in a single query
            const userPolls = await db
                .select({
                    id: polls.id,
                    creatorId: polls.creatorId,
                    title: polls.title,
                    description: polls.description,
                    isAnonymous: polls.isAnonymous,
                    createdAt: polls.createdAt,
                    expiresAt: polls.expiresAt,
                    status: polls.status,
                    responseCount: count(responses.id),
                })
                .from(polls)
                .leftJoin(responses, eq(responses.pollId, polls.id))
                .where(eq(polls.creatorId, userId))
                .groupBy(polls.id)

            return userPolls
        } catch (error) {
            console.error('Error fetching polls:', error)
            throw error
        }
    }
    async getPublicPollFeed() {
        try {
            const feed = await db
                .select({
                    id: polls.id,
                    title: polls.title,
                    description: polls.description,
                    expiresAt: polls.expiresAt,
                    status: polls.status,
                    responseCount: count(responses.id),
                })
                .from(polls)
                .leftJoin(responses, eq(responses.pollId, polls.id))
                .where(
                    or(
                        and(eq(polls.status, 'active'), gt(polls.expiresAt, sql`NOW()`)),
                        eq(polls.status, 'published')
                    )
                )
                .groupBy(polls.id)
                .orderBy(
                    sql`CASE ${polls.status} WHEN 'active' THEN 0 WHEN 'published' THEN 1 END`,
                    sql`CASE WHEN ${polls.status} = 'active' THEN ${polls.expiresAt} END ASC`,
                    sql`CASE WHEN ${polls.status} = 'published' THEN ${polls.expiresAt} END DESC`
                )

            return feed
        } catch (error) {
            console.error('Error fetching public poll feed:', error)
            throw error
        }
    }

    private async getQuestionsWithOptions(pollId: string) {
        const questionsData = await db.select().from(questions)
        .where(eq(questions.pollId, pollId))

        const optionsData = await db.select().from(options)
        .where(inArray(options.questionId, questionsData.map(q => q.id)))

        return questionsData.map(question => ({
        ...question,
        options: optionsData.filter(o => o.questionId === question.id)
    }))
}
    async getPollById(pollId: string) {
        try {
            const poll = await db.select().from(polls).where(eq(polls.id,pollId)).limit(1)
            
            if (!poll || poll.length === 0) {
                throw ApiError.notFound('Poll not found')
            }

            if(poll[0].status === 'closed') {
                return {
                    id: poll[0].id,
                    title: poll[0].title,
                    status: 'closed',
                    message: 'Poll has ended',
                }
            }
            if(poll[0].status === 'active'){
                const questionsWithOptions = await this.getQuestionsWithOptions(pollId)
                return { ...poll[0], questions: questionsWithOptions }

            }
            if(poll[0].status === 'published') {
                const questionsWithOptions = await this.getQuestionsWithOptions(pollId)

                const [{ totalResponses }] = await db
                .select({ totalResponses: count() })
                .from(responses)
                .where(eq(responses.pollId, pollId))

                return { ...poll[0], questions: questionsWithOptions, totalResponses }
            }

            return poll[0]
        } catch (error) {
            console.error('Error fetching poll:', error)
            throw error
        }
    }
    async publishPoll(pollId: string , userId: string) {
        try {
            const poll = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)
            if (!poll || poll.length === 0) {
                throw ApiError.notFound('Poll not found')
            }
            if (poll[0].status !== 'closed') {
                throw ApiError.badRequest('Only closed polls can be published')
            }
            if(poll[0].creatorId !== userId){
                throw ApiError.forbidden('User not authorized to publish this poll')
            }
            const result = await db.update(polls).set({ status: 'published' }).where(eq(polls.id, pollId)).returning()
            const io = getIO()
            io.to(`poll:${pollId}`).emit('poll:status_changed', { status: 'published' })
            return result
        } catch (error) {
            console.error('Error publishing poll:', error)
            throw error
        }
    }
    async submitResponse(pollId: string, userId: string | null, visitorId: string, answers: {questionId: string, optionId: string | null}[]) {
  // 1. fetch poll, check active
        const poll = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)
        if (!poll || poll.length === 0) {
            throw ApiError.notFound('Poll not found')
        }
        if (poll[0].status !== 'active') {
            throw ApiError.badRequest('Poll is not active')
        }
  // 2. deduplication check
        if (userId) {
            const existingResponse = await db.select().from(responses)
            .where(and(eq(responses.pollId, pollId), eq(responses.respondentId, userId)))
            .limit(1)

            if (existingResponse && existingResponse.length > 0) {
                throw ApiError.conflict('User has already responded to this poll')
            }
        } else {
            const existingResponse = await db.select().from(responses)
            .where(and(eq(responses.pollId, pollId), eq(responses.visitorId, visitorId)))
            .limit(1)
            if (existingResponse && existingResponse.length > 0) {
                throw ApiError.conflict('Visitor has already responded to this poll')
            }
        }
  // 3. Validate that every submitted questionId belongs to this poll
  //    and every submitted optionId belongs to its respective question
        const pollQuestions = await db.select().from(questions)
        .where(eq(questions.pollId, pollId))

        const pollQuestionIds = new Set(pollQuestions.map(q => q.id))

        for (const answer of answers) {
            if (!pollQuestionIds.has(answer.questionId)) {
                throw ApiError.badRequest(`Question ${answer.questionId} does not belong to this poll`)
            }
        }

        // Validate option ownership — fetch all valid options for this poll's questions
        const answersWithOptions = answers.filter(a => a.optionId !== null)
        if (answersWithOptions.length > 0) {
            const submittedOptionIds = answersWithOptions.map(a => a.optionId!) 
            const validOptions = await db.select({ id: options.id, questionId: options.questionId })
                .from(options)
                .where(inArray(options.id, submittedOptionIds))

            const validOptionMap = new Map(validOptions.map(o => [o.id, o.questionId]))

            for (const answer of answersWithOptions) {
                const ownerQuestionId = validOptionMap.get(answer.optionId!)
                if (!ownerQuestionId) {
                    throw ApiError.badRequest(`Option ${answer.optionId} does not exist`)
                }
                if (ownerQuestionId !== answer.questionId) {
                    throw ApiError.badRequest(`Option ${answer.optionId} does not belong to question ${answer.questionId}`)
                }
            }
        }

  // 4. check mandatory questions answered
        const mandatoryQuestions = pollQuestions.filter(q => q.isMandatory)

        for (const question of mandatoryQuestions) {
            const answered = answers.find(a => a.questionId === question.id && a.optionId !== null)
            if (!answered) {
                throw ApiError.badRequest('All mandatory questions must be answered')
            }
        }

  // 5. transaction:
  //    - insert into responses table → get response.id
  //    - insert into answers table for each answer
        try {
            const result = await db.transaction(async (trx) => {
                const [response] = await trx.insert(responses).values({
                    pollId,
                    respondentId: userId,
                    visitorId
                }).returning()

                for (const answer of answers) {
                    await trx.insert(answersTable).values({
                        responseId: response.id,
                        questionId: answer.questionId,
                        optionId: answer.optionId
                    })
                }
                return response
            }

            )
            // Emit socket events best-effort: a socket failure must never
            // roll back or fail an already-committed DB write.
            try {
                const io = getIO()
                const [{ totalResponses }] = await db
                  .select({ totalResponses: count() })
                  .from(responses)
                  .where(eq(responses.pollId, pollId))

                io.to(`poll:${pollId}:creator`).emit('poll:response_received', {
                    totalResponses,
                    pollId
                })

                io.to(`poll:${pollId}:thankyou`).emit('poll:stats_update', {
                    pollId
                })
            } catch (socketError) {
                // Log but do not rethrow — the response is already persisted
                console.error('Socket notify failed (non-critical):', socketError)
            }

            return result
        }
        catch (error) {
            console.error('Error submitting response:', error)
            throw error
        }

}
    async getStats(pollId: string , userId: string | null, visitorId: string) {
        try {

            const poll = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)
            if (!poll || poll.length === 0) {
                throw ApiError.notFound('Poll not found')
            }

            if(poll[0].status !== 'published'){
                const existing = await db.select().from(responses)
                .where(and(
                eq(responses.pollId, pollId),
                userId ? eq(responses.respondentId, userId) : eq(responses.visitorId, visitorId)
                )).limit(1)
                if (existing.length === 0) {
                throw ApiError.forbidden('Response not found for this user/visitor')
                }
            } 
            const questionsWithOptions = await this.getQuestionsWithOptions(pollId)


            const optionCounts = await db
            .select({
            optionId: answersTable.optionId,
            count: count()
            })
            .from(answersTable)
            .innerJoin(responses, eq(answersTable.responseId, responses.id))
            .where(eq(responses.pollId, pollId))
            .groupBy(answersTable.optionId)


            const merged = questionsWithOptions.map(question => ({
            ...question,
            options: question.options.map(option => ({
            ...option,
            count: optionCounts.find(c => c.optionId === option.id)?.count ?? 0
            }))
            }))
            const [{ totalResponses }] = await db
            .select({ totalResponses: count() })
            .from(responses)
            .where(eq(responses.pollId, pollId))

            return { questions: merged, totalResponses: totalResponses }

        }
        catch (error) {
        console.error('Error fetching stats:', error)
        throw error
        }
    }

    async getAnalytics(pollId : string , userId: string){
            try {
                const poll = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)
                if (!poll || poll.length === 0) {
                    throw ApiError.notFound('Poll not found')
                }
                if(poll[0].creatorId !== userId){
                    throw ApiError.forbidden('User not authorized to view analytics for this poll')
                }
                
                // Total responses count
                const [{ totalResponses }] = await db.select({ totalResponses: count() })
                .from(responses)
                .where(eq(responses.pollId, pollId))
                // Question stats with percentages
                const questionsData = await db.select().from(questions)
                .where(eq(questions.pollId, pollId))

                    const optionCounts = await db
                    .select({ optionId: answersTable.optionId, count: count() })
                    .from(answersTable)
                    .innerJoin(responses, eq(answersTable.responseId, responses.id))
                    .where(eq(responses.pollId, pollId))
                    .groupBy(answersTable.optionId)

                    const optionsData = await db.select().from(options)
                    .where(inArray(options.questionId, questionsData.map(q => q.id)))

                    const questionStats = questionsData.map(question => {
                    const questionOptions = optionsData.filter(o => o.questionId === question.id)
                    const questionTotal = questionOptions.reduce((sum, opt) => {
                        return sum + (optionCounts.find(c => c.optionId === opt.id)?.count ?? 0)
                    }, 0)

                    return {
                        ...question,
                        options: questionOptions.map(opt => {
                        const optCount = optionCounts.find(c => c.optionId === opt.id)?.count ?? 0
                        return {
                            ...opt,
                            count: optCount,
                            percentage: questionTotal > 0 ? Math.round((optCount / questionTotal) * 100) : 0
                        }
                        })
                    }
                    })
                // Response timeline
                    const timeline = await db
                    .select({
                        hour: sql<string>`DATE_TRUNC('hour', ${responses.submittedAt})`,
                        count: count()
                    })
                    .from(responses)
                    .where(eq(responses.pollId, pollId))
                    .groupBy(sql`DATE_TRUNC('hour', ${responses.submittedAt})`)

                    return {
                        totalResponses,
                        questionStats,
                        timeline    
                    }

    }
    catch (error) {
        console.error('Error fetching analytics:', error)
        throw error
    }
    }

    async deletePoll(pollId: string, userId: string) {
        const [poll] = await db.select().from(polls)
        .where(eq(polls.id, pollId))
        .limit(1)

        if (!poll) throw ApiError.notFound('Poll not found')
        if (poll.creatorId !== userId) throw ApiError.forbidden()

        await db.delete(polls).where(eq(polls.id, pollId))
    }
}
