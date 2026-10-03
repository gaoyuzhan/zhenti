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

EVERFLOW_2026_BASE = (
    "https://raw.githubusercontent.com/EverflowCN/everflow-paper/main/"
    "site/data/zhenti/assets/2026"
)
EVERFLOW_2026 = {
    28: "q28-three-level-page-address.svg",
    36: "q36-vlan-switch.svg",
    37: "q37-route-topology.svg",
    43: "q43-instruction-formats.svg",
    44: "q44-datapath.svg",
    46: "q46-directory-inode.svg",
}

Q26_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 210" role="img" aria-labelledby="t d">
<title id="t">2026 408 第26题资源访问操作</title>
<desc id="d">依次执行 wait(S)、访问资源、signal(S)。</desc>
<style>text{font-family:Arial,'Noto Sans SC',sans-serif;fill:#111}.box{fill:#fff;stroke:#111;stroke-width:2}.line{stroke:#111;stroke-width:2}</style>
<rect class="box" x="90" y="28" width="240" height="150"/>
<line class="line" x1="90" y1="78" x2="330" y2="78"/>
<line class="line" x1="90" y1="128" x2="330" y2="128"/>
<text x="210" y="62" text-anchor="middle" font-size="28">wait(S)</text>
<text x="210" y="112" text-anchor="middle" font-size="28">访问资源</text>
<text x="210" y="162" text-anchor="middle" font-size="28">signal(S)</text>
</svg>
"""


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

    # 2026 is not yet part of WeatherCore's crop index. Pull the verified
    # public vector redraws maintained by Everflow and add a faithful redraw for Q26.
    q26_path = OUT / "2026" / "26.svg"
    q26_path.parent.mkdir(parents=True, exist_ok=True)
    q26_path.write_text(Q26_SVG, encoding="utf-8")
    manifest["2026-26"] = "2026/26.svg"

    for number, filename in EVERFLOW_2026.items():
        destination = OUT / "2026" / f"{number}.svg"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(download(f"{EVERFLOW_2026_BASE}/{filename}"))
        manifest[f"2026-{number}"] = f"2026/{number}.svg"

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
