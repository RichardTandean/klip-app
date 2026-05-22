# Phase 5 — Project + Clips UI

**Status:** ✅ Complete  
**Start:** 2026-05-22  
**End:** 2026-05-22

## Objectives
Build the frontend dashboard for project management and clip browsing with real-time status updates.

## Tasks

### Dashboard Page
- [ ] `/dashboard` — Project list (grid of cards)
- [ ] Create project modal / sheet — YouTube URL input form
- [ ] Project card: thumbnail, title, status badge, clip count, date
- [ ] Empty state — "No projects yet" with CTA
- [ ] TanStack Query — `useProjects`, `useCreateProject`, `useDeleteProject`
- [ ] Loading skeletons

### Project Detail Page
- [ ] `/projects/[id]` — Full project view
- [ ] Status timeline — visual pipeline progress (download → transcribe → analyze → ready)
- [ ] Real-time status via WebSocket (flashing/reconnecting indicator)
- [ ] Processing state — animated progress, "Analyzing your video..." message
- [ ] Error state — failed pipeline step with retry button
- [ ] Transcript viewer — expandable full text + segment list

### Clip Cards
- [ ] Clip card component: title, duration, start/end timestamps, viral score badge, reasoning snippet
- [ ] Grid layout, responsive (2-3 columns)
- [ ] Click clip → navigate to editor
- [ ] TanStack Query — `useClips(projectId)`

### App Shell
- [ ] Navbar: logo, projects link, user menu (avatar dropdown)
- [ ] User dropdown: email, logout
- [ ] Sidebar (optional for MVP, can add later)

### Verification
- [ ] Dashboard loads project list from API
- [ ] Create project → appears in list with PENDING status
- [ ] Status updates in real-time via WebSocket
- [ ] Click clip → navigates to /editor/[clipId]
- [ ] Empty state shows when no projects

## Notes
- Use Shadcn/ui components (Card, Dialog, Badge, Skeleton, Button)
- TanStack Query devtools for debugging
- Optimistic updates for project deletion
