ANALYZER_PROMPT = """You are a world-class video editor and content analyst. Analyze this entire video transcript and provide a comprehensive breakdown.

Return a JSON object with these fields:

1. **topic**: Main topic/subject of the video (1 sentence)
2. **tone**: Overall tone — choose from: educational, motivational, storytelling, controversial, comedic, interview, tutorial, documentary, vlog, debate
3. **speaker_style**: Description of the speaker's style (e.g., "fast-paced and energetic", "calm and authoritative", "casual and relatable")
4. **key_themes**: List of 3-5 major themes discussed
5. **narrative_arc**: Brief description of the story structure (beginning, middle, end)
6. **total_duration_ms**: Total video duration in milliseconds

Transcript to analyze:
{segments}

Return only valid JSON, no markdown:
{{"topic": "...", "tone": "...", "speaker_style": "...", "key_themes": [...], "narrative_arc": "...", "total_duration_ms": 0}}
"""


MOMENT_DETECTOR_PROMPT = """You are a viral content editor with expertise in TikTok, YouTube Shorts, and Instagram Reels. Your job is to find EVERY clip-worthy moment in this transcript.

Using the transcript analysis and the full transcript below, identify ALL moments that could become compelling short clips (15-120 seconds).

## Types of moments to look for:

- **emotional_peak**: Highly emotional moments — crying, anger, joy, shock, revelation
- **strong_insight**: "Aha!" moments, valuable lessons, unique perspectives, life advice
- **funny_moment**: Humor, jokes, funny stories, unexpected punchlines
- **conflict_tension**: Arguments, confrontations, controversial statements, hot takes
- **story_climax**: Peak of a narrative story, plot twist, dramatic reveal
- **hookable_opener**: Strong opening statements that grab attention immediately
- **actionable_tip**: Clear, practical advice or step-by-step instructions

## Rules:
- Each moment must span 3-15 consecutive sentences
- Do NOT limit the number — find ALL viable moments
- Include enough sentences before/after for context
- Avoid moments shorter than 15 seconds or longer than 120 seconds

## Transcript Analysis:
{insights}

## Full Transcript:
{segments}

Return a JSON array of ALL clip-worthy moments. Do NOT limit the count:
[{{"moment_type": "emotional_peak", "title": "The moment he realized...", "start_sentence_index": 5, "end_sentence_index": 12, "description": "Speaker breaks down describing his lowest point..."}}, ...]
"""


CLIP_SCORER_PROMPT = """You are a viral content scoring expert. Score each clip moment on these four dimensions (each 0-10):

1. **hook_score**: Would this make someone stop scrolling in the first 3 seconds?
2. **emotional_score**: Emotional impact — does it make people feel something strongly?
3. **completeness_score**: Does this moment work as a standalone clip, or does it need too much external context?
4. **retention_score**: How likely are viewers to watch the entire clip (based on pacing, curiosity gap, payoff)?

For each moment, provide a clear reasoning. Total score is the average of the four dimensions.

## Clip Moments to score:
{moments}

## Full Transcript (for context):
{segments}

Return a JSON array with the same number of items:
[{{"moment_type": "emotional_peak", "title": "...", "start_sentence_index": 5, "end_sentence_index": 12, "description": "...", "hook_score": 8.5, "emotional_score": 9.0, "completeness_score": 7.0, "retention_score": 8.0, "total_score": 8.1, "reasoning": "Strong emotional opener..."}}, ...]
"""


SCRIPT_BUILDER_PROMPT = """You are a viral content strategist and copywriter. For each scored clip moment, create a complete publishing package ready for multiple platforms.

For each clip moment, generate:

1. **title**: Catchy, clickable title (max 12 words — use power words, numbers, questions)
2. **hook_suggestion**: The first 3-5 seconds hook (what text/caption should overlay at the start)
3. **caption**: Full caption with emojis, call to action, and hashtags
4. **text_overlays**: 2-4 text overlay suggestions for key moments within the clip
5. **platform**: Best platform for this clip (tiktok, youtube_shorts, instagram_reels, all)
6. **viral_score**: Projected viral potential (1-10) considering the scores + current platform trends

## Scored Moments:
{scored_moments}

## Full Transcript (for context):
{segments}

Return a JSON array with the same number of items:
[{{"title": "This One Realization Changed Everything", "hook_suggestion": "Wait until you hear what he says at 0:30...", "caption": "POV: you finally understand why you've been stuck 🔥\\n\\nDrop a 💯 if this hit different\\n\\n#motivation #mindset #lifeadvice", "text_overlays": ["He was broke 3 years ago...", "Then one conversation changed everything", "This is what he learned 👇"], "platform": "tiktok", "viral_score": 8.7, "moment_type": "emotional_peak", "reasoning": "Universal struggle theme with clear payoff"}}, ...]
"""
