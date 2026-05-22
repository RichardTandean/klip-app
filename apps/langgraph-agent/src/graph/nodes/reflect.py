import json
from src.graph.state import ClipAnalysisState, ClipRecommendation
from src.llm.deepseek import get_llm
from src.graph.prompts.clip_analysis import REFLECT_PROMPT


def reflect(state: ClipAnalysisState) -> ClipAnalysisState:
    clips = state["clip_recommendations"]
    segments = state["cleaned_segments"]
    reflection_count = state["reflection_count"]

    if len(clips) == 0:
        state["status"] = "complete"
        return state

    if reflection_count >= 2:
        state["status"] = "complete"
        return state

    clips_json = json.dumps([
        {k: v for k, v in c.items() if k != "platform" and k != "caption"}
        for c in clips
    ], indent=2)

    segments_json = json.dumps([
        {"index": s["index"], "text": s["text"]} for s in segments
    ], indent=2)

    prompt = REFLECT_PROMPT.format(clips=clips_json, segments=segments_json)

    llm = get_llm(temperature=0.2)
    response = llm.invoke(prompt)
    content = response.content.strip()

    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        result = json.loads(content)
        action = result.get("action", "pass")
    except (json.JSONDecodeError, ValueError):
        action = "pass"

    state["reflection_count"] += 1

    if action == "pass":
        state["status"] = "complete"
    else:
        state["status"] = "revising"

    return state
