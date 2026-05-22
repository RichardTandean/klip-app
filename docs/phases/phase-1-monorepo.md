# Phase 1 — Monorepo Foundation

**Status:** ✅ Complete  
**Start:** 2026-05-22  
**End:** 2026-05-22  
**Estimate:** 0.5 day

## Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop
- npm

## Objectives
Scaffold the entire monorepo: workspace packages, build tooling, configuration files, and development infrastructure.

## Tasks

### Root Configuration
- [ ] `turbo.json` — pipeline config (dev, build, lint, typecheck)
- [ ] `tsconfig.base.json` — shared TypeScript config
- [ ] `.env.example` — all environment variables documented
- [ ] `.gitignore` — node_modules, .env, dist, .turbo, etc.
- [ ] Root `package.json` updated with workspace paths

### Backend (NestJS)
- [ ] `apps/backend/package.json` — NestJS 11 + Prisma + BullMQ + JWT deps
- [ ] `apps/backend/tsconfig.json` — extends base, NestJS-specific options
- [ ] `apps/backend/tsconfig.build.json` — build config
- [ ] `apps/backend/nest-cli.json` — Nest CLI config
- [ ] `apps/backend/src/main.ts` — bootstrap, CORS, global prefix
- [ ] `apps/backend/src/app.module.ts` — root module
- [ ] `apps/backend/src/app.controller.ts` — health check endpoint
- [ ] `apps/backend/src/app.service.ts` — basic service

### Frontend (Next.js)
- [ ] `apps/frontend/package.json` — Next.js 15 + Tailwind v4 + Shadcn + Video.js + Zustand + TanStack Query
- [ ] `apps/frontend/tsconfig.json` — extends base, Next.js-specific
- [ ] `apps/frontend/next.config.ts` — Next.js config
- [ ] `apps/frontend/postcss.config.mjs` — Tailwind v4 PostCSS plugin
- [ ] `apps/frontend/src/app/globals.css` — Tailwind v4 imports + Shadcn CSS vars
- [ ] `apps/frontend/src/app/layout.tsx` — root layout with metadata
- [ ] `apps/frontend/src/app/page.tsx` — placeholder homepage

### LangGraph Agent (Python)
- [ ] `apps/langgraph-agent/requirements.txt` — LangGraph, LangChain, FastAPI, Deepseek
- [ ] `apps/langgraph-agent/.env.example` — DEEPSEEK_API_KEY, etc.
- [ ] `apps/langgraph-agent/src/main.py` — FastAPI app
- [ ] `apps/langgraph-agent/src/graph/clip_analyzer.py` — graph skeleton
- [ ] `apps/langgraph-agent/src/routes/analyze.py` — POST /analyze route

### Shared Package
- [ ] `packages/shared/package.json` — zod, types
- [ ] `packages/shared/tsconfig.json`
- [ ] `packages/shared/src/index.ts` — barrel export
- [ ] `packages/shared/src/schemas/` — Zod schemas

### Remotion Packages
- [ ] `packages/remotion-mcp/package.json` — MCP SDK
- [ ] `packages/remotion-mcp/src/server.ts` — MCP server skeleton
- [ ] `packages/remotion-mcp/src/tools/index.ts` — tool registry
- [ ] `packages/remotion-compositions/package.json` — Remotion + React
- [ ] `packages/remotion-compositions/src/Root.tsx` — Composition registry
- [ ] 5 composition directories (lower-third, kinetic-text, icon-burst, smooth-slide, highlight-reveal)

### Infrastructure
- [ ] `docker-compose.yml` — PostgreSQL 16 + Redis 7
- [ ] `docs/deploy/VPS-SETUP.md` — VPS provisioning guide

### Verification
- [ ] `npm install` succeeds at root
- [ ] `npm run dev` starts all services
- [ ] Frontend loads at localhost:3000
- [ ] Backend /api/health returns 200
- [ ] LangGraph agent /health returns 200
- [ ] Docker containers running (PostgreSQL + Redis)

## Acceptance Criteria
- [x] All workspace directories have package.json
- [x] Turbo pipeline configured
- [x] All services start in dev mode
- [x] Health checks pass for all services
- [x] Docker services running

## Notes
- `backend/`, `frontend/`, `packages/` at root are being moved to `apps/` for cleaner structure
- `dashboard/` and `landing page/` directories at root are deprecated — remove or move
- Tailwind v4 uses CSS-based config (no tailwind.config.ts)
- NestJS requires `reflect-metadata` import at entry point
