import { z} from 'zod'


export const pollSchema = z.object({
    title : z.string().min(1),
    description : z.string().optional(),
    isAnonymous : z.boolean(),
    expiresAt : z.iso.datetime().refine((val) => new Date(val) > new Date(), {message : 'Expiration date must be in the future'}),
    questions : z.array(z.object({
        questionText : z.string().min(1),
        isMandatory : z.boolean(),
        options : z.array(z.object({
            optionText : z.string().min(1)
        })).min(2).max(4)
    })).min(1)
})

export const submitResponseSchema = z.object({
  visitorId: z.string(),
  answers: z.array(z.object({
    questionId: z.uuid(),
    optionId: z.uuid().nullable()
  })).min(1)
})
