import { RoomPlayer, BattleMove, StatusEffect, BattleEvent, BattleAction, Battle, BattlePokemon, Pokemon, Move, TypeDamageRelations } from "../../types";

// Constants
const LEVEL = 50;

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Calculate type multiplier
function getTypeMultiplier(
  moveType: string,
  defenderTypes: string[],
  typeRelations: Map<string, Map<string, number>>
): number {
  let multiplier = 1;

  for (const defenderType of defenderTypes) {
    const relations = typeRelations.get(moveType);
    if (relations) {
      const relation = relations.get(defenderType);
      if (relation !== undefined) {
        multiplier *= relation;
      }
    }
  }

  return multiplier;
}

// Calculate damage
export function calculateDamage(
  attacker: RoomPlayer["team"][0],
  defender: RoomPlayer["team"][0],
  move: BattleMove,
  typeRelations: Map<string, Map<string, number>>
): {
  damage: number;
  isCritical: boolean;
  effectiveness: number;
  hits: boolean;
} {
  // Check accuracy
  const accuracy = move.accuracy ?? 100;
  const hitRoll = randomInt(1, 100);
  if (hitRoll > accuracy) {
    return { damage: 0, isCritical: false, effectiveness: 1, hits: false };
  }

  // Status move => no damage
  if (move.damageClass === "status") {
    return { damage: 0, isCritical: false, effectiveness: 1, hits: true };
  }

  // Select stats based on damage class
  let attackStat: number;
  let defenseStat: number;

  if (move.damageClass === "special") {
    attackStat = attacker.stats.specialAttack;
    defenseStat = defender.stats.specialDefense;
  } else {
    // physical
    attackStat = attacker.stats.attack;
    defenseStat = defender.stats.defense;
  }

  // Base damage formula
  const baseDamage =
    Math.floor(
      Math.floor(
        (Math.floor((2 * LEVEL) / 5 + 2) * (move.power || 0) * attackStat) /
          defenseStat
      ) / 50
    ) + 2;

  // Modifiers
  const randomFactor = randomInt(85, 100) / 100;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const typeMultiplier = getTypeMultiplier(move.type, defender.types, typeRelations);

  // Critical hit (1/24 chance)
  const isCritical = Math.random() < 1 / 24;
  const critical = isCritical ? 1.5 : 1;

  // Burn modifier
  const burnModifier =
    attacker.status?.type === "burn" && move.damageClass === "physical" ? 0.5 : 1;

  const fieldModifier = 1;

  const modifier =
    randomFactor * stab * typeMultiplier * critical * burnModifier * fieldModifier;
  const finalDamage = Math.floor(baseDamage * modifier);

  return {
    damage: typeMultiplier === 0 ? 0 : finalDamage,
    isCritical,
    effectiveness: typeMultiplier,
    hits: true,
  };
}

// Process status effects at end of turn
export function processStatusEffects(
  pokemon: RoomPlayer["team"][0]
): { damage: number; events: BattleEvent[] } {
  const events: BattleEvent[] = [];
  let damage = 0;

  if (!pokemon.status) return { damage: 0, events };

  switch (pokemon.status.type) {
    case "burn":
    case "poison":
      damage = Math.floor(pokemon.maxHp / 8);
      break;
    case "paralysis":
      // Paralysis handled in speed calculation
      break;
  }

  // Decrement turn counter
  pokemon.status.turnsRemaining--;

  if (pokemon.status.turnsRemaining <= 0) {
    events.push({
      type: "statusExpired",
      targetId: pokemon.pokemonId.toString(),
      status: pokemon.status.type,
    });
    pokemon.status = null;
  }

  return { damage, events };
}

// Apply status effect
export function applyStatusEffect(
  pokemon: RoomPlayer["team"][0],
  statusType: string
): BattleEvent | null {
  if (pokemon.status) return null;

  const status: StatusEffect = {
    type: statusType,
    turnsRemaining: 3,
  };

  pokemon.status = status;

  return {
    type: "statusApplied",
    targetId: pokemon.pokemonId.toString(),
    status: statusType,
    turns: 3,
  };
}

// Determine action order
export function determineActionOrder(
  actions: { playerId: string; action: BattleAction; speed: number }[]
): string[] {
  return actions
    .map((a) => ({
      playerId: a.playerId,
      priority: a.action.type === "switch" ? 6 : a.action.moveIndex !== undefined ? 0 : 0,
      speed: a.speed,
    }))
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      if (a.speed !== b.speed) {
        return b.speed - a.speed;
      }
      // Random tiebreaker
      return Math.random() - 0.5;
    })
    .map((a) => a.playerId);
}

// Build type relations map from TypeDamageRelations array
function buildTypeRelationsMap(typeData: TypeDamageRelations[]): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>()
  for (const type of typeData) {
    const innerMap = new Map<string, number>()
    for (const [targetType, mult] of Object.entries(type.multipliers)) {
      innerMap.set(targetType, mult)
    }
    map.set(type.name, innerMap)
  }
  return map
}

export function resolveTurn(
  battle: Battle,
  typeData: TypeDamageRelations[],
  player1Team: BattlePokemon[],
  player2Team: BattlePokemon[],
  player1Action: BattleAction,
  player2Action: BattleAction
): { events: BattleEvent[]; updatedTeams: [BattlePokemon[], BattlePokemon[]]; winner: string | null } {
  const events: BattleEvent[] = []
  const typeRelations = buildTypeRelationsMap(typeData)

  const player1Id = battle.players[0].playerId
  const player2Id = battle.players[1].playerId
  let p1ActiveIdx = battle.players[0].activePokemonIndex
  let p2ActiveIdx = battle.players[1].activePokemonIndex

  const actionData = [
    {
      playerId: player1Id,
      action: player1Action,
      speed: player1Team[p1ActiveIdx].fainted ? 0 : player1Team[p1ActiveIdx].stats.speed,
    },
    {
      playerId: player2Id,
      action: player2Action,
      speed: player2Team[p2ActiveIdx].fainted ? 0 : player2Team[p2ActiveIdx].stats.speed,
    },
  ]

  for (const data of actionData) {
    const team = data.playerId === player1Id ? player1Team : player2Team
    const idx = data.playerId === player1Id ? p1ActiveIdx : p2ActiveIdx
    if (!team[idx].fainted && team[idx].status?.type === 'paralysis') {
      data.speed = Math.floor(data.speed / 2)
    }
  }

  const order = determineActionOrder(actionData)

  for (const playerId of order) {
    const isPlayer1 = playerId === player1Id
    const team = isPlayer1 ? player1Team : player2Team
    const opponentTeam = isPlayer1 ? player2Team : player1Team
    const activeIdx = isPlayer1 ? p1ActiveIdx : p2ActiveIdx
    const opponentActiveIdx = isPlayer1 ? p2ActiveIdx : p1ActiveIdx
    const action = isPlayer1 ? player1Action : player2Action
    const activePoke = team[activeIdx]
    const opponentPoke = opponentTeam[opponentActiveIdx]

    if (action.type === 'switch') {
      const newIdx = action.switchToIndex!
      const newPoke = team[newIdx]
      newPoke.status = null

      events.push({
        type: 'switch',
        playerId,
        fromPokemonId: activePoke.pokemonId.toString(),
        toPokemonId: newPoke.pokemonId.toString(),
      })

      if (isPlayer1) p1ActiveIdx = newIdx
      else p2ActiveIdx = newIdx
    } else if (action.type === 'move') {
      if (activePoke.fainted) continue

      const moveIndex = action.moveIndex!
      const move = activePoke.moves[moveIndex]

      if (opponentPoke.fainted) continue

    events.push({
      type: 'move',
      actorId: activePoke.pokemonId.toString(),
      moveId: move.name,
      targetId: opponentPoke.pokemonId.toString(),
      moveType: move.type,
      damageClass: move.damageClass,
    })

      const result = calculateDamage(activePoke, opponentPoke, move, typeRelations)

      if (!result.hits) {
        events.push({
          type: 'miss',
          actorId: activePoke.pokemonId.toString(),
          moveName: move.name,
        })
        continue
      }

      events.push({
        type: 'effectiveness',
        targetId: opponentPoke.pokemonId.toString(),
        multiplier: result.effectiveness,
      })

      if (result.isCritical) {
        events.push({
          type: 'critical',
          targetId: opponentPoke.pokemonId.toString(),
        })
      }

      if (result.damage > 0) {
        opponentPoke.currentHp = Math.max(0, opponentPoke.currentHp - result.damage)
        events.push({
          type: 'damage',
          targetId: opponentPoke.pokemonId.toString(),
          amount: result.damage,
          hpAfter: opponentPoke.currentHp,
        })
      }

      if (move.ailment && move.ailment !== 'none') {
        const ailmentChance = move.ailmentChance ?? 0
        if (Math.random() * 100 < ailmentChance) {
          const statusEvent = applyStatusEffect(opponentPoke, move.ailment)
          if (statusEvent) {
            events.push(statusEvent)
          }
        }
      }

      if (opponentPoke.currentHp <= 0) {
        opponentPoke.fainted = true
        opponentPoke.currentHp = 0
        events.push({
          type: 'faint',
          pokemonId: opponentPoke.pokemonId.toString(),
          playerId: isPlayer1 ? player2Id : player1Id,
        })
      }
    }
  }

  for (const poke of player1Team) {
    if (!poke.fainted && poke.status) {
      const result = processStatusEffects(poke)
      if (result.damage > 0) {
        poke.currentHp = Math.max(0, poke.currentHp - result.damage)
        events.push({
          type: 'damage',
          targetId: poke.pokemonId.toString(),
          amount: result.damage,
          hpAfter: poke.currentHp,
        })
      }
      events.push(...result.events)
      if (poke.currentHp <= 0) {
        poke.fainted = true
        poke.currentHp = 0
        events.push({
          type: 'faint',
          pokemonId: poke.pokemonId.toString(),
          playerId: player1Id,
        })
      }
    }
  }

  for (const poke of player2Team) {
    if (!poke.fainted && poke.status) {
      const result = processStatusEffects(poke)
      if (result.damage > 0) {
        poke.currentHp = Math.max(0, poke.currentHp - result.damage)
        events.push({
          type: 'damage',
          targetId: poke.pokemonId.toString(),
          amount: result.damage,
          hpAfter: poke.currentHp,
        })
      }
      events.push(...result.events)
      if (poke.currentHp <= 0) {
        poke.fainted = true
        poke.currentHp = 0
        events.push({
          type: 'faint',
          pokemonId: poke.pokemonId.toString(),
          playerId: player2Id,
        })
      }
    }
  }

  let winner: string | null = null
  if (player1Team.every(p => p.fainted)) {
    winner = player2Id
  } else if (player2Team.every(p => p.fainted)) {
    winner = player1Id
  }

  if (winner) {
    events.push({ type: 'win', winnerPlayerId: winner })
  }

  return { events, updatedTeams: [player1Team, player2Team], winner }
}

export function assignMovesToPokemon(pokemonData: Pokemon, allMoves: Move[]): BattleMove[] {
  const shuffled = [...pokemonData.moveIds].sort(() => Math.random() - 0.5)
  const selectedIds = shuffled.slice(0, 4)

  return selectedIds.map(id => {
    const move = allMoves.find(m => m.pokeapiId === id)
    if (!move) {
      return {
        moveId: id,
        name: 'unknown',
        type: 'normal',
        power: null,
        accuracy: null,
      priority: 0,
      damageClass: 'physical',
      target: 'selected-pokemon',
      effect: '',
      pp: 5,
      maxPp: 5,
    } as BattleMove
    }
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
}
