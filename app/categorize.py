"""Turns arbitrary, unstructured company input into the standardized
10-category brand profile, via a single constrained Claude call."""

import json
from typing import Optional

from anthropic import Anthropic

from app.schema import CATEGORY_SCHEMA

MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = """You are the intake engine for Pulse. Companies paste or upload whatever \
material they have about their business — a pitch deck excerpt, a messy set of notes, a \
website description, social media captions, anything — in no particular format. Your job \
is to normalize that raw input into a fixed 10-category brand profile so the rest of the \
pipeline always receives the same shape, regardless of how the input arrived.

Rules:
- Extract only what is explicitly stated or directly, unambiguously implied by the input. \
Never invent, assume, or guess a plausible-sounding value.
- Every field in the schema is a plain string. For fields that naturally hold several \
items (e.g. pain_points, words_to_use, main_competitors), separate each item with "; " \
inside that single string — do not add numbering or bullet characters.
- If a field is not covered by the input at all, output an empty string "". Do not fill \
gaps with generic placeholder text like "not specified" — just leave it empty.
- Always write every field in English, regardless of what language the source material is \
in — translate as needed. Never leave a field in another language.
- Be concise: each field should read like a usable brief entry, not a copy-paste of the \
entire source paragraph."""

UPDATE_SYSTEM_PROMPT = SYSTEM_PROMPT + """

This company already has a saved profile from a previous session. You are given that \
existing profile plus new material they just added. Return the full profile again, \
updated: only change a field when the new material adds, corrects, or contradicts it — \
carry every other field over unchanged from the existing profile instead of clearing it."""


class CategorizationRefused(RuntimeError):
    pass


def categorize(raw_text: str, existing_profile: Optional[dict] = None) -> dict:
    client = Anthropic()

    if existing_profile:
        system = UPDATE_SYSTEM_PROMPT
        user_content = (
            f"Existing profile (JSON):\n{json.dumps(existing_profile, ensure_ascii=False)}\n\n"
            f"New material to incorporate:\n\n{raw_text}"
        )
    else:
        system = SYSTEM_PROMPT
        user_content = f"Here is the raw company material to normalize:\n\n{raw_text}"

    response = client.messages.create(
        model=MODEL,
        max_tokens=8000,
        output_config={"format": {"type": "json_schema", "schema": CATEGORY_SCHEMA}},
        system=system,
        messages=[{"role": "user", "content": user_content}],
    )

    if response.stop_reason == "refusal":
        raise CategorizationRefused(
            "The model couldn't process this content. Check the text and try again."
        )

    text_block = next(b for b in response.content if b.type == "text")
    return json.loads(text_block.text)
