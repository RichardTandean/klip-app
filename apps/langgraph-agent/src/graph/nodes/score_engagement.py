import json
from src.graph.state import ClipAnalysisState
from src.llm.deepseek import get_llm
from src.graph.prompts.clip_analysis import SCORE_ENGAGEMENT_PROMPT


def score_engagement(state: ClipAnalysisState) -> ClipAnalysisState:
    segments = state["cleaned_segments"]

    if len(segments) <= 3:
        scored = [
            {**seg, "engagement_score": 7.0, "reasoning": "Default (too few segments)"}
            for seg in segments
        ]
        state["scored_segments"] = scored
        state["status"] = "engagement_scored"
        return state

    segments_text = json.dumps(segments, indent=2)
    prompt = SCORE_ENGAGEMENT_PROMPT.format(segments=segments_text)

    llm = get_llm(temperature=0.3)
    response = llm.invoke(prompt)
    content = response.content.strip()

    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        scores = json.loads(content)
        if not isinstance(scores, list):
            raise ValueError("Expected array")
    except (json.JSONDecodeError, ValueError):
        scored = [
            {**seg, "engagement_score": 5.0, "reasoning": "Failed to parse LLM response"}
            for seg in segments
        ]
        state["scored_segments"] = scored
        state["status"] = "engagement_scored"
        return state

    scored = []
    for seg in segments:
        match = next(
            (s for s in scores if s.get("index") == seg["index"]),
            None,
        )
        if match:
            scored.append({
                **seg,
                "engagement_score": float(match.get("score", 5)),
                "reasoning": match.get("reasoning", ""),
            })
        else:
            scored.append({
                **seg,
                "engagement_score": 5.0,
                "reasoning": "Not scored by LLM",
            })

    state["scored_segments"] = scored
    state["status"] = "engagement_scored"
    return state
