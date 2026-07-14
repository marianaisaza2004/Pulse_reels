"""Lightweight persistence for brand profiles, keyed by the company's email.

No accounts, no passwords — the email is just the lookup key so a company
doesn't have to re-paste their information every time they come back.
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "pulse.db"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS companies (
            email TEXT PRIMARY KEY,
            profile TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    return conn


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_profile(email: str) -> Optional[dict]:
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT profile FROM companies WHERE email = ?",
            (normalize_email(email),),
        ).fetchone()
        return json.loads(row[0]) if row else None
    finally:
        conn.close()


def save_profile(email: str, profile: dict) -> None:
    conn = _connect()
    try:
        conn.execute(
            """
            INSERT INTO companies (email, profile, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                profile = excluded.profile,
                updated_at = excluded.updated_at
            """,
            (
                normalize_email(email),
                json.dumps(profile),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()
    finally:
        conn.close()
