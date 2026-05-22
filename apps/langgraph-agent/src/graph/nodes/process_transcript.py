from src.graph.state import ClipAnalysisState


def process_transcript(state: ClipAnalysisState) -> ClipAnalysisState:
    segments = state["transcript_segments"]
    cleaned = []

    for seg in segments:
        text = seg["text"].strip()
        if not text or len(text) < 3:
            continue
        cleaned.append(seg)

    merged: list[dict] = []
    buffer = ""
    buf_start_ms = 0
    buf_end_ms = 0
    buf_index = 0

    for i, seg in enumerate(cleaned):
        text = seg["text"].strip()

        if not buffer:
            buffer = text
            buf_start_ms = seg["start_ms"]
            buf_end_ms = seg["end_ms"]
            buf_index = seg["index"]
            continue

        if len(buffer.split()) + len(text.split()) < 8:
            buffer += " " + text
            buf_end_ms = seg["end_ms"]
            continue

        merged.append({
            "index": buf_index,
            "text": buffer,
            "start_ms": buf_start_ms,
            "end_ms": buf_end_ms,
        })

        buffer = text
        buf_start_ms = seg["start_ms"]
        buf_end_ms = seg["end_ms"]
        buf_index = seg["index"]

    if buffer:
        merged.append({
            "index": buf_index,
            "text": buffer,
            "start_ms": buf_start_ms,
            "end_ms": buf_end_ms,
        })

    state["cleaned_segments"] = merged
    state["status"] = "transcript_processed"
    return state
