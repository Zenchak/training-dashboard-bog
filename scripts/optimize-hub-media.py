#!/usr/bin/env python3
"""Create small, transparent, content-addressed WebP artwork for the Hub.

Source PNGs stay untouched. The browser uses hashed WebP filenames for cache
invalidation; custom images in /data/hub-media still override the defaults.
"""
from __future__ import annotations

import hashlib
import re
from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
HOME = {
    "home-allenamenti": "allenamenti",
    "home-casa": "ricerca_casa",
    "home-finanze": "finanze",
    "home-auto": "auto_e_veicoli",
    "home-gare": "mappa_gare",
}
CARS = ("kia_rio", "fiat_punto")


def maybe_remove_flat_gray_background(img: Image.Image) -> tuple[Image.Image, bool]:
    """Remove only a near-uniform, neutral background contiguous to the edges.

    Never replace arbitrary photographic backgrounds and never touch a source
    which already has transparency. Works for neutral gray/white rectangular
    studio backdrops; rejects varied or strongly colored corner backgrounds.
    """
    im = img.convert("RGBA")
    w, h = im.size
    if w < 50 or h < 50:
        return im, False
    if im.getchannel("A").getextrema()[0] < 250:
        return im, False

    points = [(int((w - 1) * x), int((h - 1) * y))
              for x, y in ((0, 0), (.5, 0), (1, 0), (0, .5), (1, .5),
                           (0, 1), (.5, 1), (1, 1))]
    px = im.load()
    colors = [px[x, y][:3] for x, y in points]
    if any(max(c) - min(c) > 22 for c in colors):
        return im, False
    bg = tuple(round(median(c[i] for c in colors)) for i in range(3))
    if min(bg) < 145:
        return im, False
    if any(max(abs(c[i] - bg[i]) for i in range(3)) > 42 for c in colors):
        return im, False

    rgba = bytearray(im.tobytes())
    seen = bytearray(w * h)
    queue: deque[int] = deque()

    def is_background(pos: int) -> bool:
        j = pos * 4
        r, g, b = rgba[j], rgba[j + 1], rgba[j + 2]
        return (max(r, g, b) - min(r, g, b) <= 24 and
                max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2])) <= 48)

    def add(pos: int) -> None:
        if not seen[pos]:
            seen[pos] = 1
            if is_background(pos):
                queue.append(pos)

    for x in range(w):
        add(x)
        add((h - 1) * w + x)
    for y in range(h):
        add(y * w)
        add(y * w + w - 1)

    erased = 0
    while queue:
        pos = queue.popleft()
        rgba[pos * 4 + 3] = 0
        erased += 1
        x, y = pos % w, pos // w
        if x:
            add(pos - 1)
        if x < w - 1:
            add(pos + 1)
        if y:
            add(pos - w)
        if y < h - 1:
            add(pos + w)
    # Do not apply a tiny partial background removal, which could look patchy.
    if erased < w * h * .08:
        return im, False
    return Image.frombytes("RGBA", (w, h), bytes(rgba)), True


def convert(source: Path, destination: Path, max_side: int, clean_background=False) -> str:
    im = ImageOps.exif_transpose(Image.open(source)).convert("RGBA")
    im.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    removed = False
    if clean_background:
        im, removed = maybe_remove_flat_gray_background(im)
    destination.mkdir(parents=True, exist_ok=True)
    import io
    stream = io.BytesIO()
    im.save(stream, "WEBP", quality=87, method=6, exact=True)
    encoded = stream.getvalue()
    digest = hashlib.sha256(encoded).hexdigest()[:12]
    filename = source.stem + "-" + digest + ".webp"
    target = destination / filename
    if not target.exists():
        target.write_bytes(encoded)
    for prior in destination.glob(source.stem + "-*.webp"):
        if prior != target:
            prior.unlink()
    print(f"{source.relative_to(ROOT)}: {source.stat().st_size // 1024} KB -> "
          f"{len(encoded) // 1024} KB ({filename}; gray background removed: {removed})")
    return filename


def update_home(mapping: dict[str, str]) -> None:
    file = ROOT / "nas/public-index.html"
    src = file.read_text(encoding="utf-8")
    for slot, filename in mapping.items():
        pattern = (r'(data-media-slot="' + re.escape(slot) +
                   r'"\s+data-default-src=")[^"]+(")')
        result, count = re.subn(pattern, lambda m: m[1] + "/assets/home/" + filename + m[2], src)
        if count != 1:
            raise RuntimeError(f"Expected 1 Home image for {slot}, found {count}")
        src = result
    file.write_text(src, encoding="utf-8")


def update_cars(mapping: dict[str, str]) -> None:
    file = ROOT / "nas/auto/index.html"
    src = file.read_text(encoding="utf-8")
    expected = r"const fallback=c\.id==='kia-rio'\?'[^']+':'[^']+';"
    replacement = ("const fallback=c.id==='kia-rio'?"
                   f"'/assets/car/{mapping['kia_rio']}':"
                   f"'/assets/car/{mapping['fiat_punto']}';")
    src, count = re.subn(expected, lambda _: replacement, src)
    if count != 1:
        raise RuntimeError(f"Expected 1 car fallback, found {count}")
    file.write_text(src, encoding="utf-8")


def main() -> None:
    home_dir = ROOT / "nas/assets/home"
    car_dir = ROOT / "nas/assets/car"
    home_mapping = {
        slot: convert(home_dir / (stem + ".png"), home_dir, max_side=320)
        for slot, stem in HOME.items()
    }
    car_mapping = {
        stem: convert(ROOT / "nas/auto" / (stem + ".png"), car_dir,
                      max_side=1080, clean_background=True)
        for stem in CARS
    }
    update_home(home_mapping)
    update_cars(car_mapping)


if __name__ == "__main__":
    main()
