import {pgTable , text, timestamp, uuid, integer, pgEnum , boolean, index, uniqueIndex} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const pollStatusEnum = pgEnum('poll_status', 
  ['active', 'closed', 'published']
)

export const users = pgTable('users',{
    id : uuid('id').primaryKey().defaultRandom(),
    name : text('name').notNull(),
    email : text('email').notNull().unique(),
    password : text('password').notNull(),
    createdAt : timestamp('created_at').defaultNow()
})

export const polls = pgTable('polls',{
    id : uuid('id').primaryKey().defaultRandom(),
    creatorId : uuid('creator_id').references(() => users.id,{onDelete: 'cascade'}).notNull(),
    title : text('title').notNull(),
    description : text('description'),
    isAnonymous : boolean('is_anonymous').notNull().default(false),
    createdAt : timestamp('created_at').defaultNow(),
    expiresAt : timestamp('expires_at').notNull().$defaultFn(() => new Date(Date.now() + 1  * 24 * 60 * 60 * 1000)), // default to 1 day from now
    status : pollStatusEnum('status').notNull().default('active')
},(table) => [index('idx_polls_creator_id').on(table.creatorId)])

export const questions = pgTable('questions',{
    id : uuid('id').primaryKey().defaultRandom(),
    pollId : uuid('poll_id').references(() => polls.id,{onDelete: 'cascade'}).notNull(),
    orderIndex : integer('order_index').notNull().default(0),
    isMandatory : boolean('is_mandatory').notNull().default(false),
    questionText : text('question_text').notNull()
},(table) => [index('idx_questions_poll_id').on(table.pollId)])

export const options = pgTable('options',{
    id : uuid('id').primaryKey().defaultRandom(),
    questionId : uuid('question_id').references(() => questions.id,{onDelete: 'cascade'}).notNull(),
    orderIndex : integer('order_index').notNull().default(0),
    optionText : text('option_text').notNull()
},(table) => [index('idx_options_question_id').on(table.questionId)])

export const responses = pgTable('responses',{
    id : uuid('id').primaryKey().defaultRandom(),
    pollId : uuid('poll_id').references(() => polls.id,{onDelete: 'cascade'}).notNull(),
    respondentId : uuid('respondent_id').references(() => users.id,{onDelete: 'cascade'}),
    visitorId : text('visitor_id'),
    submittedAt : timestamp('submitted_at').defaultNow()
},(table) => [index('idx_responses_poll_id').on(table.pollId), index('idx_responses_respondent_id').on(table.respondentId),
uniqueIndex('uq_responses_poll_respondent').on(table.pollId, table.respondentId),
uniqueIndex('uq_responses_poll_visitor').on(table.pollId, table.visitorId)
])

export const answers = pgTable('answers',{
    id : uuid('id').primaryKey().defaultRandom(),
    responseId : uuid('response_id').references(() => responses.id,{onDelete: 'cascade'}).notNull(),
    questionId : uuid('question_id').references(() => questions.id,{onDelete: 'cascade'}).notNull(),
    optionId : uuid('option_id').references(() => options.id,{onDelete: 'cascade'})
},(table) => [index('idx_answers_response_id').on(table.responseId), index('idx_answers_question_id').on(table.questionId)])

// Stores revoked refresh token JTIs so logout actually invalidates them.
// Rows are cleaned up automatically after 7 days (the refresh token TTL).
export const refreshTokenDenylist = pgTable('refresh_token_denylist', {
    jti: text('jti').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at').default(sql`now()`).notNull(),
}, (table) => [index('idx_rtd_expires_at').on(table.expiresAt)])



