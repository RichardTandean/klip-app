# Phase 6 — Editing Dashboard

**Status:** ✅ Complete  
**Start:** 2026-05-22  
**End:** 2026-05-22

## Objectives
Full editing dashboard with horizontal timeline, Video.js player, segment-based editing, b-roll replacement, and segment inspector.

## Components

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  ExportToolbar (format, quality, export button)             │
├───────────────────────────────────┬─────────────────────────┤
│                                   │                         │
│  PreviewPlayer (Video.js)         │  SegmentInspector       │
│                                   │  (side panel, 360px)   │
│                                   │                         │
│                                   │  - Text preview         │
│                                   │  - Audio waveform       │
│                                   │  - B-roll upload zone   │
│                                   │  - B-roll generate      │
│                                   │  - Apply / remove       │
│                                   │                         │
├───────────────────────────────────┴─────────────────────────┤
│  Timeline (horizontal scrollable)                           │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┐               │
│  │ Seg1 │ Seg2 │ Seg3 │ Seg4 │ Seg5 │ Seg6 │               │
│  └──────┴──────┴──────┴──────┴──────┴──────┘               │
│  ▲ Playhead                                                │
└─────────────────────────────────────────────────────────────┘
```

### Tasks

#### PreviewPlayer
- [ ] Video.js player setup with custom skin
- [ ] Load clip source from R2 signed URL
- [ ] Sync `currentTime` with timeline playhead
- [ ] Play/pause controls
- [ ] Keyboard shortcuts (space = play/pause, arrow keys = seek)

#### Timeline
- [ ] Horizontal scrollable canvas
- [ ] Two tracks: Original footage + B-roll overlay
- [ ] Segment cards (per kalimat), width proportional to duration
- [ ] Color coding: blue = original, green = b-roll_upload, purple = b-roll_generated
- [ ] Scrubber/playhead synced to Video.js `currentTime`
- [ ] Click segment → select (highlight border)
- [ ] Drag segment → reorder (optional for MVP)
- [ ] Zoom controls (timeline scale: + / -)
- [ ] DnD Kit integration
- [ ] Virtual scrolling for long clips (50+ segments)

#### SegmentInspector
- [ ] Shows selected segment details
- [ ] Text preview (what's being said in this segment)
- [ ] Mini audio waveform (optional)
- [ ] B-roll upload zone (drag & drop video/gif)
  - [ ] Upload to R2 via presigned URL
  - [ ] Preview uploaded b-roll in player
- [ ] B-roll generate section
  - [ ] Prompt textarea
  - [ ] Generate button → calls motion graphics API
  - [ ] Generated b-roll preview
- [ ] Apply b-roll to segment → update edit_segments
- [ ] Remove b-roll → revert to original

#### ExportToolbar
- [ ] Aspect ratio selector (16:9, 9:16, 1:1)
- [ ] Resolution selector (1080p, 720p)
- [ ] Export button → triggers export job
- [ ] Export progress indicator
- [ ] Download link when complete

#### State Management
- [ ] Zustand store: `useEditorStore`
  - [ ] `selectedSegmentIndex`, `currentTime`, `isPlaying`, `zoomLevel`
  - [ ] `segments[]` — all segments with their type and b-roll data
  - [ ] `setSegmentType(index, type)` — update segment b-roll
- [ ] TanStack Query: `useEdit(editId)`, `useUpdateSegment`, `useExport`

### API Endpoints
- [ ] `POST /api/edits` — create edit session from clip
- [ ] `GET /api/edits/:id` — get edit with all segments
- [ ] `PATCH /api/edits/:id/segments/:idx` — update segment type/b-roll
- [ ] `POST /api/edits/:id/segments/:idx/upload` — upload b-roll for segment
- [ ] `POST /api/edits/:id/export` — trigger export job

### Verification
- [ ] Timeline shows all segments, playhead syncs with player
- [ ] Click segment → inspector shows details
- [ ] Upload b-roll → segment changes color, preview works
- [ ] Generate b-roll via prompt → appears on segment
- [ ] Multiple segments can have different b-roll types
- [ ] Export button triggers job
- [ ] Keyboard shortcuts work

## Notes
- Video.js custom skin via CSS — use Shadcn color tokens
- DnD Kit for drag and drop (b-roll upload zone + timeline reordering)
- For MVP, vertical layout on mobile = just scrollable segment list, desktop = full timeline
- Consider Remotion player as an alternative if Video.js has sync issues
