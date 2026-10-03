#!/usr/bin/env python3
"""Generate cropped original-question images for 408 questions that depend on figures.

The crop metadata comes from WeatherCore/408's public exam archive index. The generated
assets are question-level source crops (not reconstructed diagrams), so the figure stays
faithful to the original paper and cannot be lost by OCR/text conversion.
"""

from __future__ import annotations

import io
import json
import re
import shutil
import urllib.request
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "408-assets" / "figures"

BASE = "https://raw.githubusercontent.com/WeatherCore/408/main/408-mentor"
INDEX_URL = f"{BASE}/references/exam-archive/exam-index.json"

VISUAL_RE = re.compile(
    r"(如图|图中|下图|图所示|如下图|题\s*\d+[-a-zA-Z]*\s*图|"
    r"拓扑|结构图|示意图|波形|时序图|框图|树如|二叉树如|网络如)"
)


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "zhenti-408-assets/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()


def exam_url(year: int) -> str:
    folder = "2010-2019" if year <= 2019 else "2020-2025"
    return f"{BASE}/data/exams/{folder}/{year}.pdf"


def render_crop(doc: fitz.Document, page_number: int, clip: list[float], destination: Path) -> None:
    page = doc[page_number - 1]
    rect = fitz.Rect(*clip) & page.rect
    if rect.is_empty or rect.width < 5 or rect.height < 5:
        raise ValueError(f"invalid crop {clip} on page {page_number}")

    pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0), clip=rect, alpha=False, colorspace=fitz.csGRAY)
    image = Image.frombytes("L", (pix.width, pix.height), pix.samples)
    image = ImageOps.autocontrast(image)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=86, method=6)


def main() -> None:
    index = json.loads(download(INDEX_URL))
    visual_questions = [
        q for q in index["questions"]
        if 2009 <= int(q["year"]) <= 2025 and VISUAL_RE.search(q.get("rawText", ""))
    ]

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, str] = {}
    by_year: dict[int, list[dict]] = {}
    for question in visual_questions:
        by_year.setdefault(int(question["year"]), []).append(question)

    for year in sorted(by_year):
        pdf_bytes = download(exam_url(year))
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for question in sorted(by_year[year], key=lambda q: int(q["number"])):
                number = int(question["number"])
                destination = OUT / str(year) / f"{number}.webp"
                render_crop(doc, int(question["examPage"]), question["clip"], destination)
                manifest[f"{year}-{number}"] = f"{year}/{number}.webp"
        finally:
            doc.close()

    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (OUT / "README.txt").write_text(
        "Generated from original 408 exam PDFs using WeatherCore/408 crop metadata.\n"
        "These files are source-question crops for study/reference; do not treat OCR text as authoritative.\n",
        encoding="utf-8",
    )
    print(f"generated {len(manifest)} visual-question crops")


if __name__ == "__main__":
    main()
