import json
import logging
from src.graph.state import ClipAnalysisState
from src.llm.deepseek import get_llm
from src.graph.prompts.clip_analysis import SCRIPT_BUILDER_PROMPT

logger = logging.getLogger(__name__)


def script_builder(state: ClipAnalysisState) -> ClipAnalysisState:
    scored = state["scored_moments"]
    segments = state["transcript_segments"]
    project_id = state["project_id"]

    logger.info(f"[PROJECT:{project_id}] ╔══ NODE 4/4: SCRIPT BUILDER — Generate publishing package ══╗")

    if len(scored) == 0:
        logger.info(f"[PROJECT:{project_id}] ╚══ Tidak ada momen untuk dibuat script ══╝")
        state["clip_scripts"] = []
        state["status"] = "complete"
        return state

    logger.info(f"[PROJECT:{project_id}] ├─ Membuat title, hook, caption, text_overlays, platform untuk {len(scored)} clip")

    scored_json = json.dumps(
        [{k: v for k, v in s.items() if k != "start_ms" and k != "end_ms"}
         for s in scored],
        indent=2,
    )
    segments_json = json.dumps(
        [{"index": s["index"], "text": s["text"]} for s in segments],
        indent=2,
    )

    prompt = SCRIPT_BUILDER_PROMPT.replace("{scored_moments}", scored_json).replace("{segments}", segments_json)
    logger.info(f"[PROJECT:{project_id}] ├─ Mengirim prompt ke LLM ({len(prompt)} chars)")

    llm = get_llm(temperature=0.8)
    response = llm.invoke(prompt)
    content = response.content.strip()

    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        raw_scripts = json.loads(content)
        if not isinstance(raw_scripts, list):
            raise ValueError("Expected array")
    except (json.JSONDecodeError, ValueError):
        logger.warning(f"[PROJECT:{project_id}] ├─ Gagal parse LLM response, pakai fallback scripts")
        raw_scripts = []

    scripts = []
    for i, s in enumerate(scored):
        script = raw_scripts[i] if i < len(raw_scripts) else {}
        scripts.append({
            "title": script.get("title", s["title"]),
            "start_sentence_index": s["start_sentence_index"],
            "end_sentence_index": s["end_sentence_index"],
            "start_ms": s["start_ms"],
            "end_ms": s["end_ms"],
            "duration_ms": s["end_ms"] - s["start_ms"],
            "hook_suggestion": script.get("hook_suggestion", ""),
            "caption": script.get("caption", ""),
            "text_overlays": script.get("text_overlays", []),
            "platform": script.get("platform", "tiktok"),
            "viral_score": float(script.get("viral_score", s["total_score"])),
            "moment_type": s["moment_type"],
            "reasoning": script.get("reasoning", s["reasoning"]),
        })

    scripts.sort(key=lambda s: s["viral_score"], reverse=True)
    scripts = [s for s in scripts if s["viral_score"] >= 4.0]

    logger.info(f"[PROJECT:{project_id}] ├─ {len(scripts)} clip final siap (filtered by viral_score >= 4.0)")
    for i, s in enumerate(scripts):
        dur = s["duration_ms"] // 1000
        logger.info(f"[PROJECT:{project_id}] │  [{i+1}] \"{s['title'][:60]}\" | [{s['moment_type']}] | viral={s['viral_score']:.1f} | {dur}s | {s['platform']}")
        if s["hook_suggestion"]:
            logger.info(f"[PROJECT:{project_id}] │       hook: \"{s['hook_suggestion'][:80]}\"")
        if s["caption"]:
            logger.info(f"[PROJECT:{project_id}] │       caption: \"{s['caption'].replace(chr(10), ' ')[:100]}\"")

    logger.info(f"[PROJECT:{project_id}] ╚══ PIPELINE SELESAI — {len(scripts)} clip siap di-edit! ══╝")

    state["clip_scripts"] = scripts
    state["status"] = "complete"
    return state
