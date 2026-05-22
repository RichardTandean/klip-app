import json
from src.graph.state import ClipAnalysisState
from src.llm.deepseek import get_llm
from src.graph.prompts.clip_analysis import CLUSTER_PROMPT


def cluster_sentences(state: ClipAnalysisState) -> ClipAnalysisState:
    scored = state["scored_segments"]

    if len(scored) <= 5:
        state["candidate_clusters"] = [{
            "start_index": 0,
            "end_index": len(scored) - 1,
            "duration_ms": scored[-1]["end_ms"] - scored[0]["start_ms"],
            "avg_score": sum(s["engagement_score"] for s in scored) / len(scored),
        }]
        state["status"] = "clustered"
        return state

    scored_json = json.dumps(
        [{"index": s["index"], "score": s["engagement_score"], "text": s["text"], "estimated_duration_ms": s["end_ms"] - s["start_ms"]}
         for s in scored],
        indent=2,
    )

    prompt = CLUSTER_PROMPT.format(scored_segments=scored_json)

    llm = get_llm(temperature=0.4)
    response = llm.invoke(prompt)
    content = response.content.strip()

    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        clusters = json.loads(content)
        if not isinstance(clusters, list):
            raise ValueError("Expected array")
    except (json.JSONDecodeError, ValueError):
        clusters = [{
            "start_index": 0,
            "end_index": len(scored) - 1,
            "duration_ms": scored[-1]["end_ms"] - scored[0]["start_ms"],
            "avg_score": 5.0,
        }]

    for c in clusters:
        c["duration_ms"] = c.get("duration_ms", 60000)

    state["candidate_clusters"] = clusters
    state["status"] = "clustered"
    return state
