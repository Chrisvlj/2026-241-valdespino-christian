import { createServer } from 'vite'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { connectToDatabase } from '../src/lib/db'
import { roomRouter } from '../src/api/room'
import { battleRouter } from '../src/api/battle'
import { pokemonRouter } from '../src/api/pokemon'
import { wsRouter } from '../src/api/ws'

async function main() {
  await connectToDatabase()

  const api = new Hono()
  api.use('*', cors())
  api.route('/', roomRouter)
  api.route('/', battleRouter)
  api.route('/', pokemonRouter)
  api.route('/', wsRouter)

  serve({ fetch: api.fetch, port: 3001 })
  console.log('API server running on http://localhost:3001')

  const vite = await createServer({
    server: { port: 3000, proxy: { '/api': 'http://localhost:3001' } },
  })
  await vite.listen()
  console.log('Vite dev server running on http://localhost:3000')
}

main().catch(console.error)
