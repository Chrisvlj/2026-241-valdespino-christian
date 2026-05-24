import { Hono } from 'hono'
import { getDb } from '../lib/db'
import { resolveTurn } from './battle-engine'
import { broadcastToRoom } from './ws'
import type { Battle, BattleAction } from '../../types'

const battleRouter = new Hono()

battleRouter.get('/api/rooms/:code/battle', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const fromQuery = { playerId: c.req.query('playerId'), playerToken: c.req.query('playerToken') }
    const fromHeader = { playerId: c.req.header('x-player-id'), playerToken: c.req.header('x-player-token') }
    const playerId = fromQuery.playerId || fromHeader.playerId || ''
    const playerToken = fromQuery.playerToken || fromHeader.playerToken || ''

    const battle = await db.collection<Battle>('battles').findOne({ roomCode: code })
    if (!battle) {
      return c.json({ error: 'Battle not found' }, 404)
    }

    const playerIndex = battle.players.findIndex(p => p.playerId === playerId)
    if (playerIndex === -1) {
      return c.json({ error: 'Not a member of this battle' }, 403)
    }

    if (battle.players[playerIndex].playerToken !== playerToken) {
      return c.json({ error: 'Invalid token' }, 403)
    }

    const opponentIndex = playerIndex === 0 ? 1 : 0
    const player = battle.players[playerIndex]
    const opponent = battle.players[opponentIndex]
    const opponentActive = opponent.team[opponent.activePokemonIndex]

    const sanitized = {
      turn: battle.turn,
      status: battle.status,
      battleLog: battle.battleLog,
      eventQueue: battle.eventQueue,
      winnerPlayerId: battle.winnerPlayerId,
      player: {
        playerId: player.playerId,
        name: player.name,
        activePokemonIndex: player.activePokemonIndex,
        team: player.team.map(p => ({
          pokemonId: p.pokemonId,
          name: p.name,
          types: p.types,
          sprite: p.sprite,
          shinySprite: p.shinySprite,
          isShiny: p.isShiny,
          moves: p.moves,
          currentHp: p.currentHp,
          maxHp: p.maxHp,
          stats: p.stats,
          status: p.status,
          fainted: p.fainted,
        })),
        actionsSubmitted: player.actionsSubmitted,
      },
      opponent: {
        playerId: opponent.playerId,
        name: opponent.name,
        activePokemonIndex: opponent.activePokemonIndex,
        activePokemon: opponentActive ? {
          pokemonId: opponentActive.pokemonId,
          name: opponentActive.name,
          sprite: opponentActive.sprite,
          types: opponentActive.types,
          moves: opponentActive.moves,
          currentHp: opponentActive.currentHp,
          maxHp: opponentActive.maxHp,
          stats: opponentActive.stats,
          status: opponentActive.status,
          fainted: opponentActive.fainted,
        } : null,
        teamSize: opponent.team.length,
      },
    }

    return c.json(sanitized)
  } catch (error) {
    return c.json({ error: 'Failed to get battle state' }, 500)
  }
})

battleRouter.post('/api/rooms/:code/actions', async (c) => {
  try {
    const db = getDb()
    const code = c.req.param('code').toUpperCase()
    const body = await c.req.json() as {
      playerId?: string
      playerToken?: string
      action?: BattleAction
      type?: string
      moveIndex?: number
      switchToIndex?: number
    }
    const fromQuery = { playerId: c.req.query('playerId'), playerToken: c.req.query('playerToken') }
    const fromHeader = { playerId: c.req.header('x-player-id'), playerToken: c.req.header('x-player-token') }
    const playerId = body.playerId || fromQuery.playerId || fromHeader.playerId || ''
    const playerToken = body.playerToken || fromQuery.playerToken || fromHeader.playerToken || ''
    const action: BattleAction = body.action || {
      type: (body.type as 'move' | 'switch') || 'move',
      moveIndex: body.moveIndex,
      switchToIndex: body.switchToIndex,
    }

    const battlesCollection = db.collection<Battle>('battles')
    const typesCollection = db.collection<any>('types')

    const battle = await battlesCollection.findOne({ roomCode: code })
    if (!battle) {
      return c.json({ error: 'Battle not found' }, 404)
    }

    const playerIndex = battle.players.findIndex(p => p.playerId === playerId)
    if (playerIndex === -1) {
      return c.json({ error: 'Not a member of this battle' }, 403)
    }

    if (battle.players[playerIndex].playerToken !== playerToken) {
      return c.json({ error: 'Invalid token' }, 403)
    }

    if (battle.status !== 'active') {
      return c.json({ error: 'Battle is not active' }, 400)
    }

    if (battle.players[playerIndex].actionsSubmitted) {
      return c.json({ error: 'Action already submitted this turn' }, 400)
    }

    const playerPoke = battle.players[playerIndex].team[battle.players[playerIndex].activePokemonIndex]
    if (playerPoke.fainted && action.type !== 'switch') {
      return c.json({ error: 'Active pokemon is fainted, must switch' }, 400)
    }

    if (action.type === 'move') {
      const moveIndex = action.moveIndex!
      if (moveIndex < 0 || moveIndex > 3) {
        return c.json({ error: 'Invalid move index (0-3)' }, 400)
      }
      if (!playerPoke.moves[moveIndex]) {
        return c.json({ error: 'Invalid move selection' }, 400)
      }
    }

    if (action.type === 'switch') {
      const switchIdx = action.switchToIndex!
      if (switchIdx < 0 || switchIdx >= battle.players[playerIndex].team.length) {
        return c.json({ error: 'Invalid switch target' }, 400)
      }
      if (battle.players[playerIndex].team[switchIdx].fainted) {
        return c.json({ error: 'Cannot switch to a fainted pokemon' }, 400)
      }
    }

    const actionField = `players.${playerIndex}.selectedAction` as const
    const submittedField = `players.${playerIndex}.actionsSubmitted` as const
    await battlesCollection.updateOne(
      { roomCode: code },
      {
        $set: {
          [actionField]: action,
          [submittedField]: true,
        },
      }
    )

    broadcastToRoom(code, { type: 'action-submitted', playerId })

    const updatedBattle = await battlesCollection.findOne({ roomCode: code })
    const bothSubmitted = updatedBattle!.players.every(p => p.actionsSubmitted)

    if (!bothSubmitted) {
      return c.json({ accepted: true })
    }

    const p0 = updatedBattle!.players[0]
    const p1 = updatedBattle!.players[1]

    const typeData = await typesCollection.find({}).toArray()

    const result = resolveTurn(
      updatedBattle!,
      typeData,
      [...p0.team],
      [...p1.team],
      p0.selectedAction!,
      p1.selectedAction!
    )

    const updatedPlayer0Team = result.updatedTeams[0]
    const updatedPlayer1Team = result.updatedTeams[1]

    let newP0ActiveIdx = p0.activePokemonIndex
    let newP1ActiveIdx = p1.activePokemonIndex

    for (const event of result.events) {
      if (event.type === 'switch') {
        if (event.playerId === p0.playerId) {
          const targetPokeId = parseInt(event.toPokemonId)
          newP0ActiveIdx = updatedPlayer0Team.findIndex(p => p.pokemonId === targetPokeId)
        } else {
          const targetPokeId = parseInt(event.toPokemonId)
          newP1ActiveIdx = updatedPlayer1Team.findIndex(p => p.pokemonId === targetPokeId)
        }
      }
    }

    if (result.winner) {
      await battlesCollection.updateOne(
        { roomCode: code },
        {
          $set: {
            status: 'finished',
            winnerPlayerId: result.winner,
            'players.0.team': updatedPlayer0Team,
            'players.1.team': updatedPlayer1Team,
            'players.0.activePokemonIndex': newP0ActiveIdx,
            'players.1.activePokemonIndex': newP1ActiveIdx,
            'players.0.selectedAction': null,
            'players.1.selectedAction': null,
            'players.0.actionsSubmitted': false,
            'players.1.actionsSubmitted': false,
            turn: updatedBattle!.turn + 1,
            eventQueue: result.events,
            battleLog: [
              ...updatedBattle!.battleLog,
              {
                turn: updatedBattle!.turn,
                message: `Battle ended! Winner: ${result.winner === p0.playerId ? p0.name : p1.name}`,
                timestamp: new Date(),
              },
            ],
          },
        }
      )

      broadcastToRoom(code, { type: 'battle-ended', winnerPlayerId: result.winner })
      broadcastToRoom(code, { type: 'turn-resolved', events: result.events })

      return c.json({ accepted: true, events: result.events })
    }

    await battlesCollection.updateOne(
      { roomCode: code },
      {
        $set: {
          'players.0.team': updatedPlayer0Team,
          'players.1.team': updatedPlayer1Team,
          'players.0.activePokemonIndex': newP0ActiveIdx,
          'players.1.activePokemonIndex': newP1ActiveIdx,
          'players.0.selectedAction': null,
          'players.1.selectedAction': null,
          'players.0.actionsSubmitted': false,
          'players.1.actionsSubmitted': false,
          turn: updatedBattle!.turn + 1,
          eventQueue: result.events,
          battleLog: [
            ...updatedBattle!.battleLog,
            {
              turn: updatedBattle!.turn,
              message: `Turn ${updatedBattle!.turn} resolved`,
              timestamp: new Date(),
            },
          ],
        },
      }
    )

    broadcastToRoom(code, { type: 'turn-resolved', events: result.events })

    return c.json({ accepted: true, events: result.events })
  } catch (error) {
    return c.json({ error: 'Failed to process action' }, 500)
  }
})

export { battleRouter }
