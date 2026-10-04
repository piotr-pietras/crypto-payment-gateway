#!/bin/sh
set -e

POSTGRES_USER="${POSTGRES_USER:-postgres}"
export DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@127.0.0.1:5432/crypto_payment_gateway}"

echo "Waiting for PostgreSQL..."
until pg_isready -h 127.0.0.1 -U "$POSTGRES_USER" >/dev/null 2>&1; do
  sleep 0.5
done

cd /app/api
npx prisma migrate deploy
exec node dist/src/main
