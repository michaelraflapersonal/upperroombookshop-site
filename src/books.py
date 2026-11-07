# Books & gifts (/books): one page shell. src/books.js fills it from /api/catalogue (live from Square),
# and the Worker serves this same page at /books/all, /books/<section> and /books/item/<id>.
# Executed from build.py (shares its globals). Words around the catalogue live in content/catalogue.json.
CAT = json.load(open(os.path.join(ROOT, 'content', 'catalogue.json'), encoding='utf-8'))
_cfg = {k: CAT[k] for k in ('online_checkout', 'hold_note', 'order_note', 'map_note_columns', 'map_note_rows', 'gifts_where', 'sections', 'begin')}
_cfg.update({'checkout_url': CAT.get('checkout_url', ''), 'phone': '%%PHONE%%', 'hours': S['ramsgate']['hours_summary'], 'turnstile': '%%TURNSTILE_SITE_KEY%%'})
_cfg_json = json.dumps(_cfg, ensure_ascii=False).replace('</', '<\\/')
books = f'''<section class="bk-pin" aria-hidden="true"></section>
<div class="bk" id="shelf">
  <div id="shelf-app">
    <div class="wrap" style="padding-block:40px 80px">
      <span class="eyebrow">Books &amp; gifts</span>
      <h1 style="font-size:clamp(44px,6.4vw,84px);line-height:.98;color:var(--head);margin-top:20px">Browse the shelves</h1>
      <noscript><p style="margin-top:20px;max-width:46ch">Our online shelves need JavaScript to load. You&rsquo;re always welcome to call us on %%PHONE%% and we&rsquo;ll check whether a book is in.</p></noscript>
    </div>
  </div>
  <div class="bk-sheet" id="bk-sheet" hidden>
    <div class="bk-box" role="dialog" aria-modal="true" aria-label="Search books and gifts">
      <div class="bk-in"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><input id="bk-q" type="search" placeholder="Title, author, ISBN or topic" autocomplete="off" aria-label="Search books and gifts"><button class="bk-x" type="button" id="bk-qx" aria-label="Close search"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="bk-res" id="bk-res"></div>
    </div>
  </div>
</div>
<script type="application/json" id="shelf-cfg">{_cfg_json}</script>
<script src="/books.js" defer></script>'''
page('books.html', 'Books &amp; Gifts | %%BIZ_NAME%%, Ramsgate',
     'Browse the Christian books and gifts on the shelves at Upper Room in Ramsgate: Orthodox spirituality, saints, Bibles, children&rsquo;s books and more, with live stock.', books)
open(os.path.join(OUT, 'books.js'), 'w', encoding='utf-8').write(open(os.path.join(B, 'books.js'), encoding='utf-8').read())
