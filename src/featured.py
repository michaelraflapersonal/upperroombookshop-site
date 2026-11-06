# Rotating homepage hero and monthly photo slots. Staff edit the lists under "featured" in content/settings.json.
# Executed by build.py (shares its globals). A photo must be in static/img and processed by tools/optimise.py.
FEATURED = S.get('featured', {})

def _photo(name, where):
    if name not in IMGM or not IMGM[name]['v']:
        raise SystemExit(f'content/settings.json, featured, {where}: {name} is not ready. '
                         'Add it with tools/add_photo.py, then run tools/optimise.py.')
    return {'f': f'/img/{name}', 's': _srcset(name)}

def _attr(data):
    return html.escape(json.dumps(data, ensure_ascii=False, separators=(',', ':')), quote=True)

def _pos(s):
    out = ''
    if s.get('pos'): out += f'--pd:{s["pos"]};'
    if s.get('mobile_pos'): out += f'--pm:{s["mobile_pos"]};'
    return out

def _hero():
    H = FEATURED['hero']
    first, rest = H['slides'][0], H['slides'][1:]
    _photo(first['photo'], 'hero')
    extra = []
    for s in rest:
        extra.append({'d': _photo(s['photo'], 'hero'), 'm': _photo(s['mobile'], 'hero') if s.get('mobile') else None,
                      'pos': _pos(s), 'strong': s.get('shade') == 'strong'})
    src = ''
    if first.get('mobile'):
        _photo(first['mobile'], 'hero')
        src = f'<source media="(max-width:700px)" srcset="img/{first["mobile"]}">'
    alt = html.escape(first.get('alt', ''), quote=True)
    return (f'<div class="frame" data-hero data-seconds="{int(H.get("seconds", 8))}" data-slides="{_attr(extra)}">'
            f'<picture class="hs on{" strong" if first.get("shade") == "strong" else ""}" style="{_pos(first)}">{src}'
            f'<img data-speed="0.28" src="img/{first["photo"]}" alt="{alt}" fetchpriority="high"></picture></div>')

def _slot(m):
    tag = m.group(0)
    key = m.group(1)
    photos = FEATURED['slots'][key]['photos']
    if photos[0].get('months'):
        raise SystemExit(f'content/settings.json, featured, {key}: the first photo must be an all-year one.')
    first = photos[0]
    data = [dict(_photo(p['photo'], key), a=p.get('alt', ''), **({'months': p['months']} if p.get('months') else {})) for p in photos]
    add = f' src="img/{first["photo"]}" alt="{html.escape(first.get("alt", ""), quote=True)}"'
    if len(data) > 1: add += f' data-photos="{_attr(data)}"'
    return tag[:-1].rstrip() + add + '>'

def apply_featured(doc):
    if 'hero' in FEATURED:
        doc = doc.replace('<div class="frame" data-hero></div>', _hero())
    doc = re.sub(r'<img\b[^>]*\bdata-slot="([^"]+)"[^>]*>', _slot, doc)
    return doc
