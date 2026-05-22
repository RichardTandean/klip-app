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
            "cleaned_segments": [],
            "scored_segments": [],
            "candidate_clusters": [],
            "clip_recommendations": [],
            "reflection_count": 0,
            "status": "started",
            "error": None,
        }

        result = clip_analyzer.invoke(initial_state)

        return {
            "project_id": request.project_id,
            "status": result["status"],
            "clips": result["clip_recommendations"],
            "segment_count": len(result["cleaned_segments"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/health")
async def health():
    return {"status": "ok", "service": "klip-agent"}
