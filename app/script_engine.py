"""Viral Engine scoring + reel script generation.

Two-step pipeline, matching the Pulse PRD: score the concept against 10
criteria *before* writing anything (a strict, low-effort gate — not a
creative step), and only draft the actual script once the concept clears
the 70/100 threshold.
"""

import json
from typing import Optional

from anthropic import Anthropic

MODEL = "claude-opus-4-8"

VIRAL_CRITERIA = [
    "clarity",
    "curiosity",
    "emotion",
    "shareability",
    "save_worthiness",
    "conversation_potential",
    "simplicity",
    "novelty",
    "authority",
    "hook_strength",
]

SCORE_SCHEMA = {
    "type": "object",
    "properties": {
        crit: {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "note": {"type": "string"},
            },
            "required": ["score", "note"],
            "additionalProperties": False,
        }
        for crit in VIRAL_CRITERIA
    },
    "required": VIRAL_CRITERIA,
    "additionalProperties": False,
}

SCORE_SYSTEM_PROMPT = """You are the Viral Engine for Pulse, a tool that turns a brand \
profile and a specific content brief into a ready-to-film reel script. Before any script \
gets written, you evaluate the concept against 10 criteria, each scored 1-10: clarity, \
curiosity, emotion, shareability, save-worthiness (save_worthiness), conversation \
potential, simplicity (one idea only), novelty, authority, and hook strength.

Score the concept itself — the specific topic, goal, and platform given — not the brand \
in general. Be a strict, consistent grader: the same concept should reliably score close \
to the same way every time, and a mediocre or generic concept should land in the 40s-60s, \
not get inflated into the 70s+ range just to be encouraging. Reserve 80+ scores for \
concepts that are genuinely sharp.

For each criterion:
- If the score is 7 or higher, the note is a one-line reason it works.
- If the score is below 7, the note is one concrete, actionable suggestion for how this \
specific concept could improve on that criterion — not generic advice."""

MOMENT_FIELDS = ["time", "visual", "script"]
MOMENT_KEYS = ["hook", "beat_1", "beat_2", "beat_3", "beat_4", "cta"]


def _moment_schema() -> dict:
    return {
        "type": "object",
        "properties": {field: {"type": "string"} for field in MOMENT_FIELDS},
        "required": MOMENT_FIELDS,
        "additionalProperties": False,
    }


SCRIPT_SCHEMA = {
    "type": "object",
    "properties": {
        **{key: _moment_schema() for key in MOMENT_KEYS},
        "pattern_interrupts": {"type": "string"},
        "why_it_works": {"type": "string"},
    },
    "required": [*MOMENT_KEYS, "pattern_interrupts", "why_it_works"],
    "additionalProperties": False,
}

SCRIPT_SYSTEM_PROMPT = """You are the script-writing engine for Pulse. This concept already \
scored 70+ on the Viral Engine, so your job now is to write the actual reel script in the \
brand's own voice (tone, personality, words to use/avoid, and any constraints from the \
brand profile), structured by seconds:

- hook (0-2s): stop the scroll — a question, bold claim, or surprising visual. Never open \
with "Hi" or a generic greeting.
- beat_1 (roughly 2-7s): create curiosity — make the viewer think "I need to know this."
- beat_2 (roughly 7-20s): deliver the core value — one idea, no filler.
- beat_3 (roughly 20-35s): proof — a demo, story, or real case backing up beat_2.
- beat_4 (optional — only include it if the requested duration needs a 4th beat; \
otherwise leave every field of beat_4 as an empty string "").
- cta (closing): one memorable takeaway, then a call to action tailored to the stated \
goal — branding goals get a memorable close, follower/community goals show a \
transformation, lead-generation goals solve 80% of the problem and hold back 20%, and \
sales goals sell the problem before the solution.

Adjust the number of active beats and each moment's time range to roughly fit the \
requested duration (default to about 40-45 seconds total if no duration preference was \
given).

For every moment (hook, beat_1-4, cta) fill in:
- "time": the approximate time range, e.g. "0:00-0:04"
- "visual": a short direction for what's on screen (action, visual, or camera note)
- "script": the actual words to say on camera

Also fill in:
- "pattern_interrupts": suggested pattern-interrupts (cut, zoom, text overlay, B-roll, \
emotion or pace change) roughly every 3-5 seconds, as a "; "-separated list of short cues \
tied to approximate timestamps.
- "why_it_works": one short paragraph explaining why this script should work, referencing \
the specific hook/format/tone choices made.

Never invent brand facts that are not present in the brand profile. Respect every \
constraint in the profile (forbidden claims, legal restrictions, mandatory CTA, words to \
avoid). Write in the same language as the brand profile and topic."""


class ScriptGenerationRefused(RuntimeError):
    pass


def _brief_to_text(brief: dict) -> str:
    return (
        f"Goal: {brief.get('goal_label', '')} — {brief.get('goal_description', '')}\n"
        f"Platform: {brief.get('platform', '')}\n"
        f"Topic for this specific piece of content: {brief.get('topic', '')}\n"
        f"Preferred duration: {brief.get('duration') or 'no preference stated'}"
    )


def total_score(scores: dict) -> int:
    return sum(scores[crit]["score"] for crit in VIRAL_CRITERIA)


def score_concept(profile: dict, brief: dict) -> dict:
    client = Anthropic()

    user_content = (
        f"Brand profile (JSON):\n{json.dumps(profile, ensure_ascii=False)}\n\n"
        f"Content brief for this specific piece:\n{_brief_to_text(brief)}\n\n"
        "Score this concept against the 10 Viral Engine criteria before any script is written."
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCORE_SCHEMA}},
        system=SCORE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    if response.stop_reason == "refusal":
        raise ScriptGenerationRefused("El modelo no pudo evaluar este contenido.")

    text_block = next(b for b in response.content if b.type == "text")
    scores = json.loads(text_block.text)

    for crit in VIRAL_CRITERIA:
        scores[crit]["score"] = max(1, min(10, int(scores[crit]["score"])))

    return scores


def generate_script(profile: dict, brief: dict, scores: dict) -> dict:
    client = Anthropic()

    user_content = (
        f"Brand profile (JSON):\n{json.dumps(profile, ensure_ascii=False)}\n\n"
        f"Content brief:\n{_brief_to_text(brief)}\n\n"
        f"Viral Engine scores (already passed the 70+ gate):\n"
        f"{json.dumps(scores, ensure_ascii=False)}\n\n"
        "Write the reel script now."
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=10000,
        thinking={"type": "adaptive"},
        output_config={"effort": "high", "format": {"type": "json_schema", "schema": SCRIPT_SCHEMA}},
        system=SCRIPT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    if response.stop_reason == "refusal":
        raise ScriptGenerationRefused("El modelo no pudo generar el guión para este contenido.")

    text_block = next(b for b in response.content if b.type == "text")
    return json.loads(text_block.text)
