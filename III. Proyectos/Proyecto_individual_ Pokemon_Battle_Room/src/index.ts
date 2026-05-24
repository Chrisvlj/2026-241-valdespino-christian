import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { connectToDatabase } from './lib/db'
import { roomRouter } from './api/room'
import { battleRouter } from './api/battle'
import { pokemonRouter } from './api/pokemon'
import { wsRouter } from './api/ws'
import { shopRouter } from './api/shop'

const app = new Hono()

app.use('*', cors())

app.route('/', roomRouter)
app.route('/', battleRouter)
app.route('/', pokemonRouter)
app.route('/', wsRouter)
app.route('/', shopRouter)

if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist/public' }))
  app.get('*', serveStatic({ path: './dist/public/index.html' }))
}

const PORT = parseInt(process.env.PORT || '3000', 10)

async function main() {
  try {
    await connectToDatabase()
    console.log(`Server starting on port ${PORT}...`)
    serve({ fetch: app.fetch, port: PORT })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

main()
