#!/bin/sh
set -eu

cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

if [ ! -f .env ]; then
  echo "Missing .env. Copy .env.production.example to .env and fill every production value." >&2
  exit 1
fi

if ! command -v corepack >/dev/null 2>&1; then
  echo "Node.js 22 with Corepack is required to apply Supabase Cloud migrations." >&2
  exit 1
fi

echo "Installing the pinned deployment tooling..."
corepack pnpm install --frozen-lockfile

echo "Linking and synchronizing Supabase Cloud..."
corepack pnpm db:configure

echo "Validating production environment..."
docker run --rm \
  --env-file .env \
  --mount "type=bind,src=$PWD,dst=/app,readonly" \
  --workdir /app \
  node:22-alpine \
  node scripts/verify-production-config.mjs

echo "Validating Compose configuration..."
docker compose -f docker-compose.prod.yml config --quiet

echo "Building application images..."
docker compose -f docker-compose.prod.yml build --pull

echo "Starting application containers..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker compose -f docker-compose.prod.yml ps

echo "Deployment started with Supabase Cloud current. Wait for both containers to report healthy before reloading Caddy."
