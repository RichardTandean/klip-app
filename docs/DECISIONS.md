# Architecture Decision Records (ADR)

## ADR-001: Monorepo with Turborepo + npm Workspaces

**Date:** 2026-05-22  
**Status:** Accepted

**Context:** Multiple packages (frontend, backend, agent, shared libs) need to coexist and share code.

**Decision:** Use Turborepo with npm workspaces under `apps/` and `packages/`.

**Rationale:**
- Turborepo handles parallel task execution, caching, and dependency ordering
- npm workspaces avoid additional tooling (no pnpm migration needed)
- `apps/` for deployable services, `packages/` for shared libraries

---

## ADR-002: LangGraph (Python) as Main AI Orchestrator

**Date:** 2026-05-22
**Status:** Accepted (Revised 2026-05-22)

**Context:** The clip analysis agent needs multi-step reasoning to analyze transcripts and produce ready-to-publish clip packages.

**Decision:** Use LangGraph Python as a separate FastAPI microservice on port 8001 with a 4-node linear pipeline:

```
analyzer → moment_detector → clip_scorer → script_builder
```

**Rationale:**
- LangGraph JS is less mature than Python — Python version has checkpointing, streaming, and tool calling all stable
- State machine model maps directly to our clip analysis workflow (each node enriches the state)
- Linear flow with no artificial limits — AI decides how many clips to generate based on content density
- Separate service allows independent scaling and deployment
- Deepseek API works via LangChain's `ChatDeepSeek` integration

**Pipeline Nodes:**
1. **analyzer** — Analyze full transcript: topic, tone, speaker style, key themes, narrative arc
2. **moment_detector** — Detect ALL clip-worthy moments (emotional_peak, strong_insight, funny_moment, conflict_tension, story_climax, hookable_opener, actionable_tip)
3. **clip_scorer** — Score each moment on 4 dimensions: hook, emotional, completeness, retention (0-10 each)
4. **script_builder** — Generate publishing package: title, hook suggestion, caption, text overlays, platform recommendation, viral score

**Alternatives Considered:**
- Vercel AI SDK — good for simple calls but lacks state machine
- Custom tool-calling loop — too much boilerplate
- LangGraph JS — less mature, Python has better docs and community

---

## ADR-003: Remotion MCP Server for Motion Graphics

**Date:** 2026-05-22  
**Status:** Accepted

**Context:** Motion graphics generation needs to be callable from both the AI agent and directly from the backend.

**Decision:** Wrap Remotion composition rendering in an MCP (Model Context Protocol) server.

**Rationale:**
- Decouples Remotion logic from both backend and agent
- MCP standard protocol — reusable across different AI agents
- Tools are self-documenting (list_templates, generate_broll, render_broll)
- Can run as separate process for isolation

---

## ADR-004: BullMQ for Async Job Processing

**Date:** 2026-05-22  
**Status:** Accepted

**Context:** Video download, transcription, AI analysis, rendering, and export are all long-running async tasks.

**Decision:** Use BullMQ with Redis for queue management.

**Rationale:**
- Native NestJS integration (@nestjs/bullmq)
- Job progress reporting, retries, priorities, delayed jobs
- Redis already needed for WebSocket session management
- Well-proven in Node.js ecosystem

---

## ADR-005: Cloudflare R2 for Object Storage

**Date:** 2026-05-22  
**Status:** Accepted

**Context:** Video files need storage — originals, b-roll uploads, rendered exports.

**Decision:** Use Cloudflare R2 with S3-compatible API.

**Rationale:**
- No egress fees (major cost saving vs S3 for video serving)
- S3 API compatible — works with @aws-sdk/client-s3
- Built-in CDN via Cloudflare
- Free tier sufficient for MVP

---

## ADR-006: Custom JWT Auth (MVP)

**Date:** 2026-05-22  
**Status:** Accepted

**Context:** Need authentication for multi-user SaaS.

**Decision:** Custom JWT with NestJS passport + refresh token rotation for MVP.

**Rationale:**
- Simplest to implement for MVP
- No third-party auth vendor dependency
- Can migrate to Clerk/Auth0 later without breaking data model

**Future Consideration:** Clerk for social login, MFA, and session management at scale.

---

## ADR-007: Buffer-Based Stream Proxy for Video Playback

**Date:** 2026-05-22
**Status:** Accepted

**Context:** Video.js player in the editor needs to play trimmed clip videos stored in R2. Signed URLs via `@aws-sdk/s3-request-presigner` returned 403 from Cloudflare R2 (signature format incompatibility). Piping S3 `GetObject` responses through NestJS to the browser caused unreliable streaming (499 client disconnects, range request failures).

**Decision:** Stream videos via a proxy endpoint (`GET /api/stream/clip/:id`) that reads the entire file from R2 into a buffer, then sends it with proper range-request support via `res.end(buffer)`.

**Rationale:**
- Clip videos are small (5-10 MB after trimming) — buffering is fast and safe
- Buffer-based approach avoids pipe complexity (no backpressure, no stream errors)
- Range requests handled via `Buffer.slice()` — Chrome/Video.js send `Range: bytes=0-xxxx` to probe format before full download
- No CORS issues (same-origin proxy)
- No auth needed (clip ID is the access token — public endpoint)
- R2 `GetObject` works reliably via S3 client (unlike presigned URLs)

**Alternatives Considered:**
- Presigned R2 URLs — returned 403, `forcePathStyle: true` didn't fully resolve
- S3 pipe streaming — caused 499 client disconnects and range request failures
- Cloudflare Stream / Mux — unnecessary managed service cost for MVP

---

## ADR-008: Synchronous Clipping Phase After AI Analysis

**Date:** 2026-05-22
**Status:** Accepted

**Context:** After AI analysis generates clip recommendations (title, startMs, endMs, viral score), the trimmed video files must exist before the user opens the editing dashboard. Previously this was async via BullMQ queue, causing clips to appear before their preview videos were ready.

**Decision:** Add a **clipping phase** within the `clip-analysis` job that synchronously trims each clip via ffmpeg and uploads to R2 before setting the project status to `READY`.

**Rationale:**
- Guarantees clips are playable immediately when user opens the project
- Avoids race condition: user clicks clip → preview not yet generated → video error
- ffmpeg trimming with `-c copy` (no re-encode) is fast (~1-2 seconds per clip)
- `PREVIEWS` R2 path: `previews/<clipId>.mp4` — same key used by stream proxy and ClipCard hover
- Clip status goes: `CLIPPING` → `READY` (individual), Project: `CLIPPING` → `READY`
- Clips that fail to trim are marked `FAILED` but project still completes

**Flow:**
```
AI Analysis → create Clip records (status: CLIPPING)
  → for each clip: ffmpeg trim → R2 upload → status: READY
  → Project status: READY
```

---

## ADR-009: Sentence-Based Segmentation via AssemblyAI Word-Level Data

**Date:** 2026-05-22
**Status:** Accepted

**Context:** AssemblyAI returns word-level timestamps (`words[]`) and optional speaker turns (`utterances[]`). For single-speaker videos (most YouTube content), `utterances` is null. The initial approach grouped 30 words per segment, producing arbitrary boundaries that didn't align with natural sentence breaks.

**Decision:** Split transcript text by sentence endings (`.`, `?`, `!`) using the full punctuated text, then align each sentence with its constituent words to derive segment timestamps.

**Rationale:**
- Sentence = natural unit for clip editing (each sentence is one thought/topic)
- 160 segments from 1744 words = ~11 words per segment (vs 30-word chunks)
- Aligns with user's mental model: "segment 30-37" = sentences 30 through 37
- AssemblyAI's `punctuate: true` provides reliable punctuation for sentence boundary detection
- Fallback to 30-word chunks if sentence parsing fails
- Segment indices are preserved through the entire AI pipeline via dict lookup (`seg_by_index`)


