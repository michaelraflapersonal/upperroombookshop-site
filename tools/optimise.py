#!/usr/bin/env python3
"""Make web-sized WebP copies of every photo in static/img and write src/img-manifest.json.

Run this after adding or replacing a photo (needs Pillow):  python3 tools/optimise.py
The site build reads the manifest to add srcset, sizes, width and height to every <img>.
"""
import json, os, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'static', 'img')
WIDTHS = [480, 800, 1200, 1600]
SKIP = ('logo', 'mark', 'favicon', 'apple-touch', 'icon-', 'branch-', 'church-line')

manifest = {}
saved = 0
for f in sorted(os.listdir(IMG)):
    base, ext = os.path.splitext(f)
    if ext.lower() not in ('.jpg', '.jpeg') or base.startswith(SKIP) or base[-4:-3] == '-' and base[-3:].isdigit():
        continue
    path = os.path.join(IMG, f)
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    w, h = im.size
    variants = []
    for tw in WIDTHS:
        if tw >= w and tw != WIDTHS[0]:
            if w not in variants and not any(v >= w for v in variants): tw = w
            else: continue
        if tw > w: continue
        th = round(h * tw / w)
        out = im if tw == w else im.resize((tw, th), Image.LANCZOS)
        out.save(os.path.join(IMG, f'{base}-{tw}.webp'), 'WEBP', quality=76, method=6)
        variants.append(tw)
    # a wide photo that is smaller than a laptop screen: add a gently sharpened 1600px copy so it fills the hero crisply
    if w < 1200 and w / h > 1.5:
        from PIL import ImageFilter
        up = im.resize((1600, round(h * 1600 / w)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=2))
        up.save(os.path.join(IMG, f'{base}-1600.webp'), 'WEBP', quality=78, method=6)
        variants.append(1600)
    # re-save the JPEG fallback a little tighter if that makes it smaller
    before = os.path.getsize(path)
    tmp = path + '.tmp'
    im.save(tmp, 'JPEG', quality=80, optimize=True, progressive=True)
    if os.path.getsize(tmp) < before * 0.95:
        saved += before - os.path.getsize(tmp); os.replace(tmp, path)
    else: os.remove(tmp)
    manifest[f] = {'w': w, 'h': h, 'v': variants}

# PNG logos and drawings are kept as they are; only their size is recorded so <img> gets width and height
for f in sorted(os.listdir(IMG)):
    if f.lower().endswith('.png'):
        w, h = Image.open(os.path.join(IMG, f)).size
        manifest[f] = {'w': w, 'h': h, 'v': []}

with open(os.path.join(ROOT, 'src', 'img-manifest.json'), 'w') as fh:
    json.dump(manifest, fh, indent=0, sort_keys=True)
print(f'{len(manifest)} photos, JPEG fallbacks tightened by {saved//1024} KB')
