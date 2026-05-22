from src.graph.state import ClipAnalysisState


def process_transcript(state: ClipAnalysisState) -> ClipAnalysisState:
    segments = state["transcript_segments"]
    cleaned = []

    for seg in segments:
        text = seg["text"].strip()
        if not text or len(text) < 3:
            continue
        cleaned.append(seg)

    state["cleaned_segments"] = cleaned
    state["status"] = "transcript_processed"
    return state
