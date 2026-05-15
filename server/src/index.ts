import  {config } from 'dotenv';
config();   
import cors from 'cors';
import express from 'express';
import authRouter from './module/auth/auth.routes';
import cookieParser from 'cookie-parser';
import { ApiError } from './common/errors';
import pollsRouter from './module/polls/polls.routes';
import { polls } from './db/schema';
import { db } from './db/index';
import { eq, and, lt } from 'drizzle-orm';
import {createServer} from 'http'
import { Server } from 'socket.io';
import { initSocket } from './common/socket';




const PORT = process.env.PORT || 8080;
const app = express();
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    }
})
initSocket(io);

//cors
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'||
    'http://127.0.0.1:5173',
    credentials: true,

}))


app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRouter)
app.use('/api/polls', pollsRouter)





app.get('/api/health' , (req ,res) => {
    res.status(200).json({ status: 'ok' });
})


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('ERROR:', err.message, err.stack)
  
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  res.status(500).json({ error: 'Internal Server Error' })
})

setInterval(async () => {
  await db.update(polls)
    .set({ status: 'closed' })
    .where(
      and(
        eq(polls.status, 'active'),
        lt(polls.expiresAt, new Date())
      )
    )
}, 60 * 1000)

//socket Connections
io.on('connection' , (socket) => {
  // join:poll — public room for respondents watching status changes
  socket.on('join:poll',(pollId : string) => {
    socket.join(`poll:${pollId}`)
  })

  // join:creator — protected: require a valid access token sent with the event
  socket.on('join:creator' , (pollId : string, token: string) => {
    try {
      if (!token) return
      const { verifyAccessToken } = require('./common/auth')
      const userId: string = verifyAccessToken(token)
      if (!userId) return
      // Store userId on socket for later verification if needed
      socket.data.userId = userId
      socket.join(`poll:${pollId}:creator`)
    } catch {
      // Invalid/expired token — silently ignore; client won't receive events
    }
  })

  // join:thankyou — public room; respondents see live count after submitting
  socket.on('join:thankyou' , (pollId : string) => {
    socket.join(`poll:${pollId}:thankyou`)
  })

  socket.on('disconnect' , () => {
    // intentionally silent in production
  })
})

httpServer.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
})