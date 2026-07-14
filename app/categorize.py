"""Turns arbitrary, unstructured company input into the standardized
10-category brand profile, via a single constrained Claude call."""

import json

from anthropic import Anthropic

from app.schema import CATEGORY_SCHEMA

MODEL = "claude-opus-4-8"

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
- Keep values in the same language as the input (Spanish input -> Spanish output, English \
input -> English output).
- Be concise: each field should read like a usable brief entry, not a copy-paste of the \
entire source paragraph."""


class CategorizationRefused(RuntimeError):
    pass


def categorize(raw_text: str) -> dict:
    client = Anthropic()

    response = client.messages.create(
        model=MODEL,
        max_tokens=8000,
        output_config={"effort": "medium", "format": {"type": "json_schema", "schema": CATEGORY_SCHEMA}},
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Here is the raw company material to normalize:\n\n{raw_text}",
            }
        ],
    )

    if response.stop_reason == "refusal":
        raise CategorizationRefused(
            "El modelo no pudo procesar este contenido. Revisa el texto e intenta de nuevo."
        )

    text_block = next(b for b in response.content if b.type == "text")
    return json.loads(text_block.text)
