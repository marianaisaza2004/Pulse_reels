import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.categorize import CategorizationRefused, categorize
from app.extract_text import UnsupportedFileType, extract_text
from app.schema import CATEGORY_LABELS
from app.script_engine import ScriptGenerationRefused, generate_script
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
        raise HTTPException(status_code=400, detail="Correo inválido.")
    return email


@app.get("/api/profile")
def get_profile_endpoint(email: str):
    email = _validate_email(email)
    profile = storage.get_profile(email)
    if profile is None:
        raise HTTPException(status_code=404, detail="No hay un perfil guardado con ese correo.")
    return {"profile": profile, "category_labels": CATEGORY_LABELS}


@app.post("/api/profile/save")
def save_profile_endpoint(payload: dict = Body(...)):
    email = _validate_email(payload.get("email", ""))
    profile = payload.get("profile")
    if not isinstance(profile, dict):
        raise HTTPException(status_code=400, detail="Falta el perfil a guardar.")
    storage.save_profile(email, profile)
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
            detail="Falta configurar ANTHROPIC_API_KEY en el servidor (ver .env.example).",
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
            detail="No se recibió información. Pega texto o sube un archivo.",
        )

    validated_email = _validate_email(email) if email else None
    existing_profile = storage.get_profile(validated_email) if validated_email else None

    try:
        profile = categorize(raw_text, existing_profile=existing_profile)
    except CategorizationRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if validated_email:
        storage.save_profile(validated_email, profile)

    return {
        "profile": profile,
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
            detail="Falta configurar ANTHROPIC_API_KEY en el servidor (ver .env.example).",
        )

    profile = payload.get("profile")
    brief = payload.get("brief")
    if not isinstance(profile, dict) or not isinstance(brief, dict):
        raise HTTPException(status_code=400, detail="Falta el perfil o el brief de contenido.")

    try:
        script = generate_script(profile, brief)
    except ScriptGenerationRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {"script": script}


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
