import { Hono } from 'hono'

// Simple in-memory pub/sub for room events
// The frontend polls endpoints directly, but broadcastToRoom
// is used by API routes to potentially notify connected clients

const wsRouter = new Hono()

// Health check for real-time connection
wsRouter.get('/api/health', (c) => {
  return c.json({ ok: true, timestamp: Date.now() })
})

export function broadcastToRoom(roomCode: string, message: object) {
  // In V1, real-time is handled via polling.
  // This function is a hook point for future WebSocket implementation.
  console.log(`[WS] Room ${roomCode}:`, JSON.stringify(message))
}

export { wsRouter }
