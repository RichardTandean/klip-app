from langgraph.graph import StateGraph, END
from src.graph.state import ClipAnalysisState
from src.graph.nodes.analyzer import analyzer
from src.graph.nodes.moment_detector import moment_detector
from src.graph.nodes.clip_scorer import clip_scorer
from src.graph.nodes.script_builder import script_builder


def build_clip_analyzer_graph() -> StateGraph:
    graph = StateGraph(ClipAnalysisState)

    graph.add_node("analyzer", analyzer)
    graph.add_node("moment_detector", moment_detector)
    graph.add_node("clip_scorer", clip_scorer)
    graph.add_node("script_builder", script_builder)

    graph.set_entry_point("analyzer")
    graph.add_edge("analyzer", "moment_detector")
    graph.add_edge("moment_detector", "clip_scorer")
    graph.add_edge("clip_scorer", "script_builder")
    graph.add_edge("script_builder", END)

    return graph.compile()


clip_analyzer = build_clip_analyzer_graph()
