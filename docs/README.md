# Klip SaaS

AI-powered video clipping SaaS — automatically turn long YouTube videos into viral short clips with AI curation, segment-based timeline editing, AI-generated Remotion motion graphics, and one-click export.

**Live:** `https://klip.richardtandean.my.id`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERNET / USERS                                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ HTTPS (443)
                       ┌──────────▼────────────┐
                       │   NGINX Reverse Proxy  │
                       │   + SSL (Certbot)      │
                       └──────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
 ┌──────▼──────┐          ┌──────▼──────┐          ┌──────▼──────┐
 │ Next.js 15  │◄────────▶│  NestJS 11  │◄────────▶│  LangGraph  │
 │ (Frontend)  │  REST+WS │  (Backend)  │  HTTP     │  Python     │
 │  :3000      │          │  :8000      │          │  :8001      │
 └─────────────┘          └──────┬──────┘          └─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
       ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
       │  PostgreSQL │   │  Redis 7    │   │  Remotion   │
       │  :5432      │   │  :6379      │   │  MCP :3001  │
       │  Prisma ORM │   │  BullMQ     │   │  HTTP API   │
       └─────────────┘   └─────────────┘   └──────┬──────┘
                                                   │
       ┌────────────────────────────────────────────┼──────┐
       │                  R2 Storage                │      │
       │  videos/   previews/   audio/   motion/   exports/ │
       └────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
klip-saas/
├── apps/
│   ├── backend/              # NestJS 11 (REST API + BullMQ workers + WebSocket)
│   ├── frontend/             # Next.js 15 App Router (Tailwind + shadcn/ui + Video.js)
│   └── langgraph-agent/      # Python FastAPI + LangGraph (4-node AI state graph)
├── packages/
│   ├── shared/               # Zod schemas shared between frontend & backend
│   ├── remotion-mcp/         # MCP HTTP Server → Remotion renderer proxy
│   └── remotion-compositions/ # 5 Remotion React templates
├── docs/                     # README, ROADMAP, DECISIONS, VPS Setup
├── docker-compose.prod.yml   # Production stack (6 services)
├── .env.production           # Environment variables
└── .github/workflows/        # CI/CD pipeline
```

## Services (Production Docker)

| Container | Tech | Port | Purpose |
|-----------|------|------|---------|
| `klip-frontend` | Next.js 15 | 3000 | User-facing web app |
| `klip-backend` | NestJS 11 | 8000 | REST API + 6 BullMQ queues + WebSocket |
| `klip-langgraph-agent` | Python/FastAPI | 8001 | AI clip analysis (4-node state graph via Deepseek) |
| `klip-remotion-mcp` | Node.js/Express | 3001 | Remotion template selection + TSX generation |
| `klip-postgres` | PostgreSQL 16 | 5432 | Database (9 tables via Prisma) |
| `klip-redis` | Redis 7 | 6379 | BullMQ queues + cache |

## Core Pipeline (YouTube → Clip)

```
1. User pastes YouTube URL
       │
2. yt-dlp downloads video → R2 upload
       │
3. AssemblyAI transcribes → words[] with timestamps
       │
4. Build sentence-based segments with word-level alignment
       │
5. LangGraph AI Agent (Deepseek LLM) — 4-node linear pipeline:
   analyzer → moment_detector → clip_scorer → script_builder
       │
   ├─ analyzer: Analyze topic, tone, speaker style, key themes
   ├─ moment_detector: Find ALL clip-worthy moments (emotional peaks,
   │   strong insights, funny moments, conflicts, story climaxes, hooks)
   ├─ clip_scorer: Score each moment on 4 dimensions (hook, emotional,
   │   completeness, retention — each 0-10)
   └─ script_builder: Generate full publishing package (title, hook
       suggestion, caption, text overlays, platform recommendation)
       │
6. Clip recommendations generated (AI decides count, no artificial limit)
       │
7. CLIPPING PHASE: ffmpeg trim per clip → R2 previews/<id>.mp4
       │
8. Project status: READY → User can view & edit clips
```

## BullMQ Queues (6)

| Queue | Processor | Trigger |
|-------|-----------|---------|
| `youtube-download` | VideoProcessor | User creates project |
| `video-transcribe` | TranscriptProcessor | After download complete |
| `clip-analysis` | ClipProcessor + LangGraph | After transcription |
| `clip-preview` | ClipPreviewProcessor | After clips created (legacy, now inline) |
| `motion-generate` | MotionService (inline) | User prompts b-roll |
| `video-export` | ExportProcessor | User clicks export |

## Editing Dashboard

| Feature | Detail |
|---------|--------|
| **Video Player** | Video.js with trimmed clip preview |
| **Timeline** | Per-sentence segment cards, drag-reorder (dnd-kit) |
| **Time Ruler** | 0:00 / 0:03 / 0:06 markers, relative to clip start |
| **Segment Actions** | Click → select + seek, × → delete, drag → reorder |
| **AI Chatbox** | Right panel: prompt → Remotion render → apply b-roll |
| **B-Roll Generation** | 5 templates (lower-third, kinetic-text, icon-burst, smooth-slide, highlight-reveal) |
| **Export** | 16:9 / 9:16 / 1:1, 1080p/720p, VTT subtitles |

## Remotion MCP Integration

```
User prompt in chatbox
  → POST /api/motion/generate
  → MCP /api/generate → select template
  → MCP /api/render-source-tsx → generate TSX
  → Remotion renderer :8080 /render-source → render MP4
  → Upload to R2 → signed URL → apply to segment
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind v4, shadcn/ui, Video.js, Zustand, TanStack Query, dnd-kit |
| Backend | NestJS 11, Prisma, BullMQ, Socket.io, Helmet |
| AI Agent | LangGraph Python, FastAPI, Deepseek API (deepseek-chat) |
| Transcription | AssemblyAI |
| Media | FFMPEG, yt-dlp |
| Motion Graphics | Remotion, MCP Server |
| Storage | Cloudflare R2 (S3 API), PostgreSQL 16, Redis 7 |
| Infra | Docker Compose, Nginx, Certbot, GitHub Actions |
| Domain | `klip.richardtandean.my.id` (Cloudflare DNS) |

## Quick Start

```bash
# Prerequisites: Node.js 20+, Python 3.11+, Docker, FFMPEG, yt-dlp

npm install
cp .env.example .env   # Edit with API keys
docker compose up -d    # PostgreSQL + Redis
npm run db:migrate
npm run dev             # Frontend :3000 | Backend :8000 | Agent :8001
```

## Deployment

```bash
cp .env.production .env
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

**Domain:** `https://klip.richardtandean.my.id`
**SSL:** Let's Encrypt via Certbot, auto-renew
**DNS:** Cloudflare → VPS IP `109.123.233.237`

## Environment Variables

See `.env.example` for all variables. Required: `DATABASE_URL`, `JWT_SECRET`, `DEEPSEEK_API_KEY`, `ASSEMBLYAI_API_KEY`, `R2_*`, `REDIS_URL`.
