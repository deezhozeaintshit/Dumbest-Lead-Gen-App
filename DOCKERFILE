FROM node:20-slim AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y openssl python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Mount point for the persistent Fly.io volume
RUN mkdir -p /data
ENV DATABASE_URL="file:/data/dev.db"

EXPOSE 3000

# Push DB migrations on startup and launch the bundled server
CMD ["sh", "-c", "npx prisma db push && node dist/server.cjs"]
