# Turns content/settings.json into the snippets the page templates use.
# Executed from build.py (shares its globals). Templates mark editable spots
# with %%TOKENS%%; finish() fills them in and rewrites links to clean URLs.

DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

def _hm(t):
    h, m = (int(x) for x in t.split(':'))
    return h, m

def t_short(t):
    """'07:00' -> '7am', '19:30' -> '7:30pm'"""
    h, m = _hm(t)
    return f"{h % 12 or 12}{':%02d' % m if m else ''}{'am' if h < 12 else 'pm'}"

def t_long(t):
    """'07:00' -> '7:00am'"""
    h, m = _hm(t)
    return f"{h % 12 or 12}:{m:02d}{'am' if h < 12 else 'pm'}"

def t_range(a, b):
    """'19:00','20:00' -> '7–8pm'; '11:00','13:00' -> '11am–1pm'"""
    A, Bb = t_short(a), t_short(b)
    if A[-2:] == Bb[-2:]:
        A = A[:-2]
    return f'{A}–{Bb}'

CONTACT = S['contact']
PHONE = CONTACT['phone']
PHONE_TEL = re.sub(r'\D', '', PHONE)
PHONE_INTL = '+61' + PHONE_TEL.lstrip('0')
EMAIL = CONTACT['email']

HRS = S['ramsgate']['hours']
for g in HRS:
    for d in g['days']:
        assert d in DAYS, f'settings.json: unknown day "{d}" in Ramsgate hours'

def _dec(t):
    h, m = _hm(t)
    return f'{h}' if not m else f'{h + m / 60:.2f}'.rstrip('0')

HOURS_DATA = ','.join(f"{DAYS.index(d)}:{_dec(g['open'])}-{_dec(g['close'])}"
                      for g in HRS if not g.get('closed') for d in g['days'])
HOURS_GRID = ''.join(f"<span>{g['short']}</span><span>{'Closed' if g.get('closed') else t_short(g['open']) + '–' + t_short(g['close'])}</span>" for g in HRS)
HOURS_TABLE_ROWS = '\n'.join(
    f'<tr data-d="{" ".join(str(DAYS.index(d)) for d in g["days"])}"><th scope="row">{g["label"]}</th>'
    f'<td>{"Closed" if g.get("closed") else t_long(g["open"]) + " – " + t_long(g["close"])}</td></tr>' for g in HRS)
OPENING_SPEC = [{"@type": "OpeningHoursSpecification", "dayOfWeek": g['days'] if len(g['days']) > 1 else g['days'][0],
                 "opens": g['open'], "closes": g['close']} for g in HRS if not g.get('closed')]

CWC = S['coffee_with_christ']
assert CWC['day'] in DAYS, 'settings.json: Coffee with Christ day must be a full day name, e.g. Thursday'
CWC_WHEN = f"{CWC['day']}s, {t_range(CWC['start'], CWC['end'])}"
CWC_EVERY = f"Every {CWC['day']} · {t_range(CWC['start'], CWC['end'])}"

def next_cwc():
    """Next session date (Sydney time) for the Event schema, worked out at build time."""
    try:
        from zoneinfo import ZoneInfo
        now = datetime.datetime.now(ZoneInfo('Australia/Sydney'))
    except Exception:
        now = datetime.datetime.utcnow() + datetime.timedelta(hours=10)
    ahead = (DAYS.index(CWC['day']) - (now.weekday() + 1) % 7) % 7
    return (now + datetime.timedelta(days=ahead)).date().isoformat()

NAR = S['narellan']

def nar_signup():
    action = (NAR.get('mailchimp_form_action') or '').strip()
    if not action:
        return (f'<div class="rv" style="display:grid;gap:14px"><p style="color:#F4F2EE">Email <a href="mailto:{EMAIL}?subject=Narellan%20opening">{EMAIL}</a> '
                f'and we&rsquo;ll let you know when the doors open.</p></div>')
    # Mailchimp's anti-bot field is named b_<u>_<id>, taken from the form action URL.
    m = re.search(r'[?&]u=([^&]+)&(?:amp;)?id=([^&]+)', action)
    bot = f'b_{m.group(1)}_{m.group(2)}' if m else 'b_hp'
    return f'''<form class="form rv" method="post" action="{html.escape(action)}" target="_blank" data-mailchimp>
      <div class="row2"><label for="n-name">Your name<input id="n-name" name="FNAME" autocomplete="name"></label><label for="n-email">Email<input id="n-email" name="EMAIL" type="email" autocomplete="email" required></label></div>
      <div class="hp" aria-hidden="true"><input name="{bot}" tabindex="-1" value="" autocomplete="off"></div>
      <button class="btn" type="submit">Let me know {ARR}</button>
      <p class="thanks" hidden>Thank you. We&rsquo;ll be in touch when the doors open.</p>
      <p class="formerr" role="alert" hidden>Sorry, that didn&rsquo;t go through. Please check your email address and try again.</p>
    </form>'''

def announcement():
    a = S.get('announcement') or {}
    if not a.get('show') or not a.get('text', '').strip():
        return ''
    link = ''
    if a.get('link_url') and a.get('link_text'):
        link = f' <a href="{html.escape(a["link_url"])}">{html.escape(a["link_text"])} {ARR}</a>'
    return f'<div class="announce" role="status"><div class="wrap"><p>{html.escape(a["text"])}{link}</p></div></div>\n'

TOKENS = {
    'PHONE': PHONE, 'PHONE_TEL': PHONE_TEL, 'EMAIL': EMAIL,
    'HOURS_DATA': HOURS_DATA, 'HOURS_SUMMARY': S['ramsgate']['hours_summary'], 'HOURS_GRID': HOURS_GRID,
    'HOURS_TABLE_ROWS': HOURS_TABLE_ROWS, 'HOURS_NOTE': S['ramsgate']['hours_note'],
    'CWC_WHEN': CWC_WHEN, 'CWC_EVERY': CWC_EVERY, 'CWC_WHERE': CWC['where'],
    'NAR_STATUS': NAR['status'], 'NAR_HOURS': NAR['hours'],
    'TURNSTILE_SITE_KEY': os.environ.get('TURNSTILE_SITE_KEY', '1x00000000000000000000AA'),  # Cloudflare's always-pass test key
}

# Clean URLs. The keys are the generator's internal page names.
URLS = {
    'index.html': '/', 'visit.html': '/visit', 'ramsgate.html': '/visit/ramsgate', 'narellan.html': '/visit/narellan',
    'coffee-with-christ.html': '/coffee-with-christ', 'events.html': '/events', 'learn-more.html': '/learn-more',
    'gallery.html': '/gallery', 'support.html': '/support', 'contact.html': '/contact', '404.html': '/404',
}

def finish(doc):
    doc = doc.replace('%%NAR_SIGNUP%%', nar_signup())
    for k, v in TOKENS.items():
        doc = doc.replace(f'%%{k}%%', v)
    left = re.findall(r'%%[A-Z_]+%%', doc)
    assert not left, f'unfilled tokens: {left}'
    doc = re.sub(r'(href)="([a-z0-9-]+\.html)(#[^"]*)?"', lambda m: f'{m.group(1)}="{URLS[m.group(2)]}{m.group(3) or ""}"', doc)
    doc = re.sub(r'(src|srcset)="img/', r'\1="/img/', doc)
    assert not re.search(r'href="[a-z0-9-]+\.html', doc), 'a link was not mapped to a clean URL'
    return doc
