from langgraph.graph import StateGraph, END
from src.graph.state import ClipAnalysisState
from src.graph.nodes.process_transcript import process_transcript
from src.graph.nodes.score_engagement import score_engagement
from src.graph.nodes.cluster_sentences import cluster_sentences
from src.graph.nodes.generate_clips import generate_clips
from src.graph.nodes.rank_clips import rank_clips
from src.graph.nodes.reflect import reflect


def should_continue(state: ClipAnalysisState) -> str:
    if state["status"] == "revising":
        return "generate_clips"
    return END


def build_clip_analyzer_graph() -> StateGraph:
    graph = StateGraph(ClipAnalysisState)

    graph.add_node("process_transcript", process_transcript)
    graph.add_node("score_engagement", score_engagement)
    graph.add_node("cluster_sentences", cluster_sentences)
    graph.add_node("generate_clips", generate_clips)
    graph.add_node("rank_clips", rank_clips)
    graph.add_node("reflect", reflect)

    graph.set_entry_point("process_transcript")
    graph.add_edge("process_transcript", "score_engagement")
    graph.add_edge("score_engagement", "cluster_sentences")
    graph.add_edge("cluster_sentences", "generate_clips")
    graph.add_edge("generate_clips", "rank_clips")
    graph.add_edge("rank_clips", "reflect")

    graph.add_conditional_edges("reflect", should_continue)

    return graph.compile()


clip_analyzer = build_clip_analyzer_graph()
