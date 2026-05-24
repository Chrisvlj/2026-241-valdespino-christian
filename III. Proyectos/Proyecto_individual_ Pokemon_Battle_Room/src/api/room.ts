import { Hono } from 'hono'
import { getDb } from '../lib/db'
import { assignMovesToPokemon } from './battle-engine'
import { broadcastToRoom } from './ws'
import type { Room, RoomPlayer, Battle, BattlePokemon, BattleMove, PlayerInventory } from '../../types'

const roomRouter = new Hono()

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function extractAuth(c: any): { playerId: string; playerToken: string } {
  const fromQuery = { playerId: c.req.query('playerId'), playerToken: c.req.query('playerToken') }
  const fromHeader = { playerId: c.req.header('x-player-id'), playerToken: c.req.header('x-player-token') }
  return {
    playerId: fromQuery.playerId || fromHeader.playerId || '',
    playerToken: fromQuery.playerToken || fromHeader.playerToken || '',
  }
}

roomRouter.post('/api/rooms', async (c) => {
  try {
    const db = getDb()
    const roomsCollection = db.collection<Room>('rooms')

    let code: string
    do {
      code = generateRoomCode()
    } while (await roomsCollection.findOne({ code }))

    const playerId = crypto.randomUUID()
    const playerToken = crypto.randomUUID()
    const body = await c.req.json().catch(() => ({})) as { name?: string }

    const player: RoomPlayer = {
      playerId,
      playerToken,
      name: body.name?.trim() || `Player 1`,
      ready: false,
      team: [],
      activePokemonIndex: 0,
      actionsSubmitted: false,
      selectedAction: null,
    }

    const room: Room = {
      code,
      status: 'waiting',
      players: [player],
      bans: [],
      currentBanTurn: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await roomsCollection.insertOne(room)

    return c.json({ roomCode: code, playerId, playerToken })
  } catch (error) {
    return c.json({ error: 'Failed to create room' }, 500)
  }
})

roomRouter.post('/api/rooms/:code/join', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const roomsCollection = db.collection<Room>('rooms')

    const room = await roomsCollection.findOne({ code })
    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    if (room.players.length >= 2) {
      return c.json({ error: 'Room is full' }, 400)
    }

    const playerId = crypto.randomUUID()
    const playerToken = crypto.randomUUID()
    const body = await c.req.json().catch(() => ({})) as { name?: string }

    const player: RoomPlayer = {
      playerId,
      playerToken,
      name: body.name?.trim() || `Player 2`,
      ready: false,
      team: [],
      activePokemonIndex: 0,
      actionsSubmitted: false,
      selectedAction: null,
    }

    const updatedStatus = room.players.length + 1 >= 2 ? 'banning' : room.status

    await roomsCollection.updateOne(
      { code },
      {
        $push: { players: player },
        $set: { status: updatedStatus, updatedAt: new Date() },
      }
    )

    const updatedRoom = await roomsCollection.findOne({ code })
    const playersPublic = updatedRoom!.players.map(p => ({
      playerId: p.playerId,
      name: p.name,
      ready: p.ready,
    }))

    broadcastToRoom(code, { type: 'player-joined', playerName: player.name })

    return c.json({
      roomCode: code,
      playerId,
      playerToken,
      players: playersPublic,
    })
  } catch (error) {
    return c.json({ error: 'Failed to join room' }, 500)
  }
})

roomRouter.get('/api/rooms/:code', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const { playerId } = extractAuth(c)

    const room = await db.collection<Room>('rooms').findOne({ code })
    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    if (!room.players.some(p => p.playerId === playerId)) {
      return c.json({ error: 'Not a member of this room' }, 403)
    }

    const playersPublic = room.players.map(p => ({
      playerId: p.playerId,
      name: p.name,
      ready: p.ready,
      teamSize: p.team.length,
    }))

    return c.json({
      roomCode: room.code,
      status: room.status,
      players: playersPublic,
      bans: room.bans,
      currentBanTurn: room.currentBanTurn,
      phase: room.status,
    })
  } catch (error) {
    return c.json({ error: 'Failed to get room' }, 500)
  }
})

roomRouter.get('/api/rooms/:code/state', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const { playerId, playerToken } = extractAuth(c)

    const room = await db.collection<Room>('rooms').findOne({ code })
    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const player = room.players.find(p => p.playerId === playerId)
    if (!player) {
      return c.json({ error: 'Not a member of this room' }, 403)
    }

    if (player.playerToken !== playerToken) {
      return c.json({ error: 'Invalid token' }, 403)
    }

    const opponent = room.players.find(p => p.playerId !== playerId)

    const state = {
      roomCode: room.code,
      status: room.status,
      bans: room.bans,
      currentBanTurn: room.currentBanTurn,
      me: {
        playerId: player.playerId,
        playerToken: player.playerToken,
        name: player.name,
        ready: player.ready,
        team: player.team,
        activePokemonIndex: player.activePokemonIndex,
        actionsSubmitted: player.actionsSubmitted,
      },
      opponent: opponent ? {
        playerId: opponent.playerId,
        name: opponent.name,
        ready: opponent.ready,
        teamSize: opponent.team.length,
      } : null,
    }

    return c.json(state)
  } catch (error) {
    return c.json({ error: 'Failed to get room state' }, 500)
  }
})

roomRouter.post('/api/rooms/:code/bans', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const body = await c.req.json() as { playerId?: string; playerToken?: string; pokemonId: number }
    const auth = extractAuth(c)
    const playerId = body.playerId || auth.playerId
    const playerToken = body.playerToken || auth.playerToken
    const pokemonId = body.pokemonId

    const roomsCollection = db.collection<Room>('rooms')
    const room = await roomsCollection.findOne({ code })
    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const playerIndex = room.players.findIndex(p => p.playerId === playerId)
    if (playerIndex === -1) {
      return c.json({ error: 'Not a member of this room' }, 403)
    }

    if (room.players[playerIndex].playerToken !== playerToken) {
      return c.json({ error: 'Invalid token' }, 403)
    }

    if (room.status !== 'banning') {
      return c.json({ error: 'Room is not in banning phase' }, 400)
    }

    if (room.currentBanTurn !== playerIndex) {
      return c.json({ error: 'Not your turn to ban' }, 400)
    }

    if (room.bans.includes(pokemonId)) {
      return c.json({ error: 'Pokemon already banned' }, 400)
    }

    const playerBans = room.bans.filter((_, i) => i % 2 === playerIndex)
    if (playerBans.length >= 3) {
      return c.json({ error: 'Already reached max bans (3)' }, 400)
    }

    room.bans.push(pokemonId)
    const nextBanTurn = room.currentBanTurn === 0 ? 1 : 0
    let newStatus: Room['status'] = room.status

    if (room.bans.length >= 6) {
      newStatus = 'selecting'
    }

    await roomsCollection.updateOne(
      { code },
      {
        $set: {
          bans: room.bans,
          currentBanTurn: nextBanTurn,
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    )

    broadcastToRoom(code, { type: 'ban-update', bans: room.bans, currentBanTurn: nextBanTurn })

    return c.json({ bans: room.bans, currentBanTurn: nextBanTurn })
  } catch (error) {
    return c.json({ error: 'Failed to submit ban' }, 500)
  }
})

roomRouter.post('/api/rooms/:code/team', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const body = await c.req.json() as { playerId?: string; playerToken?: string; team?: number[]; pokemonIds?: number[] }
    const auth = extractAuth(c)
    const playerId = body.playerId || auth.playerId
    const playerToken = body.playerToken || auth.playerToken
    const team = body.team || body.pokemonIds || []

    const roomsCollection = db.collection<Room>('rooms')
    const room = await roomsCollection.findOne({ code })
    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const playerIndex = room.players.findIndex(p => p.playerId === playerId)
    if (playerIndex === -1) {
      return c.json({ error: 'Not a member of this room' }, 403)
    }

    if (room.players[playerIndex].playerToken !== playerToken) {
      return c.json({ error: 'Invalid token' }, 403)
    }

    if (room.status !== 'selecting') {
      return c.json({ error: 'Cannot select team in current phase' }, 400)
    }

    if (room.players[playerIndex].ready) {
      return c.json({ error: 'Team is already locked' }, 400)
    }

    const inventoryCollection = db.collection<PlayerInventory>('inventory')
    const inventory = await inventoryCollection.findOne({ playerId })
    const maxTeamSize = 6 + (inventory?.ownedExtraTeamSlots || 0)
    const pokemonCollection = db.collection<any>('pokemon')
    const movesCollection = db.collection<any>('moves')

    if (team.length < 1 || team.length > maxTeamSize) {
      return c.json({ error: `Team must have 1-${maxTeamSize} pokemon` }, 400)
    }

    const uniqueTeam = [...new Set(team)]
    if (uniqueTeam.length !== team.length) {
      return c.json({ error: 'Duplicate pokemon in team' }, 400)
    }

    const bannedInTeam = team.filter(id => room.bans.includes(id))
    if (bannedInTeam.length > 0) {
      return c.json({ error: 'Team contains banned pokemon' }, 400)
    }

    const legendarySlots = inventory?.ownedLegendarySlots || 0
    const legendaryCount = await pokemonCollection.countDocuments({
      pokedexId: { $in: team },
      $or: [{ isLegendary: true }, { isMythical: true }],
    })
    if (legendaryCount > 1 + legendarySlots) {
      return c.json({ error: `Too many legendary/mythical Pokemon. Limit: ${1 + legendarySlots}` }, 400)
    }

    const allMoves = await movesCollection.find({}).toArray()

    const battleTeam: BattlePokemon[] = []

    for (const pokedexId of team) {
      const pokemonData = await pokemonCollection.findOne({ pokedexId })
      if (!pokemonData) {
        return c.json({ error: `Pokemon with ID ${pokedexId} not found` }, 400)
      }

      let moves = assignMovesToPokemon(pokemonData, allMoves)

      if (inventory?.ownedExtraAttacks) {
        const extraAttackEntry = inventory.ownedExtraAttacks.find(a => a.pokemonId === pokedexId)
        if (extraAttackEntry && extraAttackEntry.moveIds.length > 0) {
          const extraMoves = extraAttackEntry.moveIds
            .map(mid => {
              const move = allMoves.find((m: any) => m.pokeapiId === mid)
              if (!move) return null
              return {
                moveId: move.pokeapiId,
                name: move.name,
                type: move.type,
                power: move.power,
                accuracy: move.accuracy,
                priority: move.priority,
                damageClass: move.damageClass,
                target: move.target,
                effect: move.effect,
                pp: 5,
                maxPp: 5,
                ailment: move.ailment,
                ailmentChance: move.ailmentChance,
                statChanges: move.statChanges,
                statChance: move.statChance,
              } as BattleMove
            })
            .filter((m): m is BattleMove => m !== null && !moves.some(em => em.moveId === m.moveId))
          moves = [...moves, ...extraMoves]
        }
      }

      const isShinyOwned = inventory?.ownedShinyPokemon?.includes(pokedexId) || false
      const isShinyEvoOwned = inventory?.ownedShinyEvolutions?.includes(pokedexId) || false
      const useShiny = isShinyOwned || isShinyEvoOwned

      battleTeam.push({
        pokemonId: pokemonData.pokedexId,
        name: pokemonData.name,
        types: pokemonData.types,
        sprite: useShiny && pokemonData.spriteUrls.frontShiny
          ? pokemonData.spriteUrls.frontShiny
          : pokemonData.spriteUrls.frontDefault,
        shinySprite: pokemonData.spriteUrls.frontShiny,
        isShiny: useShiny,
        moves,
        currentHp: pokemonData.baseStats.hp,
        maxHp: pokemonData.baseStats.hp,
        stats: {
          attack: pokemonData.baseStats.attack,
          defense: pokemonData.baseStats.defense,
          specialAttack: pokemonData.baseStats.specialAttack,
          specialDefense: pokemonData.baseStats.specialDefense,
          speed: pokemonData.baseStats.speed,
        },
        status: null,
        fainted: false,
      })
    }

    const setField = `players.${playerIndex}.team` as const
    await roomsCollection.updateOne(
      { code },
      {
        $set: {
          [setField]: battleTeam,
          updatedAt: new Date(),
        },
      }
    )

    return c.json({ team: battleTeam })
  } catch (error) {
    return c.json({ error: 'Failed to save team' }, 500)
  }
})

roomRouter.post('/api/rooms/:code/ready', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const body = await c.req.json().catch(() => ({})) as { playerId?: string; playerToken?: string }
    const auth = extractAuth(c)
    const playerId = body.playerId || auth.playerId
    const playerToken = body.playerToken || auth.playerToken

    const roomsCollection = db.collection<Room>('rooms')
    const room = await roomsCollection.findOne({ code })
    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const playerIndex = room.players.findIndex(p => p.playerId === playerId)
    if (playerIndex === -1) {
      return c.json({ error: 'Not a member of this room' }, 403)
    }

    if (room.players[playerIndex].playerToken !== playerToken) {
      return c.json({ error: 'Invalid token' }, 403)
    }

    if (room.status !== 'selecting') {
      return c.json({ error: 'Room is not in selecting phase' }, 400)
    }

    if (room.players[playerIndex].team.length === 0) {
      return c.json({ error: 'Must select a team first' }, 400)
    }

    const readyField = `players.${playerIndex}.ready` as const
    await roomsCollection.updateOne(
      { code },
      {
        $set: {
          [readyField]: true,
          updatedAt: new Date(),
        },
      }
    )

    broadcastToRoom(code, { type: 'team-ready', playerId })

    const updatedRoom = await roomsCollection.findOne({ code })
    const bothReady = updatedRoom!.players.every(p => p.ready)

    if (bothReady) {
      await roomsCollection.updateOne(
        { code },
        {
          $set: {
            status: 'ready',
            updatedAt: new Date(),
          },
        }
      )
    }

    return c.json({ ready: true, bothReady })
  } catch (error) {
    return c.json({ error: 'Failed to set ready' }, 500)
  }
})

roomRouter.post('/api/rooms/:code/start-battle', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const body = await c.req.json().catch(() => ({})) as { playerId?: string; playerToken?: string }
    const auth = extractAuth(c)
    const playerId = body.playerId || auth.playerId
    const playerToken = body.playerToken || auth.playerToken

    const roomsCollection = db.collection<Room>('rooms')
    const room = await roomsCollection.findOne({ code })
    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const hostIndex = room.players.findIndex(p => p.playerId === playerId)
    if (hostIndex !== 0) {
      return c.json({ error: 'Only the host can start the battle' }, 403)
    }

    if (room.players[0].playerToken !== playerToken) {
      return c.json({ error: 'Invalid token' }, 403)
    }

    if (room.status !== 'ready') {
      return c.json({ error: 'Both players must be ready first' }, 400)
    }

    if (room.players[0].team.length === 0 || room.players[1].team.length === 0) {
      return c.json({ error: 'Both players must have teams' }, 400)
    }

    const battle: Battle = {
      roomCode: code,
      turn: 1,
      status: 'active',
      players: room.players.map(p => ({
        ...p,
        activePokemonIndex: 0,
        actionsSubmitted: false,
        selectedAction: null,
      })),
      battleLog: [{
        turn: 1,
        message: 'Battle started!',
        timestamp: new Date(),
      }],
      eventQueue: [],
      winnerPlayerId: null,
    }

    await db.collection<Battle>('battles').insertOne(battle)
    await roomsCollection.updateOne(
      { code },
      {
        $set: {
          status: 'battle',
          updatedAt: new Date(),
        },
      }
    )

    broadcastToRoom(code, { type: 'battle-started' })

    const sanitizedBattle = {
      roomCode: battle.roomCode,
      turn: battle.turn,
      status: battle.status,
      battleLog: battle.battleLog,
      eventQueue: battle.eventQueue,
      winnerPlayerId: battle.winnerPlayerId,
      players: battle.players.map(p => ({
        playerId: p.playerId,
        name: p.name,
        team: p.team,
        activePokemonIndex: p.activePokemonIndex,
      })),
    }

    return c.json(sanitizedBattle)
  } catch (error) {
    return c.json({ error: 'Failed to start battle' }, 500)
  }
})

roomRouter.post('/api/rooms/:code/forfeit', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const body = await c.req.json().catch(() => ({})) as { playerId?: string; playerToken?: string }
    const auth = extractAuth(c)
    const playerId = body.playerId || auth.playerId
    const playerToken = body.playerToken || auth.playerToken

    const roomsCollection = db.collection<Room>('rooms')
    const room = await roomsCollection.findOne({ code })
    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const playerIndex = room.players.findIndex(p => p.playerId === playerId)
    if (playerIndex === -1) {
      return c.json({ error: 'Not a member of this room' }, 403)
    }

    if (room.players[playerIndex].playerToken !== playerToken) {
      return c.json({ error: 'Invalid token' }, 403)
    }

    const winnerPlayerId = room.players.find((_, i) => i !== playerIndex)!.playerId

    await db.collection<Battle>('battles').updateOne(
      { roomCode: code },
      {
        $set: {
          status: 'finished',
          winnerPlayerId,
          eventQueue: [{ type: 'win', winnerPlayerId }],
        },
      }
    )

    await roomsCollection.updateOne(
      { code },
      {
        $set: {
          status: 'finished',
          updatedAt: new Date(),
        },
      }
    )

    broadcastToRoom(code, { type: 'battle-ended', winnerPlayerId })

    return c.json({ winner: winnerPlayerId })
  } catch (error) {
    return c.json({ error: 'Failed to forfeit' }, 500)
  }
})

roomRouter.get('/api/rooms/:code/shop-bonus', async (c) => {
  try {
    const db = getDb()
    const { playerId } = extractAuth(c)

    if (!playerId) {
      return c.json({ maxTeamSize: 6, maxLegendaries: 1, ownedShinyPokemon: [], ownedShinyEvolutions: [], ownedExtraAttacks: [] })
    }

    const inventoryCollection = db.collection<PlayerInventory>('inventory')
    const inventory = await inventoryCollection.findOne({ playerId })

    return c.json({
      maxTeamSize: 6 + (inventory?.ownedExtraTeamSlots || 0),
      maxLegendaries: 1 + (inventory?.ownedLegendarySlots || 0),
      ownedShinyPokemon: inventory?.ownedShinyPokemon || [],
      ownedShinyEvolutions: inventory?.ownedShinyEvolutions || [],
      ownedExtraAttacks: inventory?.ownedExtraAttacks || [],
    })
  } catch (error) {
    return c.json({ maxTeamSize: 6, maxLegendaries: 1, ownedShinyPokemon: [], ownedShinyEvolutions: [], ownedExtraAttacks: [] })
  }
})

export { roomRouter }
