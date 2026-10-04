# ---- API ----
FROM node:20-alpine AS api-builder
WORKDIR /app

COPY ./api/package*.json ./
RUN npm ci

COPY ./api .
RUN npx prisma generate
RUN npm run build

# ---- Web ----
FROM node:20-alpine AS web-builder
WORKDIR /app

COPY ./web/package*.json ./
RUN npm ci

COPY ./web .
RUN npm run build

# ---- Runtime: postgres + nginx + api + web ----
FROM node:20-alpine AS runner

RUN apk add --no-cache \
      postgresql \
      postgresql-contrib \
      nginx \
      supervisor \
      su-exec \
  && mkdir -p /run/nginx /run/postgresql /var/lib/postgresql/data \
  && chown -R postgres:postgres /var/lib/postgresql /run/postgresql

WORKDIR /app

COPY --from=api-builder /app/node_modules ./api/node_modules
COPY --from=api-builder /app/package*.json ./api/
COPY --from=api-builder /app/dist ./api/dist
COPY --from=api-builder /app/prisma ./api/prisma
COPY --from=api-builder /app/prisma.config.ts ./api/

COPY --from=web-builder /app/node_modules ./web/node_modules
COPY --from=web-builder /app/package*.json ./web/
COPY --from=web-builder /app/.next ./web/.next
COPY --from=web-builder /app/public ./web/public
COPY --from=web-builder /app/next.config.ts ./web/

COPY ./nginx/nginx.app.conf /etc/nginx/nginx.conf
COPY ./docker/supervisord.conf /etc/supervisord.conf
COPY ./docker/entrypoint.app.sh /entrypoint.sh
COPY ./docker/start-api.sh /start-api.sh
RUN chmod +x /entrypoint.sh /start-api.sh

ENV PGDATA=/var/lib/postgresql/data \
    POSTGRES_USER=postgres \
    POSTGRES_PASSWORD=postgres \
    POSTGRES_DB=crypto_payment_gateway \
    DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/crypto_payment_gateway \
    ENV=sepolia \
    INIT_TX_SYNC_BLOCK_BATCH_SIZE=250 \
    INIT_BACKWARD_TX_SYNC_BLOCK_QUANTITY=0 \
    ETH_BLOCK_INTERVAL=13000 \
    PAYMENT_EXPIRATION_TIME_MINUTES=60

    
VOLUME ["/var/lib/postgresql/data"]

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
