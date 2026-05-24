# Pokemon Battle Rooms

Battle terminal 1v1. Two players, one room code.

## Stack

- **Frontend:** Vite + React 18 + TanStack Router
- **Backend:** Hono (REST API)
- **Database:** MongoDB
- **Runtime:** Bun
- **Infrastructure:** Docker Compose

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for MongoDB)

### 1. Start MongoDB

```bash
docker run -d -p 27017:27017 --name pokemon-mongo mongo:7
```

### 2. Install dependencies

```bash
bun install
```

### 3. Import Pokemon data from PokeAPI

```bash
bun run import:pokemon
```

This imports:
- 300+ Pokemon with stats, types, sprites
- Moves with power, accuracy, effects
- Type damage relations (2x, 0.5x, 0x)

### 4. Start development

```bash
bun run dev
```

Starts:
- Vite dev server at `http://localhost:3000`
- Hono API server at `http://localhost:3001`

### 5. Open the app

```
http://localhost:3000
```

## Docker Compose (Production)

```bash
docker compose up --build
```

Single command: builds the app + MongoDB, starts at `http://localhost:3000`.

## Battle Rules

### Bans
- Each player bans 3 Pokemon, alternating turns (6 total bans)
- Banned Pokemon cannot be selected

### Team Selection
- Each player selects 1–6 Pokemon from the available pool
- Each Pokemon receives exactly 4 random valid moves from its PokeAPI move pool
- Pokemon with fewer than 4 moves are excluded from the pool

### Turn Resolution
1. **Priority:** Switch (6) > move priority (see move data)
2. **Speed:** Higher speed acts first; paralysis halves speed
3. **Tiebreaker:** Random coin flip

### Damage Formula

```
baseDamage = floor(floor(floor(2 * 50 / 5 + 2) * power * atk / def) / 50) + 2
modifier  = randomFactor * STAB * typeMultiplier * critical * burnModifier
finalDamage = floor(baseDamage * modifier)
```

- **Level:** Fixed at 50
- **Random factor:** 85–100%
- **STAB:** 1.5x if move type matches Pokemon type
- **Type multiplier:** From PokeAPI relationships (2x, 0.5x, 0x)
- **Critical:** 1.5x (1/24 chance)
- **Burn:** 0.5x for physical moves

### Status Effects (V1)

| Status | Effect | Duration |
|--------|--------|----------|
| Burn | 1/8 max HP per turn, halved physical attack | 3 turns |
| Poison | 1/8 max HP per turn | 3 turns |
| Paralysis | Speed halved | 3 turns |

Status is removed when switching Pokemon.

### Win Condition
All opponent Pokemon fainted = victory.

## Sprites

Sprites are loaded directly from PokeAPI (`https://raw.githubusercontent.com/PokeAPI/sprites/master/...`). Background images are in `public/backgrounds/`.

## Known Limitations (V1)

- No user authentication (Clerk planned post-demo)
- No cosmetic shop (Stripe planned post-demo)
- No persistent user history
- WebSocket real-time planned but not implemented (uses polling)
- Pokemon sprite positions are simplified (no per-species platform offsets)

## Roadmap (Post-Demo)

- [ ] Clerk authentication: user accounts, match history, protected routes
- [ ] Stripe checkout: cosmetic store (skins, backgrounds, frames)
- [ ] WebSocket real-time events
- [ ] Expanded animation system (type-specific projectiles)
- [ ] Team presets and saved lineups

## Demo Script

1. Open two browser windows (or incognito + normal)
2. Browser 1: Enter name → **CREATE ROOM**
3. Copy the 6-character room code
4. Browser 2: Enter name + paste code → **JOIN ROOM**
5. Both players ban 3 Pokemon each (alternating)
6. Both players select teams (1–6 Pokemon)
7. **CONFIRM TEAM** → Battle starts automatically
8. On each turn: select a move or switch Pokemon
9. Watch battle log and animations resolve the turn
10. Repeat until a winner is declared
