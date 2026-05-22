# Phase 4 — LangGraph Agent

**Status:** ✅ Complete  
**Start:** 2026-05-22  
**End:** 2026-05-22

## Objectives
Build the AI clip analysis agent using LangGraph (Python) with a state machine graph that processes transcripts and recommends viral clip segments.

## State Graph Design

```
PROCESS_TRANSCRIPT ──▶ SCORE_ENGAGEMENT ──▶ CLUSTER_SENTENCES
                                                │
                                                ▼
                                          GENERATE_CLIPS ◀──┐
                                                │           │
                                                ▼           │
                                          RANK_CLIPS        │
                                                │           │
                                                ▼           │
                                          REFLECT ◀─────────┘
                                     (pass/revise)
                                           │
                                    pass   ▼
                                          END
```

### Nodes

| Node | Input | Output | Description |
|------|-------|--------|-------------|
| `process_transcript` | Raw segments | Cleaned segments | Merge short sentences, normalize text, add indices |
| `score_engagement` | Cleaned segments | Scored segments | Each sentence scored 1-10 for emotional/viral potential |
| `cluster_sentences` | Scored segments | Candidate clusters | Group high-score sentences into contiguous clip boundaries (30-90s) |
| `generate_clips` | Candidate clusters | Clip recommendations | For each cluster, generate title, hook description, full reasoning |
| `rank_clips` | Clip recommendations | Ranked clips | Sort by viral score, remove low-quality (<6/10) |
| `reflect` | Ranked clips | Pass or Revise | Self-critique: check for overlap, quality, diversity. Revise max 2x |

### State Schema (TypedDict)

```python
class ClipAnalysisState(TypedDict):
    project_id: str
    transcript_segments: list[Segment]
    cleaned_segments: list[Segment]
    scored_segments: list[ScoredSegment]
    candidate_clusters: list[Cluster]
    clip_recommendations: list[ClipRecommendation]
    reflection_count: int
    status: str  # "processing" | "reflecting" | "complete" | "error"
    error: str | None
```

## Tasks

### FastAPI App
- [ ] `apps/langgraph-agent/src/main.py` — FastAPI with CORS, health check
- [ ] `POST /analyze` — receives transcript segments, returns clip recommendations
- [ ] `GET /health` — health check
- [ ] Pydantic models for request/response validation

### LangGraph Graph
- [ ] `apps/langgraph-agent/src/graph/clip_analyzer.py` — StateGraph definition
- [ ] `apps/langgraph-agent/src/graph/nodes/process_transcript.py`
- [ ] `apps/langgraph-agent/src/graph/nodes/score_engagement.py`
- [ ] `apps/langgraph-agent/src/graph/nodes/cluster_sentences.py`
- [ ] `apps/langgraph-agent/src/graph/nodes/generate_clips.py`
- [ ] `apps/langgraph-agent/src/graph/nodes/rank_clips.py`
- [ ] `apps/langgraph-agent/src/graph/nodes/reflect.py`
- [ ] `apps/langgraph-agent/src/graph/state.py` — state type definition

### LLM Integration
- [ ] Deepseek client via `langchain-deepseek` or OpenAI-compatible
- [ ] Prompt templates for each node
- [ ] Structured output parsing (JSON mode)
- [ ] Token tracking + cost estimation

### NestJS Integration
- [ ] `AIService` — HTTP client to call LangGraph agent
- [ ] `POST /api/projects/:id/analyze` — trigger analysis
- [ ] Queue integration — clip-analysis queue calls agent
- [ ] Save results to `clips` table
- [ ] WebSocket updates during analysis

### Verification
- [ ] POST segments → returns 3-6 clip recommendations with reasoning
- [ ] Each clip has: title, start_time_ms, end_time_ms, reasoning, viral_score
- [ ] Reflection loop works (detects low quality, revises)
- [ ] No infinite loops (max 2 reflection cycles)
- [ ] Error handling: rate limits, API errors, malformed responses

## Notes
- Deepseek API endpoint: OpenAI-compatible format
- Use `json_mode` or structured output for reliable parsing
- Consider caching transcript analysis results per project
- Cost: ~$0.01-0.03 per project (depending on transcript length)
