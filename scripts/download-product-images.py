#!/usr/bin/env python3
"""Run from the repo root: python scripts/download-product-images.py
Requires: python -m pip install Pillow
Downloads the original nine provided Google images and converts to local JPEG.
"""
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
import json
from PIL import Image

root = Path.cwd()
manifest = Path(__file__).with_name("product-images.json")
target = root / "frontend" / "public" / "images"
if not (root / "frontend" / "public").is_dir():
    raise SystemExit("Run script from BrewLite repository root (frontend/public missing)")
target.mkdir(parents=True, exist_ok=True)
products = json.loads(manifest.read_text(encoding="utf-8"))
for item in products:
    dest = target / item["filename"]
    if dest.exists():
        print("EXISTS", dest)
        continue
    req = Request(item["sourceUrl"], headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=25) as response:
        data = response.read(12 * 1024 * 1024 + 1)
    if len(data) > 12 * 1024 * 1024:
        raise RuntimeError(f"Image too large: {item['name']}")
    with Image.open(BytesIO(data)) as img:
        img.convert("RGB").save(dest, format="JPEG", quality=86, optimize=True)
    print("OK", item["name"], "->", dest)
print("Done. Commit frontend/public/images/*.jpg with the seed changes.")
