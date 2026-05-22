# ROADMAP

## Overall Progress

| Phase | Status | Start | End | Est. | Actual |
|-------|--------|-------|-----|------|--------|
| 1 — Monorepo Foundation | ✅ Complete | 2026-05-22 | 2026-05-22 | 0.5d | 0.5d |
| 2 — Auth + Database | ✅ Complete | 2026-05-22 | 2026-05-22 | 1d | ~0.5d |
| 3 — Core Pipeline | ✅ Complete | 2026-05-22 | 2026-05-22 | 2d | ~0.5d |
| 4 — LangGraph Agent | ✅ Complete | 2026-05-22 | 2026-05-22 | 2d | ~1d |
| 5 — Project + Clips UI | ✅ Complete | 2026-05-22 | 2026-05-22 | 1.5d | ~0.5d |
| 6 — Editing Dashboard | ✅ Complete | 2026-05-22 | 2026-05-22 | 3d | ~1d |
| 7 — Motion Graphics | ✅ Complete | 2026-05-22 | 2026-05-22 | 2d | ~0.5d |
| 8 — Export Pipeline | ✅ Complete | 2026-05-22 | 2026-05-22 | 1.5d | ~0.5d |
| 9 — Polish | ✅ Complete | 2026-05-22 | 2026-05-22 | 0.5d | ~0.25d |
| 10 — Deployment | ✅ Complete | 2026-05-22 | 2026-05-22 | 1d | ~0.5d |
| 11 — Clipping & Stream | ✅ Complete | 2026-05-22 | 2026-05-22 | 1d | ~0.5d |

**Total: All 11 phases complete**

## Legend
- ⏳ Pending
- 🔄 In Progress
- ✅ Complete

## Milestones

| # | Milestone | Depends On | Status |
|---|-----------|-----------|--------|
| M1 | All workspaces running | Phase 1 | ✅ |
| M2 | User can register + login | Phase 2 | ✅ |
| M3 | YouTube → transcript pipeline working | Phase 3 | ✅ |
| M4 | AI recommends clips from transcript | Phase 4 | ✅ |
| M5 | User can browse clips in dashboard | Phase 5 | ✅ |
| M6 | User can edit segments with timeline | Phase 6 | ✅ |
| M7 | AI generates motion b-roll on demand | Phase 7 | ✅ |
| M8 | Full export with subtitles working | Phase 8 | ✅ |
| M9 | Production-ready UX | Phase 9 | ✅ |
| M10 | Deployed to VPS | Phase 10 | ✅ |
| M11 | Auto-clip trimming + video streaming | Phase 11 | ✅ |

## Phase Details

### Phase 10 — Deployment (✅ Complete)
Production deployment to VPS: Docker containers (6 services), Nginx reverse proxy with SSL, GitHub Actions CI/CD, Cloudflare DNS at `klip.richardtandean.my.id`, WebSocket routing via `/socket.io/`.

### Phase 11 — Clipping & Stream (✅ Complete)
- **Auto-clipping**: After AI analysis, clips are immediately trimmed via ffmpeg and uploaded to R2. Project status stays `CLIPPING` until all clips are ready.
- **Stream proxy**: `GET /api/stream/clip/:id` serves trimmed clip video via buffer-based S3 streaming, with range request support (206 Partial Content).
- **Sentence segmentation**: Transcript segments built from natural sentence boundaries (`. ? !`) instead of arbitrary 30-word chunks — 160 segments from 1744 words.
- **Remotion MCP HTTP wrapper**: Express server exposing `/api/generate`, `/api/render-source-tsx`, `/api/templates` — bridges backend to Remotion renderer (`:8080`).
- **AI Chatbox**: Right panel in editor for B-roll prompt generation with quick-prompt buttons and chat history.
- **Segment bug fixes**: EditSegment unique constraint, segmentIndex preservation, `.format()` → `.replace()` in LangGraph prompts, double-quote typo in LLM prompt templates.
- **Video previews**: ClipCard auto-plays trimmed preview on hover, previews auto-generated after analysis.
- **Timeline**: Time ruler with `0:00 | 0:03 | 0:06...` markers, drag-reorder via `@dnd-kit/sortable`, relative timestamps from clip start, per-segment click-to-seek.

## Blockers

| Issue | Phase | Status |
|-------|-------|--------|
| — | — | — |
