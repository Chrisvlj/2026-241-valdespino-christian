export interface Pokemon {
  _id?: string;
  pokedexId: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  spriteUrls: {
    frontDefault: string;
    backDefault: string;
    frontShiny?: string;
    backShiny?: string;
  };
  speciesId: number;
  habitat: string;
  shape: string;
  evolutionStage: number;
  isLegendary: boolean;
  isMythical: boolean;
  hasShinySprite: boolean;
  moveIds: number[];
  eligible: boolean;
}

export interface Move {
  _id?: string;
  pokeapiId: number;
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  priority: number;
  damageClass: string;
  target: string;
  effect: string;
  ailment: string | null;
  ailmentChance: number;
  statChanges: StatChange[];
  statChance: number;
}

export interface StatChange {
  stat: string;
  change: number;
}

export interface TypeDamageRelations {
  _id?: string;
  name: string;
  damageRelations: {
    doubleDamageTo: string[];
    halfDamageTo: string[];
    noDamageTo: string[];
    doubleDamageFrom: string[];
    halfDamageFrom: string[];
    noDamageFrom: string[];
  };
  multipliers: Record<string, number>;
}

export interface RoomPlayer {
  playerId: string;
  playerToken: string;
  name: string;
  ready: boolean;
  team: BattlePokemon[];
  activePokemonIndex: number;
  actionsSubmitted: boolean;
  selectedAction: BattleAction | null;
}

export interface BattlePokemon {
  pokemonId: number;
  name: string;
  types: string[];
  sprite: string;
  shinySprite?: string;
  isShiny: boolean;
  moves: BattleMove[];
  currentHp: number;
  maxHp: number;
  stats: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  status: StatusEffect | null;
  fainted: boolean;
}

export interface BattleMove {
  moveId: number;
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  priority: number;
  damageClass: string;
  target?: string;
  effect?: string;
  pp: number;
  maxPp: number;
  ailment?: string | null;
  ailmentChance?: number;
  statChanges?: StatChange[];
  statChance?: number;
}

export interface StatusEffect {
  type: string;
  turnsRemaining: number;
}

export interface BattleAction {
  type: "move" | "switch";
  moveIndex?: number;
  switchToIndex?: number;
}

export interface Room {
  _id?: string;
  code: string;
  status: "waiting" | "banning" | "selecting" | "ready" | "battle" | "finished";
  players: RoomPlayer[];
  bans: number[];
  currentBanTurn: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Battle {
  _id?: string;
  roomCode: string;
  turn: number;
  status: "active" | "finished";
  players: RoomPlayer[];
  battleLog: BattleLogEntry[];
  eventQueue: BattleEvent[];
  winnerPlayerId: string | null;
}

export interface BattleLogEntry {
  turn: number;
  message: string;
  timestamp: Date;
}

export type BattleEvent =
  | { type: "move"; actorId: string; moveId: string; targetId: string; moveType: string; damageClass: string }
  | { type: "damage"; targetId: string; amount: number; hpAfter: number }
  | { type: "effectiveness"; targetId: string; multiplier: number }
  | { type: "statusApplied"; targetId: string; status: string; turns: number }
  | { type: "statusExpired"; targetId: string; status: string }
  | { type: "statusCleared"; targetId: string; status: string }
  | { type: "switch"; playerId: string; fromPokemonId: string; toPokemonId: string }
  | { type: "faint"; pokemonId: string; playerId: string }
  | { type: "win"; winnerPlayerId: string }
  | { type: "turnStart"; turn: number }
  | { type: "miss"; actorId: string; moveName: string }
  | { type: "critical"; targetId: string };

export type ShopItemCategory = "shiny" | "legendary" | "slot" | "attack" | "shiny_evo";

export interface ShopItem {
  _id?: string;
  itemId: string;
  category: ShopItemCategory;
  name: string;
  description: string;
  price: number;
  pokemonId?: number;
  moveId?: number;
  stock: number;
  icon: string;
}

export interface PlayerInventory {
  _id?: string;
  playerId: string;
  coins: number;
  ownedShinyPokemon: number[];
  ownedLegendarySlots: number;
  ownedExtraTeamSlots: number;
  ownedExtraAttacks: { pokemonId: number; moveIds: number[] }[];
  ownedShinyEvolutions: number[];
  purchasedItems: { itemId: string; purchasedAt: Date }[];
}

export interface PlayerWallet {
  playerId: string;
  coins: number;
}
