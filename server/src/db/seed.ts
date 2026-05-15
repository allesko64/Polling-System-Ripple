import { config } from 'dotenv'
config()
import * as schema from './schema'
import { db } from './index'
console.log('DATABASE_URL:', process.env.DATABASE_URL)
import bcrypt from 'bcrypt'

async function seed() {
  console.log('Clearing data...')
  await db.delete(schema.options)
  await db.delete(schema.questions)
  await db.delete(schema.polls)
  await db.delete(schema.users)
  console.log('Cleared.')

  console.log('Inserting users...')
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const [user1, user2] = await db.insert(schema.users).values([
    {
      name: 'Alice',
      email: 'alice@test.com',
      password: hashedPassword,
    },
    {
      name: 'Bob',
      email: 'bob@test.com',
      password: hashedPassword,
    }
  ]).returning()

  // Create 1 poll
  const [poll] = await db.insert(schema.polls).values({
    creatorId: user1.id,
    title: 'Test Poll',
    description: 'A test poll',
    isAnonymous: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'active'
  }).returning()

  // Create 3 questions
  const insertedQuestions = await db.insert(schema.questions).values([
    { pollId: poll.id, questionText: 'Question 1', orderIndex: 0, isMandatory: true },
    { pollId: poll.id, questionText: 'Question 2', orderIndex: 1, isMandatory: true },
    { pollId: poll.id, questionText: 'Question 3', orderIndex: 2, isMandatory: false },
  ]).returning()

  // Create 3 options per question
  for (const question of insertedQuestions) {
    await db.insert(schema.options).values([
      { questionId: question.id, optionText: 'Option A', orderIndex: 0 },
      { questionId: question.id, optionText: 'Option B', orderIndex: 1 },
      { questionId: question.id, optionText: 'Option C', orderIndex: 2 },
    ])
  }

  console.log('Seed complete')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})