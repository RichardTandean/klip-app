from typing import TypedDict


class Segment(TypedDict):
    index: int
    text: str
    start_ms: int
    end_ms: int


class ClipMoment(TypedDict):
    title: str
    moment_type: str
    start_sentence_index: int
    end_sentence_index: int
    start_ms: int
    end_ms: int
    description: str


class ScoredMoment(ClipMoment):
    hook_score: float
    emotional_score: float
    completeness_score: float
    retention_score: float
    total_score: float
    reasoning: str


class ClipScript(TypedDict):
    title: str
    start_sentence_index: int
    end_sentence_index: int
    start_ms: int
    end_ms: int
    duration_ms: int
    hook_suggestion: str
    caption: str
    text_overlays: list[str]
    platform: str
    viral_score: float
    moment_type: str
    reasoning: str


class ClipAnalysisState(TypedDict):
    project_id: str
    transcript_segments: list[Segment]
    insights: dict
    clip_moments: list[ClipMoment]
    scored_moments: list[ScoredMoment]
    clip_scripts: list[ClipScript]
    status: str
    error: str | None
