import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { AccessToken } from 'livekit-server-sdk'

const app = express()

const allowedOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
}))

app.get('/token', async (req, res) => {
  const room = req.query.room || 'demo'
  const identity = req.query.identity || `user-${Math.random().toString(16).slice(2)}`
  const name = req.query.name || identity
  const role = req.query.role || 'viewer'

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  if (!apiKey || !apiSecret) {
    return res.status(500).send('Missing LIVEKIT_API_KEY/SECRET in .env')
  }

  const token = new AccessToken(apiKey, apiSecret, { identity, name })
  token.addGrant({
    roomJoin: true,
    room,
    canPublish: role === 'host',
    canSubscribe: true,
  })

  const jwt = await token.toJwt()
  res.json({ token: jwt })
})

app.listen(3001, '0.0.0.0', () => {
  console.log('Token server listening on http://0.0.0.0:3001')
})
