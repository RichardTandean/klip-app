import json
import logging
from src.graph.state import ClipAnalysisState
from src.llm.deepseek import get_llm
from src.graph.prompts.clip_analysis import CLIP_SCORER_PROMPT

logger = logging.getLogger(__name__)


def clip_scorer(state: ClipAnalysisState) -> ClipAnalysisState:
    moments = state["clip_moments"]
    segments = state["transcript_segments"]
    project_id = state["project_id"]

    logger.info(f"[PROJECT:{project_id}] ╔══ NODE 3/4: CLIP SCORER — Scoring {len(moments)} momen ══╗")

    if len(moments) == 0:
        logger.info(f"[PROJECT:{project_id}] ╚══ Tidak ada momen untuk di-score ══╝")
        state["scored_moments"] = []
        state["status"] = "scored"
        return state

    logger.info(f"[PROJECT:{project_id}] ├─ Scoring dimensi: hook, emotional, completeness, retention (0-10 each)")

    moments_json = json.dumps(moments, indent=2)
    segments_json = json.dumps(
        [{"index": s["index"], "text": s["text"]} for s in segments],
        indent=2,
    )

    prompt = CLIP_SCORER_PROMPT.replace("{moments}", moments_json).replace("{segments}", segments_json)
    logger.info(f"[PROJECT:{project_id}] ├─ Mengirim prompt ke LLM ({len(prompt)} chars)")

    llm = get_llm(temperature=0.4)
    response = llm.invoke(prompt)
    content = response.content.strip()

    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        raw_scores = json.loads(content)
        if not isinstance(raw_scores, list):
            raise ValueError("Expected array")
    except (json.JSONDecodeError, ValueError):
        logger.warning(f"[PROJECT:{project_id}] ├─ Gagal parse LLM response, pakai default scores")
        raw_scores = []

    scored = []
    for i, m in enumerate(moments):
        match = raw_scores[i] if i < len(raw_scores) else {}
        scored.append({
            **m,
            "hook_score": float(match.get("hook_score", 5.0)),
            "emotional_score": float(match.get("emotional_score", 5.0)),
            "completeness_score": float(match.get("completeness_score", 5.0)),
            "retention_score": float(match.get("retention_score", 5.0)),
            "total_score": float(match.get("total_score", 5.0)),
            "reasoning": match.get("reasoning", ""),
        })

    scored.sort(key=lambda s: s["total_score"], reverse=True)

    for i, s in enumerate(scored):
        logger.info(f"[PROJECT:{project_id}] │  [{i+1}] {s['title'][:60]} | total={s['total_score']:.1f} | hook={s['hook_score']:.1f} emo={s['emotional_score']:.1f} comp={s['completeness_score']:.1f} ret={s['retention_score']:.1f}")

    top = scored[0] if scored else None
    if top:
        logger.info(f"[PROJECT:{project_id}] ├─ Top score: \"{top['title'][:60]}\" — {top['total_score']:.1f}/10 (reasoning: {top.get('reasoning', 'N/A')[:120]})")

    logger.info(f"[PROJECT:{project_id}] ╚══ CLIP SCORER SELESAI → lanjut ke Script Builder ══╝")

    state["scored_moments"] = scored
    state["status"] = "scored"
    return state
