# Phase 3 — Core Pipeline

**Status:** ✅ Complete  
**Start:** 2026-05-22  
**End:** 2026-05-22

## Objectives
YouTube video download, Cloudflare R2 storage, AssemblyAI transcription, BullMQ queue system, WebSocket status updates.

## Tasks

### Queue System
- [ ] `QueueModule` — BullMQ setup with Redis connection
- [ ] 5 queues: `youtube-download`, `video-transcribe`, `clip-analysis`, `motion-generate`, `video-export`
- [ ] Bull board for queue monitoring (optional dev tool)
- [ ] Shared base processor class with error handling + retries

### Storage Module (R2)
- [ ] `StorageModule` — `@aws-sdk/client-s3` wrapper
- [ ] `upload(file, key)` → R2 URL
- [ ] `getSignedUrl(key, expiresIn)` 
- [ ] `delete(key)`
- [ ] R2 endpoint + credentials from env

### YouTube Download
- [ ] `youtube-download` queue processor
- [ ] Call `yt-dlp` via `child_process.execFile`
- [ ] Check if video exists in DB (dedup by YouTube ID)
- [ ] Download video to temp directory
- [ ] Upload to R2
- [ ] Save video record in DB
- [ ] Emit `video.downloaded` event → triggers transcription
- [ ] Update project status

### Transcription
- [ ] `video-transcribe` queue processor
- [ ] AssemblyAI submit — upload video URL or use R2 signed URL
- [ ] Poll AssemblyAI via their WebSocket or polling API
- [ ] On complete: save raw JSON + full text to `transcripts`
- [ ] Parse utterances into `transcript_segments` (per-sentence, with timestamps)
- [ ] Emit `transcription.completed` event → triggers clip analysis
- [ ] Update project status

### WebSocket Status
- [ ] `StatusGateway` (Socket.io)
- [ ] Namespace `/projects/:id/status`
- [ ] Events: `download.progress`, `transcription.progress`, `analysis.progress`, `status.changed`
- [ ] Auth guard for WebSocket connections
- [ ] Project status machine: PENDING → DOWNLOADING → TRANSCRIBING → ANALYZING → READY

### API Endpoints
- [ ] `POST /api/projects` — create project (body: `{ youtubeUrl }`)
- [ ] `GET /api/projects` — list user's projects
- [ ] `GET /api/projects/:id` — project detail with status
- [ ] `GET /api/projects/:id/transcript` — full transcript + segments
- [ ] `DELETE /api/projects/:id` — delete project + cleanup

### Verification
- [ ] Submit YouTube URL → video downloads to R2
- [ ] Video transcribed → segments with timestamps stored
- [ ] WebSocket pushes real-time status updates
- [ ] Queue handles failures gracefully (no crashes)
- [ ] Dedup works (same URL submitted twice → reuse existing video)

## Notes
- yt-dlp must be installed on the system (`brew install yt-dlp`)
- AssemblyAI free tier has 100 hours/month limit
- Video files can be large (100MB+), ensure temp directory has space
- Consider adding file size limits for R2 upload
