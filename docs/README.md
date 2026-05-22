# Klip SaaS

AI-powered video clipping SaaS — automatically turn long YouTube videos into viral short clips with AI curation, segment-based editing, and AI-generated motion graphics.

## Architecture

```
┌──────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Next.js 15  │◄────▶│  NestJS 11   │◄────▶│  LangGraph      │
│  (Frontend)  │      │  (Backend)   │      │  Python/FastAPI │
└──────┬───────┘      └──────┬───────┘      └────────┬────────┘
       │                     │                       │
       │              ┌──────┴───────┐        ┌──────┴───────┐
       │              │   BullMQ     │        │  Remotion    │
       │              │   + Redis    │        │  MCP (Node)  │
       │              └──────┬───────┘        └──────┬───────┘
       │                     │                       │
       │              ┌──────┴───────┐        ┌──────┴───────┐
       │              │  PostgreSQL  │        │  FFMPEG +    │
       │              │  + Prisma    │        │  Chrome Head  │
       │              └──────────────┘        └──────────────┘
       │
┌──────┴───────┐
│  Cloudflare  │
│  R2 Storage  │
└──────────────┘
```

## Monorepo Structure

```
klip-saas/
├── apps/
│   ├── backend/              # NestJS 11
│   ├── frontend/             # Next.js 15 App Router
│   └── langgraph-agent/      # Python FastAPI + LangGraph
├── packages/
│   ├── shared/               # Types, DTOs, Zod schemas
│   ├── remotion-mcp/         # MCP Server for Remotion tools
│   └── remotion-compositions/ # Remotion React templates
└── docs/
    ├── README.md
    ├── ROADMAP.md
    ├── DECISIONS.md
    └── phases/
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind v4, Shadcn/ui, Video.js, Zustand, TanStack Query, DnD Kit |
| Backend | NestJS 11, Prisma, BullMQ, Socket.io |
| AI Agent | LangGraph (Python), FastAPI, Deepseek API |
| AI Streaming | Vercel AI SDK |
| Media | FFMPEG, yt-dlp, AssemblyAI |
| Motion Graphics | Remotion, MCP Server |
| Storage | Cloudflare R2, PostgreSQL 16, Redis 7 |
| Dev Tools | Turborepo, Docker Compose, TypeScript 5.6 |

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop
- FFMPEG
- yt-dlp (`brew install yt-dlp`)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Install Python dependencies
cd apps/langgraph-agent && pip install -r requirements.txt && cd ../..

# 3. Copy environment files
cp .env.example .env
cp apps/langgraph-agent/.env.example apps/langgraph-agent/.env

# 4. Start infrastructure
docker compose up -d

# 5. Run database migrations
npm run db:migrate

# 6. Start all dev servers
npm run dev
```

### Services

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (NestJS) | 8000 |
| LangGraph Agent | 8001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

## Environment Variables

See `.env.example` for all required environment variables.

## Development

```bash
npm run dev          # Start all services
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run typecheck    # Type check all packages
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database
```
