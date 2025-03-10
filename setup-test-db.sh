#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create .env.test file if it doesn't exist
if [ ! -f .env.test ]; then
  echo -e "${YELLOW}Creating .env.test file${NC}"
  echo "TEST_DATABASE_URL=postgres://postgres:Oe7jieg_@localhost:5432/deliberate_test" > .env.test
  echo "SKIP_ENV_VALIDATION=true" >> .env.test
fi

# Load test environment variables
echo -e "${BLUE}Loading environment variables from .env.test${NC}"
export $(grep -v '^#' .env.test | xargs)

# Extract database connection details
DB_URL=$TEST_DATABASE_URL
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
DB_PASSWORD=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')

echo -e "${YELLOW}Database connection details:${NC}"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Error: PostgreSQL client (psql) is not installed${NC}"
  exit 1
fi

# Set PGPASSWORD environment variable for passwordless psql commands
export PGPASSWORD=$DB_PASSWORD

# Check if we can connect to PostgreSQL
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c '\q' postgres 2>/dev/null; then
  echo -e "${RED}Error: Cannot connect to PostgreSQL server${NC}"
  echo "Please check your PostgreSQL credentials and make sure the server is running."
  echo "You may need to modify the TEST_DATABASE_URL in .env.test"
  exit 1
fi

# Check if the database exists
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo -e "${YELLOW}Database $DB_NAME already exists${NC}"
else
  echo -e "${GREEN}Creating database $DB_NAME${NC}"
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
fi

ENV=test pnpm run db:generate
ENV=test pnpm run db:migrate

# Fix the circular dependency issue by temporarily modifying the schema/index.ts file
echo -e "${BLUE}Fixing schema for migrations...${NC}"
SCHEMA_FILE="src/server/db/schema/index.ts"
SCHEMA_BACKUP="${SCHEMA_FILE}.bak"

# Backup the original file
cp $SCHEMA_FILE $SCHEMA_BACKUP

# Modify the schema file to remove the circular dependency
sed -i 's/export const db = drizzle(postgres(""), { schema });/\/\/ Temporarily commented out for migrations\n\/\/ export const db = drizzle(postgres(""), { schema });/' $SCHEMA_FILE

# Run database migrations with environment variables set
echo -e "${GREEN}Running database migrations${NC}"
SKIP_ENV_VALIDATION=true DATABASE_URL=$TEST_DATABASE_URL pnpm drizzle-kit push:pg

# Restore the original schema file
mv $SCHEMA_BACKUP $SCHEMA_FILE

echo -e "${GREEN}Test database setup complete!${NC}" 