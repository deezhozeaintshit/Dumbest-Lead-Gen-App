# syntax=docker/dockerfile:1
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl and build dependencies required by Prisma engine
RUN apt-get update && apt-get install -y openssl python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma Client & compile production frontend + server bundle
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install openssl in production runtime for Prisma SQLite engine
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create directory for persistent SQLite volume
RUN mkdir -p /data

# Point SQLite to persistent volume
ENV DATABASE_URL="file:/data/dev.db"

EXPOSE 3000

# Ensure database directory exists, sync schema, and launch server
CMD ["sh", "-c", "mkdir -p /data && npx prisma db push --skip-generate && node dist/server.cjs"]
