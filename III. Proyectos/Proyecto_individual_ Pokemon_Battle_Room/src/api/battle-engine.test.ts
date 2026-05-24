import { describe, expect, it } from 'vitest'
import { resolveTurn } from './battle-engine'
import type { Battle, BattleMove, BattlePokemon } from '../../types'

const tackle: BattleMove = {
  moveId: 1,
  name: 'tackle',
  type: 'normal',
  power: 40,
  accuracy: 100,
  priority: 0,
  damageClass: 'physical',
  pp: 35,
  maxPp: 35,
}

function pokemon({
  pokemonId,
  name,
  ...overrides
}: Partial<BattlePokemon> & Pick<BattlePokemon, 'pokemonId' | 'name'>): BattlePokemon {
  return {
    pokemonId,
    name,
    types: ['normal'],
    sprite: '',
    isShiny: false,
    moves: [tackle],
    currentHp: 100,
    maxHp: 100,
    stats: {
      attack: 50,
      defense: 50,
      specialAttack: 50,
      specialDefense: 50,
      speed: 50,
    },
    status: null,
    fainted: false,
    ...overrides,
  }
}

function battle(player1Team: BattlePokemon[], player2Team: BattlePokemon[]): Battle {
  return {
    roomCode: 'TEST01',
    turn: 2,
    status: 'active',
    players: [
      {
        playerId: 'player-1',
        playerToken: 'token-1',
        name: 'Player 1',
        ready: true,
        team: player1Team,
        activePokemonIndex: 0,
        actionsSubmitted: true,
        selectedAction: { type: 'switch', switchToIndex: 1 },
      },
      {
        playerId: 'player-2',
        playerToken: 'token-2',
        name: 'Player 2',
        ready: true,
        team: player2Team,
        activePokemonIndex: 0,
        actionsSubmitted: true,
        selectedAction: { type: 'move', moveIndex: 0 },
      },
    ],
    battleLog: [],
    eventQueue: [],
    winnerPlayerId: null,
  }
}

describe('resolveTurn', () => {
  it('allows a fainted active pokemon to switch to a healthy teammate', () => {
    const player1Team = [
      pokemon({ pokemonId: 1, name: 'bulbasaur', currentHp: 0, fainted: true }),
      pokemon({ pokemonId: 2, name: 'ivysaur' }),
    ]
    const player2Team = [pokemon({ pokemonId: 4, name: 'charmander' })]

    const result = resolveTurn(
      battle(player1Team, player2Team),
      [],
      player1Team,
      player2Team,
      { type: 'switch', switchToIndex: 1 },
      { type: 'move', moveIndex: 0 }
    )

    expect(result.events).toContainEqual({
      type: 'switch',
      playerId: 'player-1',
      fromPokemonId: '1',
      toPokemonId: '2',
    })
  })
})
