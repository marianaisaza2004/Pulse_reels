import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import auth
from app.categorize import CategorizationRefused, categorize
from app.extract_text import UnsupportedFileType, extract_text
from app.schema import CATEGORY_LABELS
from app.script_engine import (
    MIN_SCORE_TO_PRODUCE,
    MOMENT_KEYS,
    VIRAL_CRITERIA,
    ScriptGenerationRefused,
    generate_script,
    improve_criterion,
    refine_idea,
    revise_moment,
)
from app import storage

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Pulse — Brand Intake")


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/health")
def health():
    return {"ok": True, "anthropic_key_configured": bool(os.environ.get("ANTHROPIC_API_KEY"))}


def _validate_email(email: str) -> str:
    email = email.strip()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(status_code=400, detail="Invalid email.")
    return email


def _account_payload(email: str, account: dict) -> dict:
    brands = storage.list_brands(email)
    return {
        "brands": brands,
        "category_labels": CATEGORY_LABELS,
        "first_name": account["first_name"],
        "last_name": account["last_name"],
        "company_name": account["company_name"],
    }


@app.post("/api/auth/login")
def login_endpoint(payload: dict = Body(...)):
    email = _validate_email(payload.get("email", ""))
    password = payload.get("password", "")
    if not password:
        raise HTTPException(status_code=400, detail="Enter a password.")

    account = storage.get_account(email)

    if account is None:
        raise HTTPException(status_code=404, detail="no_account")
    if not auth.verify_password(password, account["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    return _account_payload(email, account)


@app.post("/api/auth/signup")
def signup_endpoint(payload: dict = Body(...)):
    email = _validate_email(payload.get("email", ""))
    password = payload.get("password", "")
    confirm_password = payload.get("confirm_password", "")
    first_name = (payload.get("first_name") or "").strip()
    last_name = (payload.get("last_name") or "").strip()
    company_name = (payload.get("company_name") or "").strip()

    if not password:
        raise HTTPException(status_code=400, detail="Enter a password.")
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords don't match.")
    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="Enter your first and last name.")
    if not company_name:
        raise HTTPException(
            status_code=400,
            detail="Enter your company, brand, or username if you create content on your own.",
        )

    if storage.get_account(email) is not None:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists — log in instead of creating a new one.",
        )

    storage.create_account(
        email,
        auth.hash_password(password),
        first_name,
        last_name,
        company_name,
    )

    account = storage.get_account(email)
    return _account_payload(email, account)


@app.post("/api/brand/save")
def save_brand_endpoint(payload: dict = Body(...)):
    email = _validate_email(payload.get("email", ""))
    profile = payload.get("profile")
    brand_id = payload.get("brand_id")
    if not isinstance(profile, dict):
        raise HTTPException(status_code=400, detail="Missing the profile to save.")
    if not isinstance(brand_id, int):
        raise HTTPException(status_code=400, detail="Missing the brand id to save.")

    updated = storage.update_brand(email, brand_id, profile)
    if not updated:
        raise HTTPException(status_code=404, detail="That brand doesn't exist on this account.")
    return {"ok": True}


@app.post("/api/categorize")
async def categorize_endpoint(
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
    email: Optional[str] = Form(default=None),
):
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY is not configured on the server (see .env.example).",
        )

    parts: list[str] = []

    if text and text.strip():
        parts.append(text.strip())

    file_name = None
    if file is not None and file.filename:
        file_name = file.filename
        content = await file.read()
        try:
            parts.append(extract_text(file.filename, content))
        except UnsupportedFileType as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    raw_text = "\n\n".join(p for p in parts if p.strip())

    if not raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No information was received. Paste text or upload a file.",
        )

    validated_email = _validate_email(email) if email else None

    try:
        profile = categorize(raw_text, existing_profile=None)
    except CategorizationRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    brand_id = storage.create_brand(validated_email, profile) if validated_email else None

    return {
        "profile": profile,
        "brand_id": brand_id,
        "category_labels": CATEGORY_LABELS,
        "meta": {
            "file_name": file_name,
            "characters_processed": len(raw_text),
        },
    }


@app.post("/api/script")
def script_endpoint(payload: dict = Body(...)):
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY is not configured on the server (see .env.example).",
        )

    profile = payload.get("profile")
    brief = payload.get("brief")
    if not isinstance(profile, dict) or not isinstance(brief, dict):
        raise HTTPException(status_code=400, detail="Missing the brand profile or content brief.")

    try:
        refinement = refine_idea(profile, brief)
    except ScriptGenerationRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    scores = refinement["scores"]
    total = refinement["total"]
    final_brief = refinement["brief"]
    produced = total >= MIN_SCORE_TO_PRODUCE

    result = {
        "scores": scores,
        "total": total,
        "threshold": MIN_SCORE_TO_PRODUCE,
        "produced": produced,
        "final_topic": final_brief["topic"],
        "rounds_tried": len(refinement["attempts"]),
    }

    if produced:
        try:
            result["script"] = generate_script(profile, final_brief)
        except ScriptGenerationRefused as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    return result


@app.post("/api/score/improve")
def improve_score_endpoint(payload: dict = Body(...)):
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY is not configured on the server (see .env.example).",
        )

    profile = payload.get("profile")
    brief = payload.get("brief")
    scores = payload.get("scores")
    criterion = payload.get("criterion")
    instruction = (payload.get("instruction") or "").strip()

    if not isinstance(profile, dict) or not isinstance(brief, dict) or not isinstance(scores, dict):
        raise HTTPException(status_code=400, detail="Missing the brand profile, brief, or current scores.")
    if criterion not in VIRAL_CRITERIA:
        raise HTTPException(status_code=400, detail="Invalid criterion.")

    try:
        result = improve_criterion(profile, brief, scores, criterion, instruction)
    except ScriptGenerationRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "scores": result["scores"],
        "total": result["total"],
        "threshold": MIN_SCORE_TO_PRODUCE,
        "produced": result["produced"],
        "final_topic": result["topic"],
        "script": result.get("script"),
    }


@app.post("/api/script/revise")
def revise_script_endpoint(payload: dict = Body(...)):
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY is not configured on the server (see .env.example).",
        )

    profile = payload.get("profile")
    brief = payload.get("brief")
    script = payload.get("script")
    moment_key = payload.get("moment_key")
    instruction = (payload.get("instruction") or "").strip()

    if not isinstance(profile, dict) or not isinstance(brief, dict) or not isinstance(script, dict):
        raise HTTPException(status_code=400, detail="Missing the brand profile, brief, or script.")
    if moment_key not in MOMENT_KEYS:
        raise HTTPException(status_code=400, detail="Invalid script part.")
    if not instruction:
        raise HTTPException(status_code=400, detail="Write what you'd like to change.")

    try:
        moment = revise_moment(profile, brief, script, moment_key, instruction)
    except ScriptGenerationRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {"moment": moment}


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
