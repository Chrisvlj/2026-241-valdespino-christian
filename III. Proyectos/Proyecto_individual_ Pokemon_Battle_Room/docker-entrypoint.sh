#!/bin/sh
set -e

echo "Waiting for MongoDB..."
until bun -e "
  const { MongoClient } = require('mongodb');
  new MongoClient(process.env.MONGODB_URI || 'mongodb://mongo:27017/pokemon-battle-rooms')
    .connect()
    .then(client => { client.close(); process.exit(0); })
    .catch(() => process.exit(1));
" 2>/dev/null; do
  sleep 2
done
echo "MongoDB is ready"

echo "Checking if Pokemon data needs to be imported..."
bun -e "
  const { MongoClient } = require('mongodb');
  const uri = process.env.MONGODB_URI || 'mongodb://mongo:27017/pokemon-battle-rooms';
  async function check() {
    const client = await new MongoClient(uri).connect();
    const count = await client.db().collection('pokemon').countDocuments();
    await client.close();
    process.exit(count > 0 ? 0 : 1);
  }
  check().catch(() => process.exit(1));
" && echo "Pokemon data already exists, skipping import" || {
  echo "Running Pokemon data import from PokeAPI..."
  bun run scripts/import-pokemon.ts
}

echo "Starting server..."
exec bun run src/index.ts
