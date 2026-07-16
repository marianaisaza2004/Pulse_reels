"""Lightweight persistence for accounts and their brand profiles.

An account (identified by email) can own multiple brand profiles — e.g. an
agency or a solo creator managing more than one brand from the same login.
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
        CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            profile TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS credentials (
            email TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            company_name TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        )
        """
    )
    # Backfill columns for databases created before accounts had names/companies.
    existing_columns = {row[1] for row in conn.execute("PRAGMA table_info(credentials)")}
    for column in ("first_name", "last_name", "company_name"):
        if column not in existing_columns:
            conn.execute(f"ALTER TABLE credentials ADD COLUMN {column} TEXT NOT NULL DEFAULT ''")
    return conn


def normalize_email(email: str) -> str:
    return email.strip().lower()


def list_brands(email: str) -> list[dict]:
    """Returns every brand profile this account owns, oldest first."""
    conn = _connect()
    try:
        rows = conn.execute(
            "SELECT id, profile FROM brands WHERE email = ? ORDER BY id ASC",
            (normalize_email(email),),
        ).fetchall()
        return [{"id": row[0], "profile": json.loads(row[1])} for row in rows]
    finally:
        conn.close()


def create_brand(email: str, profile: dict) -> int:
    """Creates a new brand profile for this account. Returns the new brand id."""
    conn = _connect()
    try:
        cursor = conn.execute(
            "INSERT INTO brands (email, profile, updated_at) VALUES (?, ?, ?)",
            (
                normalize_email(email),
                json.dumps(profile),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def update_brand(email: str, brand_id: int, profile: dict) -> bool:
    """Updates an existing brand profile. Returns False if it doesn't belong to this account."""
    conn = _connect()
    try:
        cursor = conn.execute(
            "UPDATE brands SET profile = ?, updated_at = ? WHERE id = ? AND email = ?",
            (
                json.dumps(profile),
                datetime.now(timezone.utc).isoformat(),
                brand_id,
                normalize_email(email),
            ),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def get_account(email: str) -> Optional[dict]:
    """Returns the account record for this email, or None if no account exists."""
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT password_hash, first_name, last_name, company_name FROM credentials WHERE email = ?",
            (normalize_email(email),),
        ).fetchone()
        if not row:
            return None
        return {
            "password_hash": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "company_name": row[3],
        }
    finally:
        conn.close()


def create_account(
    email: str,
    password_hash: str,
    first_name: str,
    last_name: str,
    company_name: str,
) -> None:
    conn = _connect()
    try:
        conn.execute(
            """
            INSERT INTO credentials
                (email, password_hash, first_name, last_name, company_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                normalize_email(email),
                password_hash,
                first_name,
                last_name,
                company_name,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()
    finally:
        conn.close()
