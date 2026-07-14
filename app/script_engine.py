"""Reel script generation from a company's brand profile and a
per-piece content brief — the best possible script for the stated idea
and goal, no gate in front of it."""

import json

from anthropic import Anthropic

MODEL = "claude-opus-4-8"

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

SCRIPT_SYSTEM_PROMPT = """You are the script-writing engine for Pulse. Your job is to do \
the best possible job writing a ready-to-film reel script for the specific idea the \
company gave you, in the brand's own voice (tone, personality, words to use/avoid, and any \
constraints from the brand profile), optimized to achieve the stated goal for this post.

Structure the script by seconds:

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
- "why_it_works": one short paragraph explaining why this script should work for the \
stated goal, referencing the specific hook/format/tone choices made.

Never invent brand facts that are not present in the brand profile. Respect every \
constraint in the profile (forbidden claims, legal restrictions, mandatory CTA, words to \
avoid). Write in the same language as the brand profile and topic."""

REVISE_SYSTEM_PROMPT = """You are the script-editing engine for Pulse. The user already \
has a full reel script and wants exactly one moment of it revised based on their specific \
instruction — everything else in the script is context for continuity, not something \
you're rewriting.

Read the full existing script to keep tone, pacing, and any references between moments \
consistent, then rewrite ONLY the requested moment according to the user's instruction. \
Keep roughly the same time range unless the instruction explicitly asks to change pacing \
or duration. Stay in the brand's voice and respect every constraint in the brand profile \
(forbidden claims, legal restrictions, words to avoid). Never invent brand facts not \
present in the profile. Write in the same language as the rest of the script."""


class ScriptGenerationRefused(RuntimeError):
    pass


def _brief_to_text(brief: dict) -> str:
    return (
        f"Goal: {brief.get('goal_label', '')} — {brief.get('goal_description', '')}\n"
        f"Platform: {brief.get('platform', '')}\n"
        f"Topic for this specific piece of content: {brief.get('topic', '')}\n"
        f"Preferred duration: {brief.get('duration') or 'no preference stated'}"
    )


def generate_script(profile: dict, brief: dict) -> dict:
    client = Anthropic()

    user_content = (
        f"Brand profile (JSON):\n{json.dumps(profile, ensure_ascii=False)}\n\n"
        f"Content brief:\n{_brief_to_text(brief)}\n\n"
        "Write the best possible reel script for this idea now."
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


def revise_moment(
    profile: dict, brief: dict, script: dict, moment_key: str, instruction: str
) -> dict:
    if moment_key not in MOMENT_KEYS:
        raise ValueError(f"Unknown moment key: {moment_key}")

    client = Anthropic()

    user_content = (
        f"Brand profile (JSON):\n{json.dumps(profile, ensure_ascii=False)}\n\n"
        f"Content brief:\n{_brief_to_text(brief)}\n\n"
        f"Full current script (JSON):\n{json.dumps(script, ensure_ascii=False)}\n\n"
        f"Revise only the '{moment_key}' moment. The user's instruction for this change:\n"
        f"{instruction}"
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        output_config={"effort": "medium", "format": {"type": "json_schema", "schema": _moment_schema()}},
        system=REVISE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    if response.stop_reason == "refusal":
        raise ScriptGenerationRefused("El modelo no pudo ajustar esta parte del guión.")

    text_block = next(b for b in response.content if b.type == "text")
    return json.loads(text_block.text)
