import { getDb } from "./db";
import { Pokemon, Move, TypeDamageRelations } from "../../types";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
  }
  return (await response.json()) as T;
}

// Import Pokemon from PokeAPI
export async function importPokemon(limit: number = 300): Promise<void> {
  const db = getDb();

  console.log(`Starting Pokemon import (limit: ${limit})...`);

  // Get list of Pokemon
  const pokemonList = await fetchJson<{ results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/pokemon?limit=${limit}&offset=0`
  );

  const eligiblePokemon: Pokemon[] = [];

  for (let i = 0; i < pokemonList.results.length; i++) {
    const pokemonName = pokemonList.results[i].name;
    console.log(`Processing ${i + 1}/${pokemonList.results.length}: ${pokemonName}`);

    try {
      const pokemonData = await fetchJson<any>(
        `${POKEAPI_BASE}/pokemon/${pokemonName}`
      );

      // Get species data
      const speciesData = await fetchJson<any>(
        `${POKEAPI_BASE}/pokemon-species/${pokemonData.id}`
      );

      // Check if Pokemon has at least 4 moves
      const moves = pokemonData.moves || [];
      if (moves.length < 4) {
        console.log(`  Skipping ${pokemonName}: only ${moves.length} moves available`);
        continue;
      }

      // Get move IDs
      const moveIds = moves.slice(0, 20).map((move: any) => {
        const urlParts = move.move.url.split("/");
        return parseInt(urlParts[urlParts.length - 2]);
      });

      // Extract stats
      const stats: Record<string, number> = {};
      pokemonData.stats.forEach((stat: any) => {
        stats[stat.stat.name] = stat.base_stat;
      });

      // Check for shiny sprites
      const hasShinySprite = !!pokemonData.sprites.front_shiny;

      const pokemon: Pokemon = {
        pokedexId: pokemonData.id,
        name: pokemonData.name,
        types: pokemonData.types.map((t: any) => t.type.name),
        height: pokemonData.height,
        weight: pokemonData.weight,
        baseStats: {
          hp: stats["hp"] || 50,
          attack: stats["attack"] || 50,
          defense: stats["defense"] || 50,
          specialAttack: stats["special-attack"] || 50,
          specialDefense: stats["special-defense"] || 50,
          speed: stats["speed"] || 50,
        },
        spriteUrls: {
          frontDefault: pokemonData.sprites.front_default || "",
          backDefault: pokemonData.sprites.back_default || "",
          frontShiny: pokemonData.sprites.front_shiny || undefined,
          backShiny: pokemonData.sprites.back_shiny || undefined,
        },
        speciesId: pokemonData.id,
        habitat: speciesData.habitat?.name || "unknown",
        shape: speciesData.shape?.name || "unknown",
        evolutionStage: getEvolutionStage(speciesData.evolves_from_species),
        isLegendary: speciesData.is_legendary || false,
        isMythical: speciesData.is_mythical || false,
        hasShinySprite,
        moveIds,
        eligible: true,
      };

      eligiblePokemon.push(pokemon);
      console.log(`  ✓ Imported ${pokemonName}`);
    } catch (error) {
      console.error(`  ✗ Failed to import ${pokemonName}:`, error);
    }

    // Rate limiting - be nice to the API
    if (i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Upsert into MongoDB
  if (eligiblePokemon.length > 0) {
    const collection = db.collection<Pokemon>("pokemon");
    for (const pokemon of eligiblePokemon) {
      await collection.updateOne(
        { pokedexId: pokemon.pokedexId },
        { $set: pokemon },
        { upsert: true }
      );
    }
    console.log(`✓ Successfully imported ${eligiblePokemon.length} Pokemon`);
  }
}

// Import moves from PokeAPI
export async function importMoves(): Promise<void> {
  const db = getDb();
  console.log("Starting moves import...");

  // Get list of moves (first 800 should be enough)
  const movesList = await fetchJson<{ results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/move?limit=800&offset=0`
  );

  const moves: Move[] = [];

  for (let i = 0; i < movesList.results.length; i++) {
    const moveName = movesList.results[i].name;
    if (i % 50 === 0) {
      console.log(`Processing moves ${i + 1}/${movesList.results.length}`);
    }

    try {
      const moveData = await fetchJson<any>(movesList.results[i].url)
      const urlParts = movesList.results[i].url.split("/");
      const moveId = parseInt(urlParts[urlParts.length - 2]);

      const move: Move = {
        pokeapiId: moveId,
        name: moveData.name,
        type: moveData.type?.name || "normal",
        power: moveData.power,
        accuracy: moveData.accuracy,
        priority: moveData.priority || 0,
        damageClass: moveData.damage_class?.name || "physical",
        target: moveData.target?.name || "normal",
        effect: moveData.effect_entries?.find((e: any) => e.language.name === "en")?.effect || "",
        ailment: moveData.meta?.ailment?.name || null,
        ailmentChance: moveData.meta?.ailment_chance || 0,
        statChanges: (moveData.stat_changes || []).map((sc: any) => ({
          stat: sc.stat.name,
          change: sc.change,
        })),
        statChance: moveData.meta?.stat_chance || 0,
      };

      moves.push(move);
    } catch (error) {
      console.error(`Failed to import move ${moveName}:`, error);
    }
  }

  if (moves.length > 0) {
    const collection = db.collection<Move>("moves");
    for (const move of moves) {
      await collection.updateOne(
        { pokeapiId: move.pokeapiId },
        { $set: move },
        { upsert: true }
      );
    }
    console.log(`✓ Successfully imported ${moves.length} moves`);
  }
}

// Import type damage relations
export async function importTypes(): Promise<void> {
  const db = getDb();
  console.log("Starting types import...");

  const typesList = await fetchJson<{ results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/type?limit=30&offset=0`
  );

  const types: TypeDamageRelations[] = [];

  for (const typeResult of typesList.results) {
    try {
      const typeData = await fetchJson<any>(typeResult.url);

      const typeRelations: TypeDamageRelations = {
        name: typeData.name,
        damageRelations: {
          doubleDamageTo: typeData.damage_relations.double_damage_to.map((t: any) => t.name),
          halfDamageTo: typeData.damage_relations.half_damage_to.map((t: any) => t.name),
          noDamageTo: typeData.damage_relations.no_damage_to.map((t: any) => t.name),
          doubleDamageFrom: typeData.damage_relations.double_damage_from.map((t: any) => t.name),
          halfDamageFrom: typeData.damage_relations.half_damage_from.map((t: any) => t.name),
          noDamageFrom: typeData.damage_relations.no_damage_from.map((t: any) => t.name),
        },
        multipliers: {},
      };

      // Calculate multipliers
      const multipliers: Record<string, number> = {};

      // Double damage = 2x
      for (const targetType of typeRelations.damageRelations.doubleDamageTo) {
        multipliers[targetType] = 2;
      }

      // Half damage = 0.5x
      for (const targetType of typeRelations.damageRelations.halfDamageTo) {
        multipliers[targetType] = 0.5;
      }

      // No damage = 0x
      for (const targetType of typeRelations.damageRelations.noDamageTo) {
        multipliers[targetType] = 0;
      }

      typeRelations.multipliers = multipliers;
      types.push(typeRelations);
    } catch (error) {
      console.error(`Failed to import type ${typeResult.name}:`, error);
    }
  }

  if (types.length > 0) {
    const collection = db.collection<TypeDamageRelations>("types");
    for (const type of types) {
      await collection.updateOne(
        { name: type.name },
        { $set: type },
        { upsert: true }
      );
    }
    console.log(`✓ Successfully imported ${types.length} types`);
  }
}

function getEvolutionStage(evolvesFrom: any): number {
  if (!evolvesFrom) return 0;
  return 1; // Simplified - in a real app you'd traverse the evolution chain
}

// Main import function
export async function runFullImport(): Promise<void> {
  console.log("🚀 Starting full PokeAPI import...");

  try {
    await importTypes();
    await importMoves();
    await importPokemon(300);

    console.log("✅ Import completed successfully!");
  } catch (error) {
    console.error("❌ Import failed:", error);
    throw error;
  }
}
