# Phase 8 — Export Pipeline

**Status:** ✅ Complete  
**Start:** 2026-05-22  
**End:** 2026-05-22

## Objectives
FFMPEG-based export pipeline: segment stitching, b-roll replacement, subtitle burning, format conversion, and download delivery.

## Tasks

### Export Queue Processor
- [ ] `video-export` queue processor
- [ ] Job payload: `{ editId, format {aspectRatio, resolution, quality} }`
- [ ] Progress reporting via BullMQ job progress
- [ ] WebSocket progress updates to frontend

### FFMPEG Pipeline

The export process in order:

```
1. For each segment in edit:
   ├── If ORIGINAL: extract clip from source video at segment timestamps
   ├── If B_ROLL_UPLOAD: use uploaded b-roll video, mute original audio and overlay
   └── If B_ROLL_GENERATED: use generated Remotion video, mute original audio and overlay

2. Generate subtitles from transcript segments → VTT file

3. Concat all processed segments → single video

4. Burn subtitles into video

5. Resize/reformat to target aspect ratio + resolution

6. Upload final video to R2

7. Generate signed download URL
```

### FFMPEG Commands

#### Extract Segment (Original)
```bash
ffmpeg -ss {start} -to {end} -i {source} -c copy segment_{i}.mp4
```

#### Replace Segment with B-roll (keep audio)
```bash
ffmpeg -i original_segment.mp4 -i broll.mp4 \
  -filter_complex "[1:v]scale={w}:{h}[v1];[0:v][v1]overlay=0:0" \
  -c:a copy segment_{i}.mp4
```

#### Generate VTT Subtitles
From transcript segments:
```
WEBVTT

00:00:01.000 --> 00:00:03.500
First sentence text here.

00:00:03.500 --> 00:00:06.200
Second sentence text here.
```

#### Concat Segments
```bash
ffmpeg -f concat -safe 0 -i concat_list.txt -c copy concat_output.mp4
```

#### Burn Subtitles
```bash
ffmpeg -i concat_output.mp4 -vf "subtitles=subtitles.vtt:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2'" output.mp4
```

#### Resize for Aspect Ratio
```bash
# 9:16 (TikTok/Shorts) — center crop
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" output_9_16.mp4

# 16:9 (YouTube)
ffmpeg -i input.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" output_16_9.mp4

# 1:1 (Instagram)
ffmpeg -i input.mp4 -vf "crop=min(iw\,ih):min(iw\,ih),scale=1080:1080" output_1_1.mp4
```

### NestJS Integration
- [ ] `POST /api/edits/:id/export` — trigger export job
- [ ] Body: `{ aspectRatio: "16:9" | "9:16" | "1:1", resolution: "1080p" | "720p", quality: "high" | "medium" }`
- [ ] `GET /api/exports/:jobId/status` — progress + download URL when complete
- [ ] `GET /api/exports/:jobId/download` — redirect to R2 signed URL
- [ ] Export job statuses: QUEUED → PROCESSING → UPLOADING → COMPLETE / FAILED

### Frontend Integration
- [ ] Export button in ExportToolbar
- [ ] Format options modal/popover
- [ ] Progress bar during export
- [ ] Complete state → download button
- [ ] Error state → retry button
- [ ] Previous exports list (optional for MVP)

### Cleanup
- [ ] Temp files cleaned after export (success or failure)
- [ ] Old exports auto-deleted after 7 days (R2 lifecycle)
- [ ] Export job records with download URLs expire after 7 days

### Verification
- [ ] Export with all ORIGINAL segments → working video
- [ ] Export with mixed ORIGINAL + B_ROLL → segments replaced correctly, audio preserved
- [ ] Subtitles appear on exported video
- [ ] 9:16 export crops correctly (center crop)
- [ ] 16:9 export pads correctly
- [ ] Download link works via R2 signed URL
- [ ] Progress updates appear in frontend

## Notes
- FFMPEG must be installed on the system
- Concat demuxer is fast (no re-encoding for original segments)
- Re-encoding happens only when b-roll is overlaid or subtitles are burned
- For subtitle styling, use ASS format for more control (fonts, positioning, animations)
- Consider GPU acceleration (`-hwaccel`) if available on VPS
