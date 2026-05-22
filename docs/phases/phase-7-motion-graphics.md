# Phase 7 — Motion Graphics

**Status:** ✅ Complete  
**Start:** 2026-05-22  
**End:** 2026-05-22

## Objectives
Remotion MCP server with tools for b-roll generation, 5 motion graphic templates, AI-driven template selection, and rendering pipeline.

## Remotion Compositions (5 Templates)

| # | Template | Description | Props |
|---|----------|-------------|-------|
| 1 | **Lower Third** | Name/title overlay bars with slide-in animation | `text`, `subtitle`, `durationInFrames`, `style` |
| 2 | **Kinetic Text** | Fullscreen animated typography with bounce/scale effects | `text`, `durationInFrames`, `colorScheme`, `animation` |
| 3 | **Icon Burst** | Emoji/icon explosion from center with particle effects | `icon`, `text`, `durationInFrames`, `burstCount` |
| 4 | **Smooth Slide** | Image/video panels sliding in with parallax depth | `images[]`, `text`, `durationInFrames`, `direction` |
| 5 | **Highlight Reveal** | Spotlight/circle reveal with glow ring around subject | `targetArea`, `text`, `durationInFrames`, `glowColor` |

## Tasks

### Remotion Compositions
- [ ] `packages/remotion-compositions/src/Root.tsx` — register all 5 compositions
- [ ] `packages/remotion-compositions/src/compositions/lower-third/` — component + story
- [ ] `packages/remotion-compositions/src/compositions/kinetic-text/` — component + story
- [ ] `packages/remotion-compositions/src/compositions/icon-burst/` — component + story
- [ ] `packages/remotion-compositions/src/compositions/smooth-slide/` — component + story
- [ ] `packages/remotion-compositions/src/compositions/highlight-reveal/` — component + story
- [ ] Each composition: `Composition.tsx`, `index.ts`
- [ ] `npm run remotion preview` — Remotion Studio for dev

### Remotion MCP Server
- [ ] `packages/remotion-mcp/src/server.ts` — MCP server with stdio + SSE transports
- [ ] `tools/list_templates` — returns available templates with descriptions and props
- [ ] `tools/generate_broll` — AI agent passes prompt, MCP chooses template + generates props
- [ ] `tools/render_broll` — queues Remotion render job
- [ ] `skills/` — knowledge files for Remotion best practices
  - [ ] `skills/spring-animations.md` — frame patterns, spring config presets
  - [ ] `skills/text-animations.md` — kinetic typography patterns
  - [ ] `skills/transitions.md` — wipe, slide, scale patterns
  - [ ] `skills/lower-thirds.md` — layout patterns, style variations

### Motion Generate Queue
- [ ] `motion-generate` queue processor
- [ ] Receives: `{ prompt, durationMs, style }`
- [ ] Calls MCP `generate_broll` tool
- [ ] Renders via `@remotion/renderer`
- [ ] Uploads output video to R2
- [ ] Saves record to `motion_graphics` table
- [ ] Updates progress via WebSocket

### NestJS Integration
- [ ] `POST /api/motion/generate` — trigger b-roll generation
- [ ] `GET /api/motion/:id/status` — check generation status
- [ ] `GET /api/motion/:id/download` — download generated video
- [ ] `GET /api/motion/templates` — list available templates

### Frontend Integration (in editor)
- [ ] B-roll generator panel in SegmentInspector
- [ ] Prompt input with template selector dropdown
- [ ] Generate button with loading state
- [ ] Preview rendered b-roll in player (before applying)
- [ ] Apply to segment button

### Skills (Injected into MCP Context)

#### spring-animations.md
- Spring config: `{ damping: 200, stiffness: 100, mass: 1 }`
- Presets: gentle, wobbly, stiff, molasses, default
- Use `useSpring()` for entrance/exit animations
- Layer springs for complex sequences

#### text-animations.md
- Character-by-character stagger: use `fps` + `delay` per char
- Decode (scramble) text reveal
- Typewriter effect with `useCurrentFrame`
- Scale + opacity combo for kinetic entrances

#### transitions.md
- Wipe: `width: interpolate(frame, [0,30], [0,100%])`
- Slide: `transform: translateX(interpolate(...))`
- Scale: `transform: scale(interpolate(...))`
- Fade + blur: `opacity` + `filter: blur()`

#### lower-thirds.md
- Standard lower third: 2-line text bar at bottom 10%
- Animate in from bottom with spring
- Optional: accent bar, gradient background
- Responsive to video width

### Verification
- [ ] `remotion studio` shows all 5 compositions
- [ ] MCP server starts, tools are discoverable
- [ ] `generate_broll` tool accepts prompt, returns composition + props
- [ ] Rendering produces valid MP4 file
- [ ] Generated b-roll uploads to R2
- [ ] B-roll appears in editor and can be applied to segment

## Notes
- Remotion rendering requires Chrome/Chromium headless
- Each render takes 30s-2min depending on composition complexity + duration
- Render queue should limit concurrency to avoid CPU spikes
- Template props should be Zod-validated by MCP server
