# Fly.io Container Deployment Guide

Fly.io is one of the fastest and simplest hosting platforms for this application because it natively supports **persistent storage volumes** directly attached to lightweight microVMs. This means your SQLite database (`dev.db`) and ingested leads persist permanently, even when the container pauses or restarts.

---

## 1. Prerequisites
- Install the Fly CLI:
  - macOS / Linux: `curl -L https://fly.io/install.sh | sh`
  - Windows (PowerShell): `pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"`
- A Fly.io account (`fly auth signup` or `fly auth login`)

---

## 2. Prepare Docker Configuration

Create a production `Dockerfile` in the project root:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies needed for native modules
RUN apt-get update && apt-get install -y openssl python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma Client & compile production bundle
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

# Create directory for persistent SQLite volume
RUN mkdir -p /data

# Point SQLite to the persistent volume mount point
ENV DATABASE_URL="file:/data/dev.db"

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/server.cjs"]
```

Add a `.dockerignore` file:
```
node_modules
dist
dev-dist
.git
prisma/*.db
prisma/*.db-journal
.env
```

---

## 3. Launch App and Create Persistent Volume

### Step 1: Initialize Fly App
Run inside your project directory:
```bash
fly launch --no-deploy
```
This generates a `fly.toml` configuration file.

### Step 2: Create a Persistent Storage Volume
Create a 1 GB persistent volume for SQLite (covered by Fly.io's free allowance):
```bash
fly volumes create sqlite_data --size 1 --region ord
```
*(You can change `ord` [Chicago] to your preferred region like `iad` [Virginia], `sjc` [San Jose], or `fra` [Frankfurt]).*

### Step 3: Mount Volume in `fly.toml`
Open `fly.toml` and ensure the `[mounts]` and `[http_service]` blocks match:

```toml
app = "your-app-name"
primary_region = "ord"

[build]

[mounts]
  source = "sqlite_data"
  destination = "/data"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

---

## 4. Deploy to Fly.io

Deploy the application:
```bash
fly deploy
```

Once deployment completes, open your live application:
```bash
fly open
```

---

## 5. Helpful Fly.io Management Commands

- **View Live Logs**: `fly logs`
- **SSH into Machine**: `fly ssh console`
- **Check Storage Volume Status**: `fly volumes list`
- **Download Database Backup locally**:
  ```bash
  fly sftp get /data/dev.db ./backup-dev.db
  ```
