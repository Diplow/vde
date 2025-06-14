#!/bin/bash

# Script to run migrations on production database
# Usage: DATABASE_URL="your-connection-string" ./scripts/migrate-production-template.sh

echo "🚀 Running database migrations on production..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please set it to your Neon database URL"
  echo "Example: DATABASE_URL='postgresql://...' ./scripts/migrate-production-template.sh"
  exit 1
fi

# Never hardcode credentials in this file!
# Always pass DATABASE_URL as an environment variable

# Run migrations using drizzle-kit
echo "📦 Running drizzle migrations..."
pnpm drizzle-kit migrate --config=./config/drizzle.config.ts

echo "✅ Migrations completed!"

# Optional: Run any post-migration scripts
# echo "🔧 Running post-migration tasks..."
# pnpm tsx scripts/post-migration.ts