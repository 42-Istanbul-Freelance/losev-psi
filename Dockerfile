FROM node:20-slim AS base

# ── Deps stage ──────────────────────────────────────────────────────────────
FROM base AS deps
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ── Builder stage ────────────────────────────────────────────────────────────
FROM base AS builder
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Runner stage (production) ────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

# SQLite veritabanı için kalıcı dizin
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Custom server.js (Socket.io entegrasyonu için) — standalone server.js'i override eder
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js

# Tüm node_modules'u kopyala (standalone trace eksiklerini önlemek için)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# SQLite DB'yi /app/data altına yönlendir (volume ile persist edilir)
ENV DB_PATH=/app/data/dev.db

CMD ["node", "server.js"]
