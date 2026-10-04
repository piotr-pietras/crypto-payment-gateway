#!/bin/sh
set -e

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-crypto_payment_gateway}"

export PGDATA
export DATABASE_URL="${DATABASE_URL:-postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}}"

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"

# Initialize PostgreSQL if the data directory is empty
# Listens only to localhost
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "Initializing PostgreSQL data directory..."
  su-exec postgres initdb -D "$PGDATA" --auth-local=trust --auth-host=md5

  {
    echo "listen_addresses = '127.0.0.1'"
    echo "port = 5432"
  } >> "$PGDATA/postgresql.conf"

  {
    echo "local all all trust"
    echo "host all all 127.0.0.1/32 md5"
    echo "host all all ::1/128 md5"
  } > "$PGDATA/pg_hba.conf"

  su-exec postgres pg_ctl -D "$PGDATA" -o "-c listen_addresses=127.0.0.1" -w start

  su-exec postgres psql -v ON_ERROR_STOP=1 <<EOF
ALTER USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';
SELECT 'CREATE DATABASE ${POSTGRES_DB}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}')\gexec
EOF

  su-exec postgres pg_ctl -D "$PGDATA" -m fast -w stop
  echo "PostgreSQL initialized."
fi

exec /usr/bin/supervisord -c /etc/supervisord.conf
