from typing import TypedDict, NotRequired


class Segment(TypedDict):
    index: int
    text: str
    start_ms: int
    end_ms: int


class ScoredSegment(Segment):
    engagement_score: float
    reasoning: str


class Cluster(TypedDict):
    start_index: int
    end_index: int
    duration_ms: int
    avg_score: float


class ClipRecommendation(TypedDict):
    title: str
    start_sentence_index: int
    end_sentence_index: int
    start_ms: int
    end_ms: int
    duration_ms: int
    reasoning: str
    viral_score: float
    platform: NotRequired[str]
    caption: NotRequired[str]


class ClipAnalysisState(TypedDict):
    project_id: str
    transcript_segments: list[Segment]
    cleaned_segments: list[Segment]
    scored_segments: list[ScoredSegment]
    candidate_clusters: list[Cluster]
    clip_recommendations: list[ClipRecommendation]
    reflection_count: int
    status: str
    error: str | None
