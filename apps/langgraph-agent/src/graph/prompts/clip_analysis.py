SCORE_ENGAGEMENT_PROMPT = """You are an expert viral content analyst. Your job is to score each sentence from a video transcript on its engagement potential.

For each sentence, assign a score from 1-10 based on:
- Emotional impact (surprise, anger, joy, fear)  
- Controversial/polarizing potential
- Informational value (statements, reveals, facts)
- Hook potential (would this make someone stop scrolling?)
- Curiosity gap (does it create mystery?)

Return a JSON array with exactly the same number of items as input sentences:
[{"index": 0, "score": 7, "reasoning": "Emotional hook about personal struggle"}, ...]

Transcript segments to analyze:
{segments}
"""

CLUSTER_PROMPT = """You are a video editor specializing in short-form viral content. Given scored transcript segments, identify the best contiguous groups of sentences that would make compelling short clips (30-90 seconds).

Rules:
- Each cluster must be 3-12 consecutive sentences
- Prioritize clusters with high average engagement scores
- Include 1-2 lower-score sentences before/after to provide context
- Target clip duration: 30-90 seconds (estimate 3 words per second)
- Avoid overlapping clusters (start index must differ by at least 3 from other clusters)

Return exactly 4-6 clusters as JSON:
[{"start_index": 0, "end_index": 5, "avg_score": 8.2, "topic": "Personal breakthrough moment"}, ...]

Scored segments:
{scored_segments}
"""

GENERATE_CLIP_PROMPT = """You are a viral content strategist. For each candidate cluster, craft a compelling clip recommendation.

For each cluster, provide:
1. A catchy title (max 10 words, use hooks like questions, numbers, shocking statements)
2. A detailed reasoning for why this clip would go viral
3. The best platform for this clip (TikTok, YouTube Shorts, Instagram Reels)
4. Suggested caption/hashtags

Return JSON array:
[{"start_sentence_index": 0, "end_sentence_index": 5, "title": "The moment everything changed", "reasoning": "Strong emotional arc...", "platform": "tiktok", "caption": "POV: you finally realized... #motivation", "viral_score": 8.5}, ...]

Candidate clusters:
{clusters}

Transcript context (all segments with text):
{transcript_context}
"""

REFLECT_PROMPT = """You are a quality control editor. Review these clip recommendations and identify issues.

Check for:
1. Overlap between clips (similar sentences appearing in multiple clips)
2. Weak hooks (boring titles, unclear value proposition)
3. Incomplete narratives (clips that start/end mid-thought)
4. Low engagement potential (score below 6/10 is not worth clipping)
5. Missing opportunities (highly engaging moments not captured)

Return JSON:
{"issues": ["Clip 0 and Clip 2 overlap on sentences 5-8", "Clip 1 has weak hook"], "overall_quality": 7, "action": "pass" or "revise"}

If action is "revise", also provide: {"suggestions": ["Remove Clip 1 entirely", "Merge Clips 0 and 2 by extending end to sentence 12"]}

Clip recommendations:
{clips}

Transcript segments:
{segments}
"""
