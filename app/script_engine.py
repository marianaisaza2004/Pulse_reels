"""Viral Engine scoring + reel script generation.

Score the reel idea against 10 criteria before writing anything — a strict,
repeatable gate, not a creative step. If the idea doesn't score well, the
engine automatically sharpens the same angle and re-scores it (up to a few
rounds, aiming for as close to a perfect score as it can get), and only
drafts the actual script once the best attempt clears 70/100.
"""

import json

from anthropic import Anthropic

MODEL = "claude-haiku-4-5-20251001"

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
        **{
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
        "stronger_angle": {"type": "string"},
    },
    "required": [*VIRAL_CRITERIA, "stronger_angle"],
    "additionalProperties": False,
}

SCORE_SYSTEM_PROMPT = """You are the Viral Engine for Pulse. Before any script gets \
written, you evaluate the company's reel idea (their brand profile + the specific topic, \
goal, and platform in their content brief) against 10 criteria, each scored 0-10: clarity, \
curiosity, emotion, shareability, save-worthiness (save_worthiness), conversation \
potential, simplicity (one idea per video), novelty, authority, and hook strength.

Score the idea itself — this specific topic for this specific goal and platform — not the \
brand in general. Be a strict, consistent grader: the same idea should reliably score close \
to the same way every time, and a mediocre or generic idea should land in the 40s-60s, not \
get inflated into the 70s+ range just to be encouraging. Reserve 80+ scores for ideas that \
are genuinely sharp.

For each criterion:
- If the score is 7 or higher, the note is a one-line reason it works.
- If the score is below 7, the note is one concrete, actionable suggestion for how this \
specific idea could improve on that criterion — not generic advice.

Also fill in "stronger_angle": regardless of the score, suggest one concrete way to \
sharpen this SAME idea into a stronger angle — do not propose a different topic. Refine \
the specific hook, framing, or detail of what the company already gave you (e.g. make it \
more personal, more specific, more contrarian, add a concrete stake or number). One to two \
sentences."""


MIN_SCORE_TO_PRODUCE = 70
TARGET_SCORE = 97
MAX_REFINEMENT_ROUNDS = 2


def total_score(scores: dict) -> int:
    return sum(scores[crit]["score"] for crit in VIRAL_CRITERIA)


def refine_idea(profile: dict, brief: dict) -> dict:
    """Always try to push the idea as close to a perfect 100/100 as it can get:
    score it, then keep sharpening the same angle and re-scoring for a few
    rounds regardless of whether an earlier round already cleared the minimum
    to produce — it only stops early once a round lands within a couple points
    of perfect, or the round budget runs out. Always keeps the best-scoring
    attempt seen, even if a later round regresses. The 70-point minimum is
    applied afterward, purely to decide whether to write the script."""
    working_brief = dict(brief)
    best_scores = None
    best_total = -1
    best_brief = working_brief
    attempts = []

    for round_num in range(MAX_REFINEMENT_ROUNDS + 1):
        scores = score_concept(profile, working_brief)
        total = total_score(scores)
        attempts.append({"topic": working_brief["topic"], "total": total})

        if total > best_total:
            best_total = total
            best_scores = scores
            best_brief = dict(working_brief)

        if total >= TARGET_SCORE or round_num == MAX_REFINEMENT_ROUNDS:
            break

        working_brief = dict(working_brief)
        working_brief["topic"] = scores["stronger_angle"]

    return {
        "scores": best_scores,
        "total": best_total,
        "brief": best_brief,
        "attempts": attempts,
    }


IMPROVE_SYSTEM_PROMPT = """You are the Viral Engine for Pulse. The company already has a \
scored reel idea and wants to improve ONE specific criterion they're not happy with, even \
if the overall idea already cleared the minimum bar.

You'll receive: the brand profile, the current content brief (including the current topic/ \
angle), the full current score breakdown for all 10 criteria, which ONE criterion the \
company wants improved (with its current score and note), and an optional extra \
instruction from the company on where to focus.

Sharpen the SAME idea specifically to raise that one criterion — do not propose a \
different topic or abandon the current angle. Use the criterion's note as your starting \
point for what to fix, and factor in the company's extra instruction if they gave one. \
Try not to weaken the other criteria while you do this.

Return only the new topic/angle for this piece of content, one to two sentences, in the \
same language as the brief."""

IMPROVE_SCHEMA = {
    "type": "object",
    "properties": {"topic": {"type": "string"}},
    "required": ["topic"],
    "additionalProperties": False,
}


def improve_criterion(
    profile: dict,
    brief: dict,
    scores: dict,
    criterion: str,
    instruction: str = "",
) -> dict:
    """Sharpens the current idea to improve one specific criterion, re-scores it, and
    writes the script too if the new score clears the minimum to produce."""
    client = Anthropic()

    current_score = scores[criterion]["score"]
    current_note = scores[criterion]["note"]

    user_content = (
        f"Brand profile (JSON):\n{json.dumps(profile, ensure_ascii=False)}\n\n"
        f"Current content brief:\n{_brief_to_text(brief)}\n\n"
        f"Full current score breakdown (JSON):\n{json.dumps(scores, ensure_ascii=False)}\n\n"
        f"Criterion to improve: {criterion} (currently {current_score}/10)\n"
        f"Note on this criterion: {current_note}\n\n"
        f"Extra instruction from the company (optional): {instruction or 'none given'}"
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        output_config={"format": {"type": "json_schema", "schema": IMPROVE_SCHEMA}},
        system=IMPROVE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    if response.stop_reason == "refusal":
        raise ScriptGenerationRefused("The model couldn't improve this criterion.")

    text_block = next(b for b in response.content if b.type == "text")
    new_topic = json.loads(text_block.text)["topic"]

    new_brief = dict(brief)
    new_brief["topic"] = new_topic

    new_scores = score_concept(profile, new_brief)
    total = total_score(new_scores)
    produced = total >= MIN_SCORE_TO_PRODUCE

    result = {
        "topic": new_topic,
        "scores": new_scores,
        "total": total,
        "produced": produced,
    }

    if produced:
        result["script"] = generate_script(profile, new_brief)

    return result


def score_concept(profile: dict, brief: dict) -> dict:
    client = Anthropic()

    user_content = (
        f"Brand profile (JSON):\n{json.dumps(profile, ensure_ascii=False)}\n\n"
        f"Content brief for this specific piece:\n{_brief_to_text(brief)}\n\n"
        "Score this idea against the 10 Viral Engine criteria before any script is written."
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        output_config={"format": {"type": "json_schema", "schema": SCORE_SCHEMA}},
        system=SCORE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    if response.stop_reason == "refusal":
        raise ScriptGenerationRefused("The model couldn't evaluate this idea.")

    text_block = next(b for b in response.content if b.type == "text")
    scores = json.loads(text_block.text)

    for crit in VIRAL_CRITERIA:
        scores[crit]["score"] = max(0, min(10, int(scores[crit]["score"])))

    return scores


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
        output_config={"format": {"type": "json_schema", "schema": SCRIPT_SCHEMA}},
        system=SCRIPT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    if response.stop_reason == "refusal":
        raise ScriptGenerationRefused("The model couldn't generate a script for this content.")

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
        output_config={"format": {"type": "json_schema", "schema": _moment_schema()}},
        system=REVISE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    if response.stop_reason == "refusal":
        raise ScriptGenerationRefused("The model couldn't adjust this part of the script.")

    text_block = next(b for b in response.content if b.type == "text")
    return json.loads(text_block.text)
