#!/usr/bin/env python3
"""On-site SEO checks for the SEO agent. Run after `python3 src/build.py`.

  python3 tools/seo/site_check.py          # checks the built site in dist/
  python3 tools/seo/site_check.py --live   # also checks old URLs redirect on the live domain

Prints a list of problems and exits 1 if any are found.
"""
import glob, html, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIST = os.path.join(ROOT, 'dist')
CFG = json.load(open(os.path.join(ROOT, 'seo', 'config.json')))
# Positioning rule: Upper Room is a ministry of the Coptic Orthodox Church, never labelled by denomination.
BANNED = [r'coptic orthodox (christian )?(bookshop|bookstore|cafe|café|shop)', r'coptic orthodox[- ]run', r'orthodox (bookshop|bookstore)']
problems = []
def bad(page, msg): problems.append(f'{page}: {msg}')

pages = {}
for f in glob.glob(os.path.join(DIST, '**', '*.html'), recursive=True):
    rel = '/' + os.path.relpath(f, DIST)[:-5]
    rel = '/' if rel == '/index' else rel
    pages[rel] = open(f, encoding='utf-8').read()

for url, doc in sorted(pages.items()):
    if url == '/404': continue
    noindex = 'name="robots" content="noindex"' in doc
    t = re.search(r'<title>(.*?)</title>', doc, re.S)
    t = html.unescape(t.group(1)) if t else ''
    if not t: bad(url, 'no <title>')
    elif len(t) > 65: bad(url, f'title is {len(t)} characters (aim for 65 or less): {t}')
    d = re.search(r'<meta name="description" content="([^"]*)"', doc)
    d = html.unescape(d.group(1)) if d else ''
    if not d: bad(url, 'no meta description')
    elif not 70 <= len(d) <= 160: bad(url, f'description is {len(d)} characters (aim for 70-160)')
    if not noindex and 'rel="canonical"' not in doc: bad(url, 'no canonical link')
    n = len(re.findall(r'<h1\b', doc))
    if n != 1: bad(url, f'{n} <h1> headings (want exactly 1)')
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', doc, re.S):
        try: json.loads(m)
        except Exception as e: bad(url, f'structured data does not parse: {e}')
    for img in re.findall(r'<img\b[^>]*>', doc):
        if 'alt=' not in img: bad(url, f'image without alt: {img[:90]}')
    text = html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|style)\b.*?</\1>', ' ', doc, flags=re.S))).lower()
    for pat in BANNED:
        if re.search(pat, text): bad(url, f'positioning rule: matches "{pat}"')
    for group, qs in CFG['targets'].items():
        if group.startswith('_') or group == 'brand': continue  # names repeat in menus; that's fine
        for q in qs:
            c = text.count(q.lower())
            if c > 3: bad(url, f'"{q}" appears {c} times; reads as keyword stuffing')
    for href in re.findall(r'href="(/[^"#?]*)', doc):
        p = href.rstrip('/') or '/'
        if p.startswith(('/img/', '/api/', '/books/')) or re.search(r'\.\w+$', p): continue
        if p not in pages: bad(url, f'internal link to missing page {href}')

# Sitemap and redirects
sm = open(os.path.join(DIST, 'sitemap.xml')).read()
locs = [l.replace(CFG['site'], '') or '/' for l in re.findall(r'<loc>(.*?)</loc>', sm)]
for l in locs:
    if l not in pages: bad('sitemap.xml', f'lists {l}, which is not built')
    elif 'content="noindex"' in pages[l]: bad('sitemap.xml', f'lists {l}, which is noindex')
redirects = [l.split() for l in open(os.path.join(DIST, '_redirects')) if l.strip() and not l.startswith('#')]
for r in redirects:
    to = r[1].rstrip('/') or '/'
    if to.startswith('/') and to not in pages: bad('_redirects', f'{r[0]} points to missing page {r[1]}')

if '--live' in sys.argv:
    import requests
    olds = [l.strip() for l in open(os.path.join(ROOT, 'seo', 'old-urls.txt')) if l.strip() and not l.startswith('#')]
    for o in olds:
        try:
            r = requests.get(CFG['site'] + o, allow_redirects=False, timeout=20)
            if r.status_code == 404: bad('live', f'old URL {o} returns 404; add a redirect in src/_redirects')
            elif r.status_code not in (200, 301, 308): bad('live', f'old URL {o} returns {r.status_code}')
            elif r.status_code in (301, 308) and requests.get(CFG['site'] + o, timeout=20).status_code != 200:
                bad('live', f'old URL {o} redirects to a page that does not load')
        except Exception as e:
            bad('live', f'could not reach {o}: {e}'); break

print(f'Checked {len(pages)} pages, {len(locs)} sitemap entries, {len(redirects)} redirects.')
for p in problems: print(' -', p)
sys.exit(1 if problems else 0)
