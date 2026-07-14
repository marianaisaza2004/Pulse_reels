import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.categorize import CategorizationRefused, categorize
from app.extract_text import UnsupportedFileType, extract_text
from app.schema import CATEGORY_LABELS

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


@app.post("/api/categorize")
async def categorize_endpoint(
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
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

    try:
        profile = categorize(raw_text)
    except CategorizationRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "profile": profile,
        "category_labels": CATEGORY_LABELS,
        "meta": {
            "file_name": file_name,
            "characters_processed": len(raw_text),
        },
    }


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
