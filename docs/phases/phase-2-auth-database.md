# Phase 2 — Auth + Database

**Status:** ✅ Complete  
**Start:** 2026-05-22  
**End:** 2026-05-22

## Objectives
Full authentication system (register, login, JWT, refresh tokens) and database schema with Prisma.

## Tasks

### Database
- [ ] `apps/backend/prisma/schema.prisma` — 9 tables (users, projects, videos, transcripts, transcript_segments, clips, edits, edit_segments, motion_graphics, export_jobs)
- [ ] `npx prisma migrate dev` — initial migration
- [ ] Seed script — test user + sample project
- [ ] PrismaModule — singleton service in NestJS

### Auth Backend
- [ ] `AuthModule` — register with bcrypt, login with JWT, refresh token rotation
- [ ] JWT guard + strategy (passport-jwt)
- [ ] `POST /api/auth/register` — email + password + name
- [ ] `POST /api/auth/login` — returns access + refresh tokens
- [ ] `POST /api/auth/refresh` — rotate refresh token
- [ ] `GET /api/auth/me` — current user info
- [ ] Input validation with Zod/class-validator
- [ ] Rate limiting on auth endpoints

### Auth Frontend
- [ ] `AuthProvider` — context + token management (cookie storage)
- [ ] API client — axios/fetch wrapper with auto-refresh
- [ ] `/login` page — form + validation + redirect
- [ ] `/register` page — form + validation + redirect
- [ ] Protected route wrapper / middleware
- [ ] Login/logout UI state

### Verification
- [ ] Register new user → created in DB
- [ ] Login → receive valid JWT
- [ ] Access protected route with JWT → 200
- [ ] Access protected route without JWT → 401
- [ ] Refresh token rotation works
- [ ] Password hashed (bcrypt) in DB

## Schema Summary

| Table | Key Fields |
|-------|-----------|
| users | id, email, passwordHash, name, createdAt, updatedAt |
| projects | id, userId, title, youtubeUrl, status, createdAt |
| videos | id, projectId, youtubeUrl, r2Url, duration, createdAt |
| transcripts | id, videoId, fullText, rawJson, createdAt |
| transcript_segments | id, transcriptId, index, text, startMs, endMs |
| clips | id, projectId, title, startSegmentIdx, endSegmentIdx, reasoning, viralScore, status |
| edits | id, clipId, projectId, userId, status, r2Url |
| edit_segments | id, editId, segmentIdx, type(original/broll_upload/broll_generated), brollUrl, brollPrompt |
| motion_graphics | id, userId, prompt, template, r2Url, status |
| export_jobs | id, editId, userId, format, status, progress, r2Url |

## Acceptance Criteria
- [ ] All auth endpoints working
- [ ] Prisma schema migrated successfully
- [ ] Register → login → access protected route flow works end-to-end
