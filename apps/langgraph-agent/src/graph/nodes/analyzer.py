import json
import logging
from src.graph.state import ClipAnalysisState
from src.llm.deepseek import get_llm
from src.graph.prompts.clip_analysis import ANALYZER_PROMPT

logger = logging.getLogger(__name__)


def analyzer(state: ClipAnalysisState) -> ClipAnalysisState:
    segments = state["transcript_segments"]
    project_id = state["project_id"]

    logger.info(f"[PROJECT:{project_id}] ╔══ NODE 1/4: ANALYZER — Menganalisis transcript ══╗")
    logger.info(f"[PROJECT:{project_id}] ├─ Total segments: {len(segments)}")
    logger.info(f"[PROJECT:{project_id}] ├─ Durasi video: ~{segments[-1]['end_ms'] // 1000}s" if segments else "[PROJECT:{project_id}] ├─ No segments")

    segments_text = json.dumps(
        [{"index": s["index"], "text": s["text"], "start_ms": s["start_ms"], "end_ms": s["end_ms"]}
         for s in segments],
        indent=2,
    )

    prompt = ANALYZER_PROMPT.replace("{segments}", segments_text)
    logger.info(f"[PROJECT:{project_id}] ├─ Mengirim {len(prompt)} karakter prompt ke LLM (DeepSeek)")

    llm = get_llm(temperature=0.5)
    response = llm.invoke(prompt)
    content = response.content.strip()

    logger.info(f"[PROJECT:{project_id}] ├─ LLM response: {content[:300]}..." if len(content) > 300 else f"[PROJECT:{project_id}] ├─ LLM response: {content}")

    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        insights = json.loads(content)
        if not isinstance(insights, dict):
            raise ValueError("Expected object")
    except (json.JSONDecodeError, ValueError):
        logger.warning(f"[PROJECT:{project_id}] ├─ Gagal parse LLM response, pakai fallback")
        insights = {
            "topic": "Unknown",
            "tone": "educational",
            "speaker_style": "neutral",
            "key_themes": [],
            "narrative_arc": "Unknown",
            "total_duration_ms": segments[-1]["end_ms"] if segments else 0,
        }

    logger.info(f"[PROJECT:{project_id}] ├─ Topic: {insights.get('topic', 'N/A')}")
    logger.info(f"[PROJECT:{project_id}] ├─ Tone: {insights.get('tone', 'N/A')}")
    logger.info(f"[PROJECT:{project_id}] ├─ Speaker style: {insights.get('speaker_style', 'N/A')}")
    logger.info(f"[PROJECT:{project_id}] ├─ Key themes: {insights.get('key_themes', [])}")
    logger.info(f"[PROJECT:{project_id}] ├─ Narrative arc: {insights.get('narrative_arc', 'N/A')}")
    logger.info(f"[PROJECT:{project_id}] ╚══ ANALYZER SELESAI → lanjut ke Moment Detector ══╝")

    state["insights"] = insights
    state["status"] = "analyzed"
    return state
