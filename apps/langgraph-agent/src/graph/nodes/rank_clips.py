from src.graph.state import ClipAnalysisState


def rank_clips(state: ClipAnalysisState) -> ClipAnalysisState:
    clips = state["clip_recommendations"]

    ranked = sorted(clips, key=lambda c: c["viral_score"], reverse=True)
    ranked = [c for c in ranked if c["viral_score"] >= 5.0]
    ranked = ranked[:6]

    state["clip_recommendations"] = ranked
    state["status"] = "ranked"
    return state
