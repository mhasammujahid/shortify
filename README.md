# shortify — URL Shortener

A production-ready URL shortener built with **Next.js 14**, **Prisma ORM**, **Neon (serverless PostgreSQL)**, **Tailwind CSS**, and fully containerized with **Docker**.

```
Long URL → shortify → /r/abc1234 → redirect
```

---

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Frontend  | Next.js 14 (App Router, TypeScript) |
| Styling   | Tailwind CSS v3                     |
| Backend   | Next.js API Routes                  |
| ORM       | Prisma v5                           |
| Database  | Neon (serverless PostgreSQL)        |
| Container | Docker + Docker Compose             |

---

## Architecture

```
┌─────────────────────────────────┐
│         Docker Container        │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Next.js App          │  │
│  │                           │  │
│  │  GET  /              UI   │  │
│  │  POST /api/shorten   →    │──┼──► Neon PostgreSQL
│  │  GET  /api/shorten   →    │──┼──► (external, SSL)
│  │  GET  /r/[slug]      →    │  │
│  │  GET  /api/health    →    │  │
│  └───────────────────────────┘  │
│                                 │
│  Port 3000                      │
└─────────────────────────────────┘
```

- **No local database container** — Neon is the managed PostgreSQL
- **Multi-stage Dockerfile** keeps the final image small (alpine base)
- **Prisma migrations** run automatically on container startup

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2
- A [Neon](https://neon.tech) account (free tier works great)
- Node.js 18+ (for local dev without Docker)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-user/url-shortener.git
cd url-shortener
```

### 2. Create your Neon database

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy the **Connection string** (it looks like):
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run with Docker

```bash
docker-compose up --build
```

The app will:

1. Build the multi-stage Docker image
2. Run `prisma migrate deploy` to apply migrations to Neon
3. Start the Next.js server on port 3000

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## Development (Hot Reload)

The `docker-compose.override.yml` is automatically applied in development. It mounts source code as a volume and runs `next dev` instead of `next start`.

```bash
# Development mode (hot reload enabled)
docker-compose up --build

# Production mode (ignoring override)
docker-compose -f docker-compose.yml up --build
```

### Local dev without Docker

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

---

## API Reference

### `POST /api/shorten`

Shorten a URL.

**Request:**

```json
{
  "url": "https://example.com/very/long/path",
  "customSlug": "my-link" // optional
}
```

**Response `201`:**

```json
{
  "id": "clxxx",
  "slug": "my-link",
  "url": "https://example.com/very/long/path",
  "shortUrl": "http://localhost:3000/r/my-link",
  "clicks": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**

- `400` — Missing or invalid URL
- `409` — Slug already taken
- `500` — Server error

---

### `GET /api/shorten`

List the 20 most recently created links.

**Response `200`:**

```json
[
  {
    "id": "...",
    "slug": "abc1234",
    "url": "https://example.com",
    "clicks": 42,
    "createdAt": "..."
  }
]
```

---

### `GET /r/:slug`

Redirect to the original URL. Increments click counter.

- `302` → redirects to original URL
- Redirects to `/?error=not_found` if slug doesn't exist

---

### `GET /api/health`

Health check — verifies DB connectivity.

**Response `200`:**

```json
{ "status": "ok", "db": "connected", "timestamp": "..." }
```

**Response `503`:**

```json
{ "status": "error", "db": "disconnected", "error": "..." }
```

---

## Project Structure

```
url-shortener/
├── app/
│   ├── api/
│   │   ├── health/route.ts      # Health check endpoint
│   │   ├── r/[slug]/route.ts    # Redirect handler
│   │   └── shorten/route.ts     # Create + list links
│   ├── lib/
│   │   └── prisma.ts            # Prisma client singleton
│   ├── globals.css              # Tailwind directives + CSS vars
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main UI
├── prisma/
│   ├── migrations/              # SQL migration files (committed)
│   └── schema.prisma            # Prisma schema
├── Dockerfile                   # Multi-stage production image
├── docker-compose.yml           # Production compose
├── docker-compose.override.yml  # Dev mode (hot reload)
├── .dockerignore
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── server.js                    # Custom server (runs migrations)
└── tsconfig.json
```

---

## Docker Details

### Multi-stage build

| Stage     | Purpose                                     |
| --------- | ------------------------------------------- |
| `deps`    | `npm ci` — install all dependencies         |
| `builder` | `prisma generate` + `next build`            |
| `runner`  | Minimal alpine image with standalone output |

The final image uses `next output: standalone` which bundles only what's needed — no `node_modules` bloat.

### Startup sequence

```
Container starts
      │
      ▼
npx prisma migrate deploy   ← applies pending migrations to Neon
      │
      ▼
node server.js              ← starts Next.js on :3000
```

---

## Environment Variables

| Variable                  | Required | Description                             |
| ------------------------- | -------- | --------------------------------------- |
| `DATABASE_URL`            | ✅       | Neon PostgreSQL connection string (SSL) |
| `NEXT_PUBLIC_BASE_URL`    | ✗        | Public URL for generating short links   |
| `NODE_ENV`                | ✗        | `production` or `development`           |
| `NEXT_TELEMETRY_DISABLED` | ✗        | Set to `1` to disable Next.js telemetry |

---

## Deployment

### Deploy to any VPS / cloud VM

```bash
# On your server
git clone https://github.com/your-user/url-shortener.git
cd url-shortener
cp .env.example .env
# Edit .env with your Neon DATABASE_URL and your domain

# Run production (no override)
docker-compose -f docker-compose.yml up -d --build
```

### Update base URL for production

```env
NEXT_PUBLIC_BASE_URL=https://shortify.yourdomain.com
```

---

## Security Notes

- `.env` is in `.gitignore` — **never commit it**
- Neon requires `sslmode=require` — already in the connection string
- Docker image runs as a **non-root user** (`nextjs:nodejs`)
- Multi-stage build ensures no dev dependencies or source code in final image
- No secrets are hardcoded anywhere

---

## Troubleshooting

**`DATABASE_URL` not set error**
→ Make sure `.env` exists and is in the project root (same dir as `docker-compose.yml`)

**Migrations fail on startup**
→ Verify your Neon database is active and the connection string includes `?sslmode=require`

**Port 3000 already in use**
→ Change the host port: `ports: - '3001:3000'` in `docker-compose.yml`

**Hot reload not working**
→ Try setting `WATCHPACK_POLLING=true` (already set in override) or restart the container

---

## License

MIT
