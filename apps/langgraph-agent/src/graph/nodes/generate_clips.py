import json
from src.graph.state import ClipAnalysisState
from src.llm.deepseek import get_llm
from src.graph.prompts.clip_analysis import GENERATE_CLIP_PROMPT


def generate_clips(state: ClipAnalysisState) -> ClipAnalysisState:
    clusters = state["candidate_clusters"]
    cleaned = state["cleaned_segments"]

    clusters_json = json.dumps(clusters, indent=2)
    transcript_context = json.dumps([{"index": s["index"], "text": s["text"]} for s in cleaned], indent=2)

    prompt = GENERATE_CLIP_PROMPT.format(
        clusters=clusters_json,
        transcript_context=transcript_context,
    )

    llm = get_llm(temperature=0.6)
    response = llm.invoke(prompt)
    content = response.content.strip()

    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        clips = json.loads(content)
        if not isinstance(clips, list):
            raise ValueError("Expected array")
    except (json.JSONDecodeError, ValueError):
        clips = []

    recommendations = []
    for clip in clips:
        start_idx = int(clip.get("start_sentence_index", 0))
        end_idx = int(clip.get("end_sentence_index", 0))

        start_seg = cleaned[start_idx] if 0 <= start_idx < len(cleaned) else cleaned[0]
        end_seg = cleaned[end_idx] if 0 <= end_idx < len(cleaned) else cleaned[-1]

        recommendations.append({
            "title": clip.get("title", "Untitled Clip"),
            "start_sentence_index": start_idx,
            "end_sentence_index": end_idx,
            "start_ms": start_seg["start_ms"],
            "end_ms": end_seg["end_ms"],
            "duration_ms": end_seg["end_ms"] - start_seg["start_ms"],
            "reasoning": clip.get("reasoning", ""),
            "viral_score": float(clip.get("viral_score", 5.0)),
            "platform": clip.get("platform", "tiktok"),
            "caption": clip.get("caption", ""),
        })

    state["clip_recommendations"] = recommendations
    state["status"] = "clips_generated"
    return state
