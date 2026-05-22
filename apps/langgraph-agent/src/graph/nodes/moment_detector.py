import json
import logging
from src.graph.state import ClipAnalysisState
from src.llm.deepseek import get_llm
from src.graph.prompts.clip_analysis import MOMENT_DETECTOR_PROMPT

logger = logging.getLogger(__name__)


def moment_detector(state: ClipAnalysisState) -> ClipAnalysisState:
    insights = state["insights"]
    segments = state["transcript_segments"]
    project_id = state["project_id"]

    logger.info(f"[PROJECT:{project_id}] ╔══ NODE 2/4: MOMENT DETECTOR — Mencari clip-worthy moments ══╗")
    logger.info(f"[PROJECT:{project_id}] ├─ Transcript tone: {insights.get('tone', 'N/A')}")
    logger.info(f"[PROJECT:{project_id}] ├─ Speaker style: {insights.get('speaker_style', 'N/A')}")
    logger.info(f"[PROJECT:{project_id}] ├─ Mencari semua momen: emotional_peak, strong_insight, funny_moment, conflict_tension, story_climax, hookable_opener, actionable_tip")

    insights_json = json.dumps(insights, indent=2)
    segments_json = json.dumps(
        [{"index": s["index"], "text": s["text"], "start_ms": s["start_ms"], "end_ms": s["end_ms"]}
         for s in segments],
        indent=2,
    )

    prompt = MOMENT_DETECTOR_PROMPT.replace("{insights}", insights_json).replace("{segments}", segments_json)
    logger.info(f"[PROJECT:{project_id}] ├─ Mengirim prompt ke LLM ({len(prompt)} chars)")

    llm = get_llm(temperature=0.7)
    response = llm.invoke(prompt)
    content = response.content.strip()

    logger.info(f"[PROJECT:{project_id}] ├─ LLM raw response length: {len(content)} chars")

    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        raw_moments = json.loads(content)
        if not isinstance(raw_moments, list):
            raise ValueError("Expected array")
    except (json.JSONDecodeError, ValueError):
        logger.error(f"[PROJECT:{project_id}] ├─ Gagal parse LLM response!")
        state["clip_moments"] = []
        state["status"] = "moments_detected"
        logger.info(f"[PROJECT:{project_id}] ╚══ MOMENT DETECTOR SELESAI — 0 momen ditemukan ══╝")
        return state

    logger.info(f"[PROJECT:{project_id}] ├─ LLM mendeteksi {len(raw_moments)} momen mentah")

    seg_by_index = {s["index"]: s for s in segments}
    moments = []
    rejected = {"too_short": 0, "too_long": 0}

    for m in raw_moments:
        start_idx = int(m.get("start_sentence_index", 0))
        end_idx = int(m.get("end_sentence_index", 0))

        start_seg = seg_by_index.get(start_idx, segments[0])
        end_seg = seg_by_index.get(end_idx, segments[-1])

        duration_ms = end_seg["end_ms"] - start_seg["start_ms"]
        if duration_ms < 10000:
            rejected["too_short"] += 1
            continue
        if duration_ms > 180000:
            rejected["too_long"] += 1
            continue

        moments.append({
            "title": m.get("title", "Untitled Moment"),
            "moment_type": m.get("moment_type", "strong_insight"),
            "start_sentence_index": start_seg["index"],
            "end_sentence_index": end_seg["index"],
            "start_ms": start_seg["start_ms"],
            "end_ms": end_seg["end_ms"],
            "description": m.get("description", ""),
        })

    logger.info(f"[PROJECT:{project_id}] ├─ Setelah filter durasi: {len(moments)} momen valid")
    if rejected["too_short"] > 0:
        logger.info(f"[PROJECT:{project_id}] ├─ {rejected['too_short']} momen direject (terlalu pendek <10s)")
    if rejected["too_long"] > 0:
        logger.info(f"[PROJECT:{project_id}] ├─ {rejected['too_long']} momen direject (terlalu panjang >180s)")

    for i, m in enumerate(moments):
        dur = (m["end_ms"] - m["start_ms"]) // 1000
        logger.info(f"[PROJECT:{project_id}] │  [{i+1}] [{m['moment_type']}] {m['title']} | seg {m['start_sentence_index']}-{m['end_sentence_index']} | {dur}s")

    logger.info(f"[PROJECT:{project_id}] ╚══ MOMENT DETECTOR SELESAI → {len(moments)} momen diteruskan ke Scorer ══╝")

    state["clip_moments"] = moments
    state["status"] = "moments_detected"
    return state
