"""Extract plain text from whatever file format the company uploads."""

import io

from pypdf import PdfReader
from docx import Document


class UnsupportedFileType(ValueError):
    pass


def extract_text(filename: str, content: bytes) -> str:
    name = filename.lower()

    if name.endswith((".txt", ".md", ".csv")):
        return content.decode("utf-8", errors="ignore")

    if name.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if name.endswith(".docx"):
        document = Document(io.BytesIO(content))
        return "\n".join(p.text for p in document.paragraphs)

    raise UnsupportedFileType(
        f"Formato de archivo no soportado: '{filename}'. "
        "Usa .txt, .md, .csv, .pdf o .docx."
    )
