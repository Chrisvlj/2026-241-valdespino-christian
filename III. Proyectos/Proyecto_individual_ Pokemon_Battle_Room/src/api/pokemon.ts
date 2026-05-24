import { Hono } from 'hono'
import { getDb } from '../lib/db'
import type { Pokemon } from '../../types'

const pokemonRouter = new Hono()

pokemonRouter.get('/api/pokemon', async (c) => {
  try {
    const db = getDb()
    const collection = db.collection<Pokemon>('pokemon')

    const nameSearch = c.req.query('name')
    const typeFilter = c.req.query('type')
    const legendary = c.req.query('legendary')
    const evolved = c.req.query('evolved')
    const shiny = c.req.query('shiny')
    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = parseInt(c.req.query('limit') || '50', 10)

    const filter: Record<string, any> = { eligible: true }

    if (nameSearch) {
      filter.name = { $regex: nameSearch, $options: 'i' }
    }

    if (typeFilter) {
      filter.types = typeFilter
    }

    if (legendary === 'true') {
      filter.isLegendary = true
    } else if (legendary === 'false') {
      filter.isLegendary = false
    }

    if (evolved === 'true') {
      filter.evolutionStage = { $gte: 1 }
    } else if (evolved === 'false') {
      filter.evolutionStage = 0
    }

    if (shiny === 'true') {
      filter.hasShinySprite = true
    } else if (shiny === 'false') {
      filter.hasShinySprite = false
    }

    const total = await collection.countDocuments(filter)
    const skip = (page - 1) * limit
    const data = await collection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray()

    return c.json({ data, total, page })
  } catch (error) {
    return c.json({ error: 'Failed to fetch pokemon' }, 500)
  }
})

pokemonRouter.get('/api/pokemon/:id', async (c) => {
  try {
    const db = getDb()
    const id = parseInt(c.req.param('id'), 10)
    const collection = db.collection<Pokemon>('pokemon')

    const pokemon = await collection.findOne({ pokedexId: id })
    if (!pokemon) {
      return c.json({ error: 'Pokemon not found' }, 404)
    }

    return c.json(pokemon)
  } catch (error) {
    return c.json({ error: 'Failed to fetch pokemon' }, 500)
  }
})

export { pokemonRouter }
