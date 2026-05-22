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
**Status:** Accepted

**Context:** The clip analysis agent needs multi-step reasoning (transcript → score → cluster → generate → rank → reflect).

**Decision:** Use LangGraph Python as a separate FastAPI microservice on port 8001.

**Rationale:**
- LangGraph JS is less mature than Python — Python version has checkpointing, streaming, and tool calling all stable
- State machine model maps directly to our clip analysis workflow
- Separate service allows independent scaling and deployment
- Deepseek API works via OpenAI-compatible client, well-supported in LangChain Python

**Alternatives Considered:**
- Vercel AI SDK — good for simple calls but lacks state machine and reflection loops
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
