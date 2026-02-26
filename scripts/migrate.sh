#!/bin/bash
# WAR ROOM Database Migration Script
# Usage: ./scripts/migrate.sh <DATABASE_URL>
# Example: ./scripts/migrate.sh "postgresql://postgres.lqxshsvfjtfxdbqtfbxa:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/migrate.sh <DATABASE_URL>"
  echo ""
  echo "Get your DATABASE_URL from Supabase Dashboard > Settings > Database > Connection string"
  echo "It looks like: postgresql://postgres.lqxshsvfjtfxdbqtfbxa:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"
  exit 1
fi

DATABASE_URL="$1"
MIGRATION_FILE="$(dirname "$0")/../supabase/migrations/001_initial_schema.sql"

echo "Running WAR ROOM migration..."
/usr/local/opt/libpq/bin/psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo "Migration completed successfully!"
else
  echo "Migration failed. Check the error above."
  exit 1
fi
