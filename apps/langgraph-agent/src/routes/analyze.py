from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.graph.clip_analyzer import clip_analyzer
from src.graph.state import ClipAnalysisState

router = APIRouter()


class SegmentInput(BaseModel):
    index: int
    text: str
    start_ms: int
    end_ms: int


class AnalyzeRequest(BaseModel):
    project_id: str
    segments: list[SegmentInput]


@router.post("/analyze")
async def analyze_clips(request: AnalyzeRequest):
    try:
        initial_state: ClipAnalysisState = {
            "project_id": request.project_id,
            "transcript_segments": [seg.model_dump() for seg in request.segments],
            "insights": {},
            "clip_moments": [],
            "scored_moments": [],
            "clip_scripts": [],
            "status": "started",
            "error": None,
        }

        result = clip_analyzer.invoke(initial_state)

        clip_scripts = result.get("clip_scripts", [])

        return {
            "project_id": request.project_id,
            "status": result["status"],
            "insights": result.get("insights", {}),
            "clips": [
                {
                    "title": c.get("title"),
                    "start_sentence_index": c.get("start_sentence_index"),
                    "end_sentence_index": c.get("end_sentence_index"),
                    "start_ms": c.get("start_ms"),
                    "end_ms": c.get("end_ms"),
                    "duration_ms": c.get("duration_ms"),
                    "reasoning": c.get("reasoning"),
                    "viral_score": c.get("viral_score"),
                    "platform": c.get("platform"),
                    "caption": c.get("caption"),
                    "hook_suggestion": c.get("hook_suggestion"),
                    "text_overlays": c.get("text_overlays"),
                    "moment_type": c.get("moment_type"),
                }
                for c in clip_scripts
            ],
            "segment_count": len(request.segments),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/health")
async def health():
    return {"status": "ok", "service": "klip-agent"}
