#!/usr/bin/env python3
"""Copy a full-size original into static/img at web size, so large originals stay off GitHub.

  python3 tools/add_photo.py "C:/path/to/original.jpg"                  a photo for a tile (1066px wide)
  python3 tools/add_photo.py "C:/path/to/original.jpg" --width 1600     a photo for the homepage hero
  python3 tools/add_photo.py "C:/path/to/original.jpg" --portrait 0.72 --name my-photo-m
        cuts a tall 2:3 version from a wide photo for phones. 0.72 is how far across to centre the cut.

Camera details and any location data are left behind. Afterwards run python3 tools/optimise.py to
make the WebP sizes, then list the photo under "featured" in content/settings.json.
"""
import argparse, os
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('original')
ap.add_argument('--width', type=int, default=1066)
ap.add_argument('--name', help='file name without .jpg (defaults to the original name)')
ap.add_argument('--portrait', type=float, help='cut a 2:3 portrait centred this far across (0 to 1)')
a = ap.parse_args()

im = ImageOps.exif_transpose(Image.open(a.original)).convert('RGB')
if a.portrait is not None:
    w = round(im.height * 2 / 3)
    x = min(max(0, round(im.width * a.portrait - w / 2)), im.width - w)
    im = im.crop((x, 0, x + w, im.height))
width = min(a.width, im.width)
im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
name = a.name or os.path.splitext(os.path.basename(a.original))[0]
out = os.path.join(ROOT, 'static', 'img', name + '.jpg')
im.save(out, 'JPEG', quality=84, optimize=True, progressive=True)
print(f'{out}: {im.width}x{im.height}, {os.path.getsize(out) // 1024} KB')
