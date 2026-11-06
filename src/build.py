"""Builds the Upper Room site into dist/. Run: python3 src/build.py
Content staff edit lives in content/settings.json; everything else is in src/."""
import os, re, json, shutil, html, datetime, base64
B = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(B)
OUT = os.path.join(ROOT, 'dist')
SITE = 'https://www.upperroombookshop.com'
S = json.load(open(os.path.join(ROOT, 'content', 'settings.json'), encoding='utf-8'))

if os.path.isdir(OUT): shutil.rmtree(OUT)
shutil.copytree(os.path.join(ROOT, 'static'), OUT)

GIFT = S['links']['gift_cards']
DONATE = S['links']['donate']
PLACE_ID = S['links']['google_place_id']
_PLACE_NAME = 'Upper+Room+Christian+Bookshop+Cafe'
MAPS = f'https://www.google.com/maps/search/?api=1&query={_PLACE_NAME}&query_place_id={PLACE_ID}'
DIRS = f'https://www.google.com/maps/dir/?api=1&destination={_PLACE_NAME}&destination_place_id={PLACE_ID}'
WRITE_REVIEW = f'https://search.google.com/local/writereview?placeid={PLACE_ID}'
# Google's keyless map embed ignores Place IDs (it shows a world map), but accepts the listing's CID, which is encoded in the Place ID.
PLACE_CID = int.from_bytes(base64.urlsafe_b64decode(PLACE_ID + '=' * (-len(PLACE_ID) % 4))[12:20], 'little')
IG = S['contact']['instagram']
ARR = '<span class="arr" aria-hidden="true">→</span>'

IGF = S.get('instagram_feed', {})
IG_FALLBACK = [('URM_Bookshop-86.jpg','A barista pouring latte art at the counter'),('URM_Bookshop-68.jpg','Two friends choosing books together'),
               ('URM_Bookshop-83.jpg','An icon on the shelves beside a row of commentaries'),('URM_Bookshop-40.jpg','Browsing the gift table'),
               ('URM_Bookshop-20.jpg','Two coffees and a prayer rope'),('URM_Bookshop-76.jpg','Conversation over coffee in the cafe')]
IG_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/></svg>'

RV = S.get('reviews', {})
STAR = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.4l-5.1 2.9L6 11.6 1.7 7.6l5.8-.7z"/></svg>'
def stars(n): return '<span class="stars" role="img" aria-label="%d out of 5 stars">%s</span>' % (n, STAR * int(n))
def reviews_section(heading='What people say about us'):
    maps = MAPS
    write = RV.get('write_review_url') or WRITE_REVIEW
    cards = ''.join(f'<li class="rvc">{stars(r.get("rating", 5))}<blockquote>{html.escape(r["text"])}</blockquote>'
                    f'<p class="who">{html.escape(r["author"])}{(" · " + html.escape(r["when"])) if r.get("when") else ""}</p></li>' for r in RV.get('curated', []))
    return (f'<section class="band reviews" aria-labelledby="rv-h" data-reviews="/api/reviews">'
            f'<div class="wrap"><div class="rvtop rv"><div><span class="eyebrow">Kind words</span><h2 id="rv-h">{heading}</h2>'
            f'<p class="rvsum muted" data-rv-sum><span>Reviews from our Google listing.</span></p></div>'
            f'<div class="rvcta"><a class="btn" href="{maps}" target="_blank" rel="noopener">Read reviews on Google</a>'
            f'<a class="tlink" href="{write}" target="_blank" rel="noopener">Leave a review {ARR}</a></div></div>'
            f'<ul class="rvgrid" role="list"{"" if cards else " hidden"}>{cards}</ul></div></section>')

def ig_section(eyebrow='Follow along', heading='A little of what we are up to'):
    n = int(IGF.get('count', 6))
    tiles = ''.join(f'<li><a href="{IG}" target="_blank" rel="noopener"><img src="img/{f}" alt="{a}" loading="lazy"><span class="igi">{IG_ICON}<span class="sr">View on Instagram</span></span></a></li>' for f, a in IG_FALLBACK[:n])
    return (f'<section class="band igband" aria-labelledby="ig-h" data-ig-feed="{IGF.get("behold_feed_id","")}" data-ig-count="{n}">'
            f'<div class="wrap"><div class="igtop rv"><div><span class="eyebrow">{eyebrow}</span><h2 id="ig-h">{heading}</h2>'
            f'<p class="muted">New arrivals, feast days and Thursday nights at <a href="{IG}" target="_blank" rel="noopener">@upperroombookshop</a>.</p></div>'
            f'<a class="btn" href="{IG}" target="_blank" rel="noopener">{IG_ICON}<span>Follow on Instagram</span></a></div>'
            f'<ul class="igrid rv" role="list">{tiles}</ul></div></section>')

FONTS = ('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Source+Sans+3:ital,wght@0,400;0,500;1,300;1,400&display=swap">\n'
         '<meta name="color-scheme" content="light dark">\n<link rel="stylesheet" href="/site.css">\n<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png">\n<link rel="icon" type="image/png" sizes="192x192" href="/img/favicon.png">\n<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">')

exec(open(os.path.join(B,'content.py')).read())

SHOW_EVENTS = bool((S.get('events') or {}).get('show'))
NAV = [('index.html','Home'),('visit.html','Visit'),('books.html','Books & gifts'),
       ('events.html','Events') if SHOW_EVENTS else ('coffee-with-christ.html','Coffee with Christ'),
       ('learn-more.html','Explore the faith'),('contact.html','Contact')]

def header(cur):
    items = []
    for href, label in NAV:
        ac = ' aria-current="page"' if href == cur or (label=='Visit' and cur in ('visit.html','ramsgate.html','narellan.html')) or (label=='Events' and cur=='coffee-with-christ.html') else ''
        if label == 'Visit':
            items.append(f'<li><a class="dd" href="visit.html"{ac}>Visit</a><ul class="ddm">'
                         f'<li><a href="ramsgate.html">Ramsgate<small>219 Rocky Point Rd</small></a></li>'
                         f'<li><a href="narellan.html">Narellan<small>%%NAR_STATUS%%</small></a></li>'
                         f'<li><a href="visit.html">All locations<small>Hours side by side</small></a></li></ul></li>')
        elif label == 'Events':
            items.append(f'<li><a class="dd" href="events.html"{ac}>Events</a><ul class="ddm">'
                         f'<li><a href="coffee-with-christ.html">Coffee with Christ<small>%%CWC_WHEN%%</small></a></li>'
                         f'<li><a href="events.html">All events<small>What&rsquo;s on at Upper Room</small></a></li></ul></li>')
        else:
            items.append(f'<li><a href="{href}"{ac}>{label}</a></li>')
    return f'''<header class="site" id="hdr">
  <div class="wrap row">
    <a class="logo" href="index.html" aria-label="Upper Room Christian Bookshop Cafe, home"><img class="lw" src="img/logo-white.png" alt=""><img class="lo" src="img/logo-olive.png" alt=""></a>
    <nav aria-label="Main"><ul>{''.join(items)}</ul></nav>
    <a class="btn findus" href="visit.html">Find us {ARR}</a>
    <button class="burger" type="button" data-menu aria-expanded="false" aria-controls="mnav" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="mnav" id="mnav">
  <button class="close" type="button" data-menu>Close</button>
  <ul>
    <li><a href="index.html">Home</a></li>
    <li><a href="visit.html">Visit</a></li>
    <li class="sub"><a href="ramsgate.html">Ramsgate</a></li>
    <li class="sub"><a href="narellan.html">Narellan</a></li>
    <li><a href="books.html">Books &amp; gifts</a></li>
    {'<li><a href="events.html">Events</a></li><li class="sub">' if SHOW_EVENTS else '<li>'}<a href="coffee-with-christ.html">Coffee with Christ</a></li>
    <li><a href="learn-more.html">Explore the faith</a></li>
    <li><a href="gallery.html">Gallery</a></li>
    <li><a href="support.html">Support</a></li>
    <li><a href="contact.html">Contact</a></li>
  </ul>
  <p class="foot">219 Rocky Point Rd, Ramsgate · %%PHONE%%</p>
</div>'''

FOOTER = f'''<footer id="foot">
  <div class="wrap cols">
    <div style="display:grid;gap:20px;align-content:start"><img class="flogo" src="img/logo-white.png" alt="Upper Room Christian Bookshop Cafe"><p class="tag">A not-for-profit ministry of the Coptic Orthodox Church, open to everyone.</p></div>
    <div><h2 class="fh">Ramsgate</h2><p>219 Rocky Point Rd<br>Ramsgate NSW 2217</p><div class="hours" style="margin-top:12px">%%HOURS_GRID%%</div></div>
    <div><h2 class="fh">Explore</h2><div class="sitemap"><a href="visit.html">Visit</a><a href="books.html">Books &amp; gifts</a><a href="coffee-with-christ.html">Coffee with Christ</a>{'<a href="events.html">Events</a>' if SHOW_EVENTS else ''}<a href="learn-more.html">Explore the faith</a><a href="gallery.html">Gallery</a><a href="support.html">Gift cards &amp; donations</a></div></div>
    <div><h2 class="fh">Contact</h2><p><a href="tel:%%PHONE_TEL%%">%%PHONE%%</a><br><a href="mailto:%%EMAIL%%">%%EMAIL%%</a><br><a href="{IG}">Instagram</a> · <a href="https://upperroommedia.org/">Upper Room Media</a></p><p style="margin-top:14px"><a href="narellan.html">Narellan: opening soon</a></p></div>
  </div>
  <div class="wrap base"><span>© Upper Room Christian Bookshop Cafe</span></div>
</footer>
<script src="/site.js"></script>'''

def phero(img, crumbs, eyebrow, h1, lede, extra='', cls='', pos='center', mob=None):
    pic = ''
    if img:
        src = f'<source media="(max-width:700px)" srcset="img/{mob}">' if mob else ''
        pic = f'<div class="frame" aria-hidden="true"><picture>{src}<img data-speed="0.22" src="img/{img}" alt="" style="object-position:{pos}" fetchpriority="high"></picture></div><div class="shade" aria-hidden="true"></div>'
    cr = ' <span aria-hidden="true">/</span> '.join(f'<a href="{h}">{t}</a>' if h else f'<span aria-current="page">{t}</span>' for h,t in crumbs)
    return f'''<section class="phero {cls}">
  {pic}
  <div class="wrap" style="width:100%"><div class="content">
    <nav class="crumbs" aria-label="Breadcrumb">{cr}</nav>
    <span class="eyebrow">{eyebrow}</span>
    <h1>{h1}</h1>
    <p class="lede">{lede}</p>
    {extra}
  </div></div>
</section>'''

PAGES = []
def _og_image(body):
    m = re.search(r'<img\b[^>]*src="img/([^"]+\.jpe?g)"[^>]*fetchpriority="high"', body) or re.search(r'<img\b[^>]*fetchpriority="high"[^>]*src="img/([^"]+\.jpe?g)"', body)
    return f'{SITE}/img/{m.group(1) if m else "URM_Bookshop-5.jpg"}'

def page(fname, title, desc, body, schema=None, home=False, noindex=False):
    path = URLS[fname]
    canon = SITE + path
    head = (f'<title>{title}</title>\n<meta name="description" content="{desc}">\n'
            + ('' if noindex else f'<link rel="canonical" href="{canon}">\n')
            + f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Upper Room Christian Bookshop Cafe">\n'
            f'<meta property="og:title" content="{title}">\n<meta property="og:description" content="{desc}">\n'
            f'<meta property="og:url" content="{canon}">\n<meta property="og:image" content="{_og_image(body)}">\n<meta property="og:locale" content="en_AU">\n<meta name="twitter:card" content="summary_large_image">\n'
            + ('<meta name="robots" content="noindex">\n' if noindex else '') + FONTS)
    head += GA4
    if schema:
        head += '\n<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False) + '</script>'
    inner = header(fname).replace('<header class="site" id="hdr">', '<header class="site" id="hdr">' + announcement(), 1) + f'\n<main id="top">\n{body}\n</main>\n{FOOTER}'
    doc = f'<!doctype html>\n<html lang="en-AU">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n{head}\n</head>\n<body>\n{inner}\n</body>\n</html>\n'
    doc = finish(doc)
    dest = os.path.join(OUT, 'index.html' if path == '/' else path.strip('/') + '.html')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(doc)
    if not noindex: PAGES.append(path)

def fr(img, alt, cls='', speed='0.06', style=''):
    return f'<figure class="frame rv clip {cls}" style="margin:0;{style}"><img data-speed="{speed}" src="img/{img}" alt="{alt}" loading="lazy"></figure>'

ORG = {"@id":"https://www.upperroombookshop.com/#org"}
RAMS_SCHEMA = {"@context":"https://schema.org","@type":["BookStore","CafeOrCoffeeShop"],"@id":"https://www.upperroombookshop.com/visit/ramsgate#location",
  "name":"Upper Room Christian Bookshop Cafe, Ramsgate","url":"https://www.upperroombookshop.com/visit/ramsgate","telephone":PHONE_INTL,"email":EMAIL,
  "address":{"@type":"PostalAddress","streetAddress":"219 Rocky Point Rd","addressLocality":"Ramsgate","addressRegion":"NSW","postalCode":"2217","addressCountry":"AU"},
  "openingHoursSpecification":OPENING_SPEC,
  "image":SITE+"/img/URM_Bookshop-99.jpg","priceRange":"$","parentOrganization":ORG,"sameAs":[IG]}

# ---------------------------------------------------------------- CSS / JS
css = open(os.path.join(B,'site-base.css')).read() + open(os.path.join(B,'extra.css')).read()
css = css.replace('header:not(.solid) .logo img{filter:brightness(0) invert(1)}','')
css += open(os.path.join(B,'deploy.css')).read()
css += open(os.path.join(B,'books.css')).read()
def _min_css(c):
    c = re.sub(r'/\*.*?\*/', '', c, flags=re.S)
    c = re.sub(r'\s+', ' ', c)
    c = re.sub(r'\s*([{};,>])\s*', r'\1', c)
    c = re.sub(r';}', '}', c)
    return c.strip()
open(os.path.join(OUT,'site.css'),'w').write(_min_css(css))
open(os.path.join(OUT,'site.js'),'w').write(open(os.path.join(B,'site.js')).read())

# ---------------------------------------------------------------- HOME
hb = open(os.path.join(B,'home-body.html')).read().replace('<!--IG-->', reviews_section() + ig_section())
main = hb[hb.index('<main id="top">')+len('<main id="top">'):hb.index('</main>')]
rep = [
 ('<a class="btn" href="#visit">Find us', '<a class="btn" href="visit.html">Find us'),
 ('<a class="tlink" href="#cwc">Coffee with Christ, Thursdays', '<a class="tlink" href="coffee-with-christ.html">Coffee with Christ, Thursdays'),
 ('<a class="tlink" href="#visit">Directions', f'<a class="tlink" href="{DIRS}">Directions'),
 ('<a class="tlink" href="#visit">0494 729 748</a><a class="tlink" href="#visit">Plan your visit</a>', '<a class="tlink" href="tel:%%PHONE_TEL%%">%%PHONE%%</a><a class="tlink" href="ramsgate.html">Plan your visit to Ramsgate</a>'),
 ('<a class="tlink" href="#visit">Hear when we open', '<a class="tlink" href="narellan.html">About Upper Room Narellan'),
 ('<a class="tlink" href="#cwc">See what to expect', '<a class="tlink" href="coffee-with-christ.html">See what to expect'),
 ('<a class="tlink" href="#learn">Read more about Upper Room', '<a class="tlink" href="learn-more.html">Read more about Upper Room'),
 ('<a class="tlink" href="#learn">Start with our introduction to Orthodoxy', '<a class="tlink" href="learn-more.html">Start with our introduction to Orthodoxy'),
 ('<a class="tlink" href="#top">See the full gallery', '<a class="tlink" href="gallery.html">See the full gallery'),
 ('<a class="btn" href="#top">Buy a gift card</a>', f'<a class="btn" href="{GIFT}">Buy a gift card</a>'),
 ('<a class="tlink" href="#top">Make a donation', '<a class="tlink" href="support.html">Make a donation'),
]
for a,b in rep:
    assert a in main, a; main = main.replace(a,b)
HOME_SCHEMA = {"@context":"https://schema.org","@type":"Organization","@id":"https://www.upperroombookshop.com/#org","name":"Upper Room Christian Bookshop Cafe","url":"https://www.upperroombookshop.com/","logo":SITE+"/img/logo-olive.png","email":EMAIL,"sameAs":[IG],"department":[{"@id":"https://www.upperroombookshop.com/visit/ramsgate#location"},{"@id":"https://www.upperroombookshop.com/visit/narellan#location"}]}
page('index.html','Upper Room | Christian Bookshop &amp; Cafe, Ramsgate Sydney','A welcoming Christian bookshop and cafe in Ramsgate, Sydney, with a weekly Bible study. A not-for-profit ministry of the Coptic Orthodox Church, open to all.', main, HOME_SCHEMA)

exec(open(os.path.join(B,'pages.py')).read())
exec(open(os.path.join(B,'books.py')).read())
exec(open(os.path.join(B,'deploy.py')).read())

# Cache-busting: browsers keep /site.css etc. for an hour (src/_headers), so a deploy that changes
# them could show new HTML with old styles. Stamp each reference with a hash of the file's contents.
import hashlib, glob
_stamp = {f: hashlib.sha1(open(os.path.join(OUT, f), 'rb').read()).hexdigest()[:10] for f in ('site.css', 'site.js', 'books.js') if os.path.exists(os.path.join(OUT, f))}
for _p in glob.glob(os.path.join(OUT, '**', '*.html'), recursive=True):
    _d = open(_p, encoding='utf-8').read(); _n = _d
    for _f, _h in _stamp.items():
        _n = re.sub(rf'(href|src)="/{re.escape(_f)}"', rf'\1="/{_f}?v={_h}"', _n)
    if _n != _d: open(_p, 'w', encoding='utf-8').write(_n)
