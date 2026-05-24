import { Hono } from 'hono'
import { getDb } from '../lib/db'
import type { ShopItem, PlayerInventory, Pokemon, Move } from '../../types'

const shopRouter = new Hono()

const SHOP_CATALOG: Omit<ShopItem, '_id'>[] = [
  {
    itemId: 'shiny_pikachu',
    category: 'shiny',
    name: 'Shiny Pikachu',
    description: 'Desbloquea la forma shiny de Pikachu con sprite alternativo',
    price: 500,
    pokemonId: 25,
    stock: 1,
    icon: '⚡',
  },
  {
    itemId: 'shiny_charizard',
    category: 'shiny',
    name: 'Shiny Charizard',
    description: 'Desbloquea la forma shiny de Charizard con sprite alternativo',
    price: 800,
    pokemonId: 6,
    stock: 1,
    icon: '🔥',
  },
  {
    itemId: 'shiny_gyarados',
    category: 'shiny',
    name: 'Shiny Gyarados',
    description: 'El clasico Gyarados rojo brillante de Johto',
    price: 700,
    pokemonId: 130,
    stock: 1,
    icon: '🐉',
  },
  {
    itemId: 'shiny_lucario',
    category: 'shiny',
    name: 'Shiny Lucario',
    description: 'Lucario con aura dorada en su forma shiny',
    price: 600,
    pokemonId: 448,
    stock: 1,
    icon: '🔷',
  },
  {
    itemId: 'shiny_gengar',
    category: 'shiny',
    name: 'Shiny Gengar',
    description: 'Gengar blanco fantasmal en su forma shiny',
    price: 650,
    pokemonId: 94,
    stock: 1,
    icon: '👻',
  },
  {
    itemId: 'legendary_slot',
    category: 'legendary',
    name: 'Slot Legendario',
    description: 'Permite incluir 1 Pokemon legendario/mitico adicional en tu equipo',
    price: 1000,
    stock: 3,
    icon: '👑',
  },
  {
    itemId: 'team_slot_1',
    category: 'slot',
    name: 'Slot Extra #7',
    description: 'Expande tu equipo a 7 Pokemon en vez de 6',
    price: 1200,
    stock: 1,
    icon: '📦',
  },
  {
    itemId: 'team_slot_2',
    category: 'slot',
    name: 'Slot Extra #8',
    description: 'Expande tu equipo a 8 Pokemon en vez de 7',
    price: 1800,
    stock: 1,
    icon: '📦',
  },
  {
    itemId: 'attack_thunder',
    category: 'attack',
    name: 'Thunder',
    description: 'Compra el ataque Thunder para cualquier Pokemon que pueda aprenderlo',
    price: 300,
    moveId: 85,
    stock: 99,
    icon: '⚡',
  },
  {
    itemId: 'attack_flamethrower',
    category: 'attack',
    name: 'Flamethrower',
    description: 'Compra el ataque Flamethrower para cualquier Pokemon que pueda aprenderlo',
    price: 300,
    moveId: 53,
    stock: 99,
    icon: '🔥',
  },
  {
    itemId: 'attack_ice_beam',
    category: 'attack',
    name: 'Ice Beam',
    description: 'Compra el ataque Ice Beam para cualquier Pokemon que pueda aprenderlo',
    price: 300,
    moveId: 58,
    stock: 99,
    icon: '🧊',
  },
  {
    itemId: 'attack_earthquake',
    category: 'attack',
    name: 'Earthquake',
    description: 'Compra el ataque Earthquake para cualquier Pokemon que pueda aprenderlo',
    price: 350,
    moveId: 89,
    stock: 99,
    icon: '🌍',
  },
  {
    itemId: 'attack_shadow_ball',
    category: 'attack',
    name: 'Shadow Ball',
    description: 'Compra el ataque Shadow Ball para cualquier Pokemon que pueda aprenderlo',
    price: 280,
    moveId: 247,
    stock: 99,
    icon: '👻',
  },
  {
    itemId: 'attack_psychic',
    category: 'attack',
    name: 'Psychic',
    description: 'Compra el ataque Psychic para cualquier Pokemon que pueda aprenderlo',
    price: 320,
    moveId: 94,
    stock: 99,
    icon: '🔮',
  },
  {
    itemId: 'shiny_evo_charmeleon',
    category: 'shiny_evo',
    name: 'Evolucion Shiny Charmeleon',
    description: 'Evoluciona tu Charmeleon a Charizard directamente en su forma shiny',
    price: 900,
    pokemonId: 5,
    stock: 1,
    icon: '🦎',
  },
  {
    itemId: 'shiny_evo_dratini',
    category: 'shiny_evo',
    name: 'Evolucion Shiny Dratini',
    description: 'Evoluciona tu Dratini a Dragonair y Dragonite en su forma shiny',
    price: 950,
    pokemonId: 147,
    stock: 1,
    icon: '🐉',
  },
  {
    itemId: 'shiny_evo_eevee',
    category: 'shiny_evo',
    name: 'Evolucion Shiny Eevee',
    description: 'Evoluciona tu Eevee a cualquier evolucion en su forma shiny',
    price: 850,
    pokemonId: 133,
    stock: 1,
    icon: '🦊',
  },
  {
    itemId: 'shiny_evo_ralts',
    category: 'shiny_evo',
    name: 'Evolucion Shiny Ralts',
    description: 'Evoluciona tu Ralts a Gardevoir o Gallade en su forma shiny',
    price: 800,
    pokemonId: 280,
    stock: 1,
    icon: '💃',
  },
]

async function getOrCreateInventory(db: ReturnType<typeof getDb>, playerId: string): Promise<PlayerInventory> {
  const collection = db.collection<PlayerInventory>('inventory')
  let inventory = await collection.findOne({ playerId })

  if (!inventory) {
    const newInventory: PlayerInventory = {
      playerId,
      coins: 1000,
      ownedShinyPokemon: [],
      ownedLegendarySlots: 0,
      ownedExtraTeamSlots: 0,
      ownedExtraAttacks: [],
      ownedShinyEvolutions: [],
      purchasedItems: [],
    }
    await collection.insertOne(newInventory)
    inventory = await collection.findOne({ playerId })
  }

  return inventory!
}

shopRouter.get('/api/shop/items', async (c) => {
  try {
    const db = getDb()
    const category = c.req.query('category') as ShopItem['category'] | undefined

    let items = SHOP_CATALOG
    if (category) {
      items = items.filter(i => i.category === category)
    }

    const pokemonCollection = db.collection<Pokemon>('pokemon')
    const enriched = await Promise.all(items.map(async (item) => {
      if (item.pokemonId) {
        const pokemon = await pokemonCollection.findOne({ pokedexId: item.pokemonId })
        if (pokemon) {
          return {
            ...item,
            pokemonName: pokemon.name,
            pokemonSprite: pokemon.spriteUrls.frontDefault,
            pokemonShinySprite: pokemon.spriteUrls.frontShiny || null,
            pokemonTypes: pokemon.types,
          }
        }
      }
      if (item.moveId) {
        const movesCollection = db.collection<Move>('moves')
        const move = await movesCollection.findOne({ pokeapiId: item.moveId })
        if (move) {
          return {
            ...item,
            moveType: move.type,
            movePower: move.power,
            moveAccuracy: move.accuracy,
            moveDamageClass: move.damageClass,
          }
        }
      }
      return item
    }))

    return c.json({ items: enriched })
  } catch (error) {
    return c.json({ error: 'Failed to fetch shop items' }, 500)
  }
})

shopRouter.get('/api/shop/inventory', async (c) => {
  try {
    const db = getDb()
    const playerId = c.req.query('playerId') || c.req.header('x-player-id') || ''

    if (!playerId) {
      return c.json({ error: 'playerId is required' }, 400)
    }

    const inventory = await getOrCreateInventory(db, playerId)
    return c.json(inventory)
  } catch (error) {
    return c.json({ error: 'Failed to fetch inventory' }, 500)
  }
})

shopRouter.post('/api/shop/purchase', async (c) => {
  try {
    const db = getDb()
    const body = await c.req.json() as { playerId: string; itemId: string; pokemonId?: number }
    const { playerId, itemId, pokemonId } = body

    if (!playerId || !itemId) {
      return c.json({ error: 'playerId and itemId are required' }, 400)
    }

    const item = SHOP_CATALOG.find(i => i.itemId === itemId)
    if (!item) {
      return c.json({ error: 'Item not found in shop' }, 404)
    }

    const inventory = await getOrCreateInventory(db, playerId)
    const alreadyPurchased = inventory.purchasedItems.some(p => p.itemId === itemId)
    if (alreadyPurchased && item.stock === 1) {
      return c.json({ error: 'Item already purchased' }, 400)
    }

    if (inventory.coins < item.price) {
      return c.json({ error: `Not enough coins. Need ${item.price}, have ${inventory.coins}` }, 400)
    }

    if (item.category === 'attack' && !pokemonId) {
      return c.json({ error: 'pokemonId is required when purchasing an attack' }, 400)
    }

    if (item.category === 'attack' && pokemonId) {
      const pokemonCollection = db.collection<Pokemon>('pokemon')
      const pokemon = await pokemonCollection.findOne({ pokedexId: pokemonId })
      if (!pokemon) {
        return c.json({ error: 'Pokemon not found' }, 404)
      }
      if (!pokemon.moveIds.includes(item.moveId!)) {
        return c.json({ error: `${pokemon.name} cannot learn ${item.name}` }, 400)
      }
      const existingAttack = inventory.ownedExtraAttacks.find(a => a.pokemonId === pokemonId)
      if (existingAttack && existingAttack.moveIds.includes(item.moveId!)) {
        return c.json({ error: 'Attack already purchased for this Pokemon' }, 400)
      }
    }

    const updateFields: Record<string, any> = {
      coins: inventory.coins - item.price,
      $push: { purchasedItems: { itemId, purchasedAt: new Date() } } as any,
    }

    switch (item.category) {
      case 'shiny':
        if (item.pokemonId) {
          updateFields.$push = { ...updateFields.$push, ownedShinyPokemon: item.pokemonId }
        }
        break
      case 'legendary':
        updateFields.ownedLegendarySlots = inventory.ownedLegendarySlots + 1
        break
      case 'slot':
        updateFields.ownedExtraTeamSlots = inventory.ownedExtraTeamSlots + 1
        break
      case 'attack':
        if (pokemonId && item.moveId) {
          const existingIdx = inventory.ownedExtraAttacks.findIndex(a => a.pokemonId === pokemonId)
          if (existingIdx >= 0) {
            updateFields[`ownedExtraAttacks.${existingIdx}.moveIds`] = [
              ...inventory.ownedExtraAttacks[existingIdx].moveIds,
              item.moveId,
            ]
          } else {
            updateFields.$push = {
              ...updateFields.$push,
              ownedExtraAttacks: { pokemonId, moveIds: [item.moveId] },
            }
          }
        }
        break
      case 'shiny_evo':
        if (item.pokemonId) {
          updateFields.$push = { ...updateFields.$push, ownedShinyEvolutions: item.pokemonId }
        }
        break
    }

    const collection = db.collection<PlayerInventory>('inventory')

    if (updateFields.$push && Object.keys(updateFields.$push).length > 0) {
      const setFields = { ...updateFields }
      delete setFields.$push
      await collection.updateOne(
        { playerId },
        {
          $set: setFields,
          $push: updateFields.$push,
        }
      )
    } else {
      const { $push, ...setFields } = updateFields as any
      await collection.updateOne(
        { playerId },
        { $set: setFields }
      )
    }

    const updatedInventory = await collection.findOne({ playerId })
    return c.json({ success: true, inventory: updatedInventory })
  } catch (error) {
    return c.json({ error: 'Failed to process purchase' }, 500)
  }
})

shopRouter.post('/api/shop/claim-coins', async (c) => {
  try {
    const db = getDb()
    const body = await c.req.json() as { playerId: string; amount: number }
    const { playerId, amount } = body

    if (!playerId || !amount || amount <= 0) {
      return c.json({ error: 'Valid playerId and amount are required' }, 400)
    }

    if (amount > 500) {
      return c.json({ error: 'Maximum claim per request is 500 coins' }, 400)
    }

    const collection = db.collection<PlayerInventory>('inventory')
    const inventory = await getOrCreateInventory(db, playerId)

    await collection.updateOne(
      { playerId },
      { $set: { coins: inventory.coins + amount } }
    )

    const updated = await collection.findOne({ playerId })
    return c.json({ success: true, coins: updated!.coins })
  } catch (error) {
    return c.json({ error: 'Failed to claim coins' }, 500)
  }
})

export { shopRouter }
