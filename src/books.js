/* Books & gifts (/books): renders the live Square catalogue from /api/catalogue.
   Addresses: /books, /books/all, /books/<section>, /books/item/<id>. The Worker serves this same page for all of them. */
(function(){
  var root = document.getElementById('shelf'); if(!root) return;
  var CFG = JSON.parse(document.getElementById('shelf-cfg').textContent);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DATA = [], SECTIONS = [], byId = {}, cellOwners = {}, sectCells = {}, sectLoc = {}, counts = {}, updated = null, state = 'loading';
  var ARR = '<span class="arr" aria-hidden="true">→</span>';
  var SEARCH_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';
  var app = document.getElementById('shelf-app');

  function slug(s){ return s.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function money(d){ if(d.p == null) return 'Ask in store'; var s = '$' + (d.p/100).toFixed(d.p % 100 ? 2 : 0); return d.pv ? 'from ' + s : s; }
  function lvlGroup(l){ if(!l) return null; if(/^easy/i.test(l)) return 'Easy read'; if(/^(moderate|intermediate|accessible|medium)/i.test(l)) return 'Moderate'; return 'In depth'; }
  function tradGroup(t){ if(!t) return null; if(/coptic/i.test(t)) return 'Coptic Orthodox'; if(/early church/i.test(t)) return 'Early Church'; if(/orthodox/i.test(t)) return 'Orthodox'; return 'Wider Christian'; }
  function availability(d){
    var q = d.q;
    if(q == null) return {on:true, txt:'Ask in store', long:'Ask us whether it’s in.'};
    if(q <= 0) return {on:false, txt:'Can order in', long:'Not on the shelf right now. We can order it in for you.'};
    if(q <= 2) return {on:true, txt:(q === 1 ? '1' : '2') + ' on the shelf', long:(q === 1 ? 'One copy' : 'Two copies') + ' on the shelf at Ramsgate.'};
    return {on:true, txt:'On the shelf', long:'On the shelf at Ramsgate.'};
  }
  function cover(d, lazy){
    if(d.img) return '<img src="' + esc(d.img) + '" alt="' + (d.kind === 'gift' ? esc(d.t) : 'Cover of ' + esc(d.t)) + '"' + (lazy === false ? '' : ' loading="lazy"') + ' decoding="async">';
    return '<div class="bk-tc"><small>' + esc(d.c) + '</small><span>' + esc(d.t) + '</span></div>';
  }
  function card(d){
    var a = availability(d);
    return '<a class="bk-card" href="/books/item/' + d.id + '"><div class="bk-plinth' + (d.kind === 'gift' && d.img ? ' bk-photo' : '') + '">' + cover(d) + '</div>'
      + '<div class="bk-t">' + esc(d.t) + '</div>' + (d.a ? '<div class="bk-a">' + esc(d.a) + '</div>' : '')
      + '<div class="bk-m"><span class="bk-price">' + money(d) + '</span><span class="bk-avail"><span class="bk-dot' + (a.on ? '' : ' bk-out') + '"></span>' + a.txt + '</span></div></a>';
  }
  function shelfMap(o){
    o = o || {}; var pin = {}, h = '<div class="bk-case"><div class="bk-shelves"' + (o.interactive ? ' id="bk-bigmap"' : '') + '>';
    (o.pin || []).forEach(function(k){ pin[k] = 1; });
    for(var r = 1; r <= 5; r++) for(var c = 1; c <= 10; c++){
      var k = c + ':' + r, own = cellOwners[k] ? Object.keys(cellOwners[k]) : [];
      var on = pin[k] || (o.sect && sectCells[o.sect] && sectCells[o.sect][k]);
      var sp = ''; for(var i = 0; i < 3 + ((c*7 + r*3) % 4); i++) sp += '<i style="height:' + (48 + ((c*13 + r*7 + i*29) % 40)) + '%"></i>';
      var btn = o.interactive && own.length;
      h += '<' + (btn ? 'button type="button"' : 'div') + ' class="bk-cell' + (own.length ? ' bk-own' : '') + (on ? ' bk-on' : '') + (pin[k] ? ' bk-pinned' : '') + '" data-k="' + k + '"'
        + (own.length ? ' title="' + esc(own.join(', ')) + '" data-s="' + esc(own[0]) + '"' : '')
        + (btn ? ' aria-label="Column ' + c + ', row ' + r + ': ' + esc(own.join(', ')) + '"' : ' aria-hidden="true"') + '>' + sp + '</' + (btn ? 'button' : 'div') + '>';
    }
    h += '</div>';
    if(o.labels !== false){ h += '<div class="bk-cols" aria-hidden="true">'; for(var n = 1; n <= 10; n++) h += '<span>' + n + '</span>'; h += '</div>'; }
    return h + '</div>';
  }
  function updatedText(){
    if(!updated) return '';
    var d = new Date(updated), now = new Date(), mins = Math.round((now - d) / 60000);
    if(mins < 2) return 'Updated from the shop just now';
    if(mins < 60) return 'Updated from the shop ' + mins + ' minutes ago';
    return 'Updated from the shop at ' + d.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit', timeZone:'Australia/Sydney'}).replace(' ', '').toLowerCase();
  }

  /* ---------- Views ---------- */
  function home(){
    var begin = (CFG.begin || []).filter(function(b){ return counts[b.section]; }).map(function(b){
      var picks = DATA.filter(function(d){ return d.c === b.section && d.img; }).slice(0, 3);
      var fan = picks.map(function(d, i){ return '<img src="' + esc(d.img) + '" alt="" loading="lazy" style="left:' + (i*30) + 'px;transform:rotate(' + ((i-1)*4) + 'deg);z-index:' + (i === 1 ? 2 : 1) + '">'; }).join('');
      return '<a href="/books/' + slug(b.section) + '"><div class="bk-fan" aria-hidden="true">' + fan + '</div><span class="bk-q">' + esc(b.question) + '</span><span class="bk-to">' + esc(b.section) + ' ' + ARR + '</span></a>';
    }).join('');
    var fresh = DATA.filter(function(d){ return d.kind === 'book' && d.img; }).sort(function(a, b){ return (b.added || '').localeCompare(a.added || ''); }).slice(0, 10);
    var mapped = SECTIONS.filter(function(s){ return sectCells[s]; });
    var legend = mapped.map(function(s){ return '<li><a href="/books/' + slug(s) + '" data-hl="' + esc(s) + '">' + esc(s) + '<span>' + esc((sectLoc[s] || '').replace(/Column/g, 'Col.').replace(/Rows?/g, 'R')) + '</span></a></li>'; }).join('')
      + SECTIONS.filter(function(s){ return !sectCells[s]; }).map(function(s){ return '<li><a href="/books/' + slug(s) + '">' + esc(s) + '<span>' + (s === 'Gifts' ? 'around the shop' : counts[s] + (counts[s] === 1 ? ' title' : ' titles')) + '</span></a></li>'; }).join('');
    return '<section class="bk-hero"><div class="wrap bk-g"><div><span class="eyebrow">Books &amp; gifts</span>'
      + '<h1>Browse the shelves <em>before you visit</em></h1>'
      + '<p class="bk-lede">Every book and gift in the shop, straight from our shelves in Ramsgate. Find something here, then come in, take it down and turn the pages.</p>'
      + '<button class="bk-search" type="button" data-search>' + SEARCH_SVG + '<span>Search by title, author, ISBN or topic</span><kbd>/</kbd></button>'
      + (updated ? '<p class="bk-updated"><span class="bk-pulse" aria-hidden="true"></span>' + updatedText() + '</p>' : '')
      + '</div><figure><img src="/img/URM_Bookshop-4-1200.webp" srcset="/img/URM_Bookshop-4-800.webp 800w, /img/URM_Bookshop-4-1200.webp 1200w, /img/URM_Bookshop-4-1600.webp 1600w" sizes="(max-width:860px) 100vw, 46vw" alt="Timber bookshelves lining the shop at Upper Room, Ramsgate"><figcaption>The shelves at Ramsgate</figcaption></figure></div></section>'
      + (begin ? '<section class="band" style="padding-top:clamp(24px,3vw,40px)"><div class="wrap"><div class="bk-shead"><div><span class="eyebrow">Where to begin</span><h2>What brings you in?</h2></div><p>Not sure where to start? Pick whichever fits. You can always ask us at the counter, too.</p></div><div class="bk-begin">' + begin + '</div></div></section>' : '')
      + (fresh.length ? '<section class="band alt"><div class="wrap"><div class="bk-shead"><div><span class="eyebrow">New on the shelves</span><h2>Recently arrived</h2></div><a class="tlink" href="/books/all">See all books ' + ARR + '</a></div><div class="bk-rail">' + fresh.map(card).join('') + '</div></div></section>' : '')
      + '<section class="band"><div class="wrap"><div class="bk-shead"><div><span class="eyebrow">Find your way</span><h2>The shop, shelf by shelf</h2></div><p>This is the long bookcase at Ramsgate. Choose a section to browse it, and every book shows exactly which shelf it lives on.</p></div>'
      + (mapped.length ? shelfMap({interactive:true}) + '<div class="bk-rows-l"><span>' + esc(CFG.map_note_columns || '') + '</span><span>' + esc(CFG.map_note_rows || '') + '</span></div>' : '')
      + '<ul class="bk-legend">' + legend + '</ul></div></section>'
      + askBand();
  }
  function askBand(){
    return '<section class="band alt"><div class="wrap bk-ask"><figure><img src="/img/URM_Bookshop-25-800.webp" alt="A visitor reading at a cafe table with a coffee" loading="lazy"></figure>'
      + '<div><span class="eyebrow">Can’t see it here?</span><h2>Ask us. We’re happy to help you find the right book.</h2>'
      + '<p>If a book isn’t on the shelf, we can usually order it in. Tell us what you’re looking for, or who it’s for, and we’ll suggest a few to look at next time you’re in.</p>'
      + '<div class="bk-acts" style="margin-top:26px"><a class="btn" href="/contact">Send us a note ' + ARR + '</a><a class="btn bk-ghostbtn" href="/visit/ramsgate">Visit Ramsgate</a></div></div></div></section>';
  }

  var F = {lvl:{}, trad:{}, now:false, sort:'az'};
  function listing(sect){
    var items = DATA.filter(function(d){ return !sect || d.c === sect; });
    var LV = ['Easy read','Moderate','In depth'], TR = ['Coptic Orthodox','Orthodox','Early Church','Wider Christian'];
    var lvls = LV.filter(function(l){ return items.some(function(d){ return lvlGroup(d.lvl) === l; }); });
    var trads = TR.filter(function(t){ return items.some(function(d){ return tradGroup(d.trad) === t; }); });
    var title = sect || 'All books & gifts';
    var sub = sect ? (CFG.sections[sect] || '') : 'Everything on the shelves at Ramsgate, from first prayer books to the Desert Fathers.';
    var where = sect && sectCells[sect] ? '<div class="bk-where">' + shelfMap({sect:sect, labels:false}) + '<span>Find it at ' + esc(sectLoc[sect]) + '</span></div>' : '';
    var chip = function(f, v, on){ return '<button class="bk-chip" type="button" data-f="' + f + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '">' + esc(v) + '</button>'; };
    return '<div class="wrap"><nav class="bk-crumbs" aria-label="Breadcrumb"><a href="/books">Books &amp; gifts</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(title) + '</span></nav>'
      + '<div class="bk-lhead"><div><span class="eyebrow">' + (sect ? 'Section' : 'Browse') + '</span><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' + where + '</div>'
      + (!sect ? '<div class="bk-secnav">' + SECTIONS.map(function(s){ return '<a class="bk-chip" href="/books/' + slug(s) + '">' + esc(s) + '</a>'; }).join('') + '</div>' : '')
      + '<div class="bk-tools"><div class="bk-chips">'
      + (lvls.length > 1 ? '<span class="bk-lbl">Reading</span>' + lvls.map(function(l){ return chip('lvl', l, F.lvl[l]); }).join('') + '<span class="bk-sep"></span>' : '')
      + (trads.length > 1 ? '<span class="bk-lbl">Tradition</span>' + trads.map(function(t){ return chip('trad', t, F.trad[t]); }).join('') + '<span class="bk-sep"></span>' : '')
      + '<button class="bk-chip" type="button" data-f="now" aria-pressed="' + F.now + '">On the shelf now</button>'
      + '<button class="bk-chip" type="button" data-search aria-label="Search">Search</button></div>'
      + '<label class="bk-sort" for="bk-sort">Sort <select id="bk-sort"><option value="az">Title A–Z</option><option value="new">Newest first</option><option value="lo">Price, low to high</option><option value="hi">Price, high to low</option></select></label></div>'
      + '<p class="bk-count" id="bk-count" aria-live="polite"></p><div class="bk-grid" id="bk-grid"></div><div style="height:clamp(56px,8vw,96px)"></div></div>';
  }
  function sortKey(t){ return t.replace(/^[“"‘']+/, '').replace(/^(The|A|An) /i, '').toLowerCase(); }
  function applyFilters(sect){
    var anyL = Object.keys(F.lvl).length, anyT = Object.keys(F.trad).length;
    var items = DATA.filter(function(d){ return (!sect || d.c === sect) && (!anyL || F.lvl[lvlGroup(d.lvl)]) && (!anyT || F.trad[tradGroup(d.trad)]) && (!F.now || d.q == null || d.q > 0); });
    var s = F.sort;
    items.sort(function(a, b){
      if(s === 'lo') return (a.p == null ? 1e9 : a.p) - (b.p == null ? 1e9 : b.p);
      if(s === 'hi') return (b.p == null ? -1 : b.p) - (a.p == null ? -1 : a.p);
      if(s === 'new') return (b.added || '').localeCompare(a.added || '');
      return sortKey(a.t).localeCompare(sortKey(b.t));
    });
    var gifts = sect && DATA.some(function(d){ return d.c === sect && d.kind === 'gift'; });
    document.getElementById('bk-count').textContent = items.length + ' ' + (gifts ? (items.length === 1 ? 'gift' : 'gifts') : (items.length === 1 ? 'title' : 'titles'));
    var g = document.getElementById('bk-grid');
    g.innerHTML = items.length ? items.map(card).join('') : '<div class="bk-empty" style="grid-column:1/-1"><p class="bk-big">Nothing matches all of those just now.</p><button class="tlink" type="button" id="bk-clr" style="border:0;cursor:pointer">Clear the filters ' + ARR + '</button></div>';
    var clr = document.getElementById('bk-clr'); if(clr) clr.onclick = function(){ F.lvl = {}; F.trad = {}; F.now = false; render(); };
  }

  function item(d){
    var a = availability(d);
    var same = DATA.filter(function(x){ return x.c === d.c && x.id !== d.id; }).slice(0, 10);
    var facts = [['Best for', d.best], ['Reading', d.lvl], ['Tradition', d.trad], ['Section', '<a href="/books/' + slug(d.c) + '">' + esc(d.c) + '</a>'], ['ISBN', d.isbn]].filter(function(f){ return f[1]; });
    var kindWord = d.kind === 'gift' ? 'item' : 'book';
    var checkout = CFG.online_checkout && CFG.checkout_url && a.on && d.p;
    var findit = d.shelf
      ? '<div class="bk-findit"><div><h3>Where to find it</h3><p>' + esc(d.c) + '<br>' + esc(d.shelf.loc.replace(/Rows?/g, function(m){ return m.toLowerCase(); })) + '</p></div>' + shelfMap({pin:d.shelf.cells}) + '</div>'
      : '<div class="bk-findit bk-one"><div><h3>Where to find it</h3><p>' + esc(d.kind === 'gift' ? CFG.gifts_where : 'Ask anyone at the counter and we’ll show you where it is.') + '</p></div></div>';
    return '<div class="wrap"><nav class="bk-crumbs" aria-label="Breadcrumb"><a href="/books">Books &amp; gifts</a><span aria-hidden="true">/</span><a href="/books/' + slug(d.c) + '">' + esc(d.c) + '</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(d.t) + '</span></nav>'
      + '<article class="bk-item"><div class="bk-stage"><div class="bk-plinth' + (d.kind === 'gift' && d.img ? ' bk-photo' : '') + '">' + cover(d, false) + '</div></div>'
      + '<div class="bk-info"><span class="eyebrow">' + esc(d.c) + '</span><h1>' + esc(d.t) + '</h1>' + (d.a ? '<p class="bk-by">by ' + esc(d.a) + '</p>' : '')
      + (d.lede ? '<p class="bk-lede">' + esc(d.lede) + '</p>' : '') + (d.more ? '<p class="bk-body">' + esc(d.more) + '</p>' : '')
      + '<div class="bk-buy"><div class="bk-top"><span class="bk-pr">' + money(d) + '</span><span class="bk-st"><span class="bk-dot' + (a.on ? '' : ' bk-out') + '"></span>' + a.long + '</span></div>'
      + '<div class="bk-acts"><button class="btn" type="button" data-hold="' + (a.on ? 'hold' : 'order') + '">' + (a.on ? 'Put one aside for me' : 'Ask us to order it in') + ' ' + ARR + '</button>'
      + (checkout ? '<a class="btn bk-ghostbtn" href="' + esc(CFG.checkout_url) + '">Buy online, collect in store</a>' : '')
      + '<button class="btn bk-ghostbtn" type="button" data-hold="ask">Ask about this ' + kindWord + '</button></div>'
      + '<div class="bk-hold" id="bk-hold" hidden></div>'
      + '<p class="bk-note">' + esc(a.on ? CFG.hold_note : CFG.order_note) + '</p></div>'
      + findit
      + (facts.length ? '<dl class="bk-facts">' + facts.map(function(f){ return '<dt>' + f[0] + '</dt><dd>' + (f[0] === 'Section' ? f[1] : esc(f[1])) + '</dd>'; }).join('') + '</dl>' : '')
      + '</div></article></div>'
      + (same.length ? '<section class="band alt" style="padding-block:clamp(48px,6vw,80px)"><div class="wrap"><div class="bk-shead"><div><span class="eyebrow">From the same shelf</span><h2>More in ' + esc(d.c) + '</h2></div><a class="tlink" href="/books/' + slug(d.c) + '">See the whole section ' + ARR + '</a></div><div class="bk-rail">' + same.map(card).join('') + '</div></div></section>' : '');
  }

  /* Hold, order and question requests go through the site's contact form handler (/api/contact). */
  var tsLoading = null;
  function turnstile(){
    if(window.turnstile) return Promise.resolve(window.turnstile);
    if(!tsLoading) tsLoading = new Promise(function(res, rej){ var s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.onload = function(){ res(window.turnstile); }; s.onerror = rej; document.head.appendChild(s); });
    return tsLoading;
  }
  function holdForm(d, mode){
    var box = document.getElementById('bk-hold'); box.hidden = false;
    var head = {hold:'We’ll set a copy aside for you at Ramsgate.', order:'We’ll order a copy in for you.', ask:'Ask us anything about this ' + (d.kind === 'gift' ? 'item' : 'book') + '.'}[mode];
    var btn = {hold:'Put it aside', order:'Send request', ask:'Send question'}[mode];
    box.innerHTML = '<form id="bk-hf" style="display:grid;gap:14px" novalidate><p class="bk-h">' + head + '</p>'
      + '<div class="bk-f"><label for="bk-hn">Your name<input id="bk-hn" name="name" autocomplete="name" required maxlength="120"></label><label for="bk-he">Email<input id="bk-he" name="email" type="email" autocomplete="email" required maxlength="200"></label></div>'
      + '<label for="bk-hp">Mobile (optional, if you’d like a text)<input id="bk-hp" name="phone" type="tel" autocomplete="tel" maxlength="40"></label>'
      + '<label for="bk-hm">' + (mode === 'ask' ? 'Your question' : 'Anything else? (optional)') + '<textarea id="bk-hm" name="note" maxlength="2000"' + (mode === 'ask' ? ' required' : '') + '></textarea></label>'
      + '<div class="hp" aria-hidden="true"><label for="bk-hw">Leave this empty<input id="bk-hw" name="website" tabindex="-1" autocomplete="off"></label></div>'
      + '<div id="bk-ts"></div>'
      + '<div class="bk-acts"><button class="btn" type="submit">' + btn + ' ' + ARR + '</button><button class="btn bk-ghostbtn" type="button" id="bk-hx">Cancel</button></div>'
      + '<p class="formerr" role="alert" hidden>Sorry, that didn’t send. Please try again, or call us on ' + esc(CFG.phone) + '.</p></form>';
    var f = document.getElementById('bk-hf'), widget = null;
    document.getElementById('bk-hn').focus();
    turnstile().then(function(ts){ widget = ts.render('#bk-ts', {sitekey:CFG.turnstile, theme:'auto', size:'flexible'}); }).catch(function(){});
    document.getElementById('bk-hx').onclick = function(){ box.hidden = true; box.innerHTML = ''; };
    f.onsubmit = function(e){
      e.preventDefault();
      var name = f.elements.name.value.trim(), email = f.elements.email.value.trim(), note = f.elements.note.value.trim();
      var err = f.querySelector('.formerr');
      if(!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (mode === 'ask' && !note)){ err.textContent = 'Please add your name, a valid email' + (mode === 'ask' ? ' and your question' : '') + '.'; err.hidden = false; return; }
      var fd = new FormData(f);
      fd.set('loc', 'Ramsgate');
      fd.set('topic', ({hold:'Please put aside', order:'Please order in', ask:'Question about'})[mode] + ': ' + d.t);
      fd.set('message', [
        ({hold:'Please put a copy aside for me to collect.', order:'Please order a copy in for me.', ask:'Question:'})[mode],
        mode === 'ask' ? note : '',
        '', d.t + (d.a ? ' by ' + d.a : ''), 'Price: ' + money(d), d.isbn ? 'ISBN: ' + d.isbn : '', d.shelf ? 'Shelf: ' + d.c + ', ' + d.shelf.loc : 'Section: ' + d.c,
        'Stock shown on the website: ' + availability(d).long,
        f.elements.phone.value.trim() ? 'Mobile: ' + f.elements.phone.value.trim() : '', mode !== 'ask' && note ? '\nNote: ' + note : '',
        location.origin + '/books/item/' + d.id
      ].filter(Boolean).join('\n'));
      ['phone', 'note'].forEach(function(k){ fd.delete(k); });
      var sb = f.querySelector('[type=submit]'); sb.disabled = true; err.hidden = true;
      fetch('/api/contact', {method:'POST', body:fd, headers:{'Accept':'application/json'}})
        .then(function(r){ return r.json().catch(function(){ return {ok:false}; }); })
        .then(function(j){
          if(j && j.ok){ box.innerHTML = '<p class="bk-ok">Thank you, ' + esc(name) + '. ' + ({hold:'We’ll put <em>' + esc(d.t) + '</em> aside and email you to confirm.', order:'We’ve got your request for <em>' + esc(d.t) + '</em> and will email you about it soon.', ask:'We’ve got your question and will reply by email soon.'})[mode] + '</p>'; }
          else { err.textContent = 'Sorry, that didn’t send. Please try again, or call us on ' + CFG.phone + '.'; err.hidden = false; sb.disabled = false; try{ window.turnstile && widget != null && window.turnstile.reset(widget); }catch(x){} }
        })
        .catch(function(){ err.hidden = false; sb.disabled = false; });
    };
  }

  function loadingView(){
    var ghost = ''; for(var i = 0; i < 10; i++) ghost += '<div class="bk-card bk-ghost" aria-hidden="true"><div class="bk-plinth"></div><div class="bk-t">&nbsp;</div><div class="bk-a">&nbsp;</div></div>';
    return '<div class="wrap" style="padding-block:40px 80px"><p class="bk-count" role="status">Taking the books off the shelf…</p><div class="bk-grid">' + ghost + '</div></div>';
  }
  function errorView(){
    return '<div class="wrap"><div class="bk-empty" style="padding-block:clamp(60px,10vw,120px)"><span class="eyebrow">Books &amp; gifts</span><p class="bk-big">Our online shelves aren’t loading just now.</p>'
      + '<p class="bk-muted" style="max-width:46ch">The shop itself is open ' + esc(CFG.hours) + '. Call us on ' + esc(CFG.phone) + ' and we’ll happily check whether a book is in.</p>'
      + '<div class="bk-acts" style="justify-content:center;margin-top:10px"><button class="btn" type="button" id="bk-retry">Try again ' + ARR + '</button><a class="btn bk-ghostbtn" href="/visit/ramsgate">Hours and directions</a></div></div></div>';
  }
  function notFound(){
    return '<div class="wrap"><div class="bk-empty" style="padding-block:clamp(60px,10vw,120px)"><p class="bk-big">We can’t find that one on our shelves any more.</p><p class="bk-muted">It may have sold out or moved. Have a look around, or ask us.</p><div class="bk-acts" style="justify-content:center"><a class="btn" href="/books">Browse the shelves ' + ARR + '</a><button class="btn bk-ghostbtn" type="button" data-search>Search</button></div></div></div>';
  }

  /* ---------- Router ---------- */
  var lastSect = null, baseTitle = document.title;
  function parts(){ return location.pathname.replace(/\/+$/, '').split('/').slice(2); }
  function render(){
    var p = parts(), html, after = function(){}, title = baseTitle;
    if(state === 'loading') html = loadingView();
    else if(state === 'error'){ html = errorView(); after = function(){ document.getElementById('bk-retry').onclick = load; }; }
    else if(p[0] === 'item'){
      var d = byId[(p[1] || '').toLowerCase()];
      if(d){ html = item(d); title = d.t + (d.a ? ' by ' + d.a : '') + ' | Upper Room Ramsgate';
        after = function(){ app.querySelectorAll('[data-hold]').forEach(function(b){ b.onclick = function(){ holdForm(d, b.dataset.hold); }; }); };
      } else html = notFound();
    } else if(p[0]){
      var sect = p[0] === 'all' ? null : SECTIONS.filter(function(s){ return slug(s) === p[0]; })[0];
      if(p[0] !== 'all' && !sect) html = notFound();
      else {
        if(sect !== lastSect){ F.lvl = {}; F.trad = {}; F.now = false; }
        lastSect = sect; title = (sect || 'All books & gifts') + ' | Books & gifts at Upper Room';
        html = listing(sect);
        after = function(){
          applyFilters(sect);
          var so = document.getElementById('bk-sort'); so.value = F.sort; so.onchange = function(){ F.sort = so.value; applyFilters(sect); };
          app.querySelectorAll('[data-f]').forEach(function(b){ b.onclick = function(){
            var f = b.dataset.f, v = b.dataset.v;
            if(f === 'now') F.now = !F.now; else { if(F[f][v]) delete F[f][v]; else F[f][v] = 1; }
            b.setAttribute('aria-pressed', f === 'now' ? F.now : !!F[f][v]); applyFilters(sect);
          }; });
        };
      }
    } else { html = home(); after = wireMap; }
    app.innerHTML = '<div class="bk-view">' + html + '</div>';
    document.title = title;
    after();
  }
  function go(href){ history.pushState({}, '', href); render(); window.scrollTo(0, 0); }
  root.addEventListener('click', function(e){
    var s = e.target.closest('[data-search]'); if(s){ e.preventDefault(); openSearch(); return; }
    var a = e.target.closest('a[href^="/books"]');
    if(!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    e.preventDefault(); closeSearch(); go(a.getAttribute('href'));
  });
  window.addEventListener('popstate', render);
  function wireMap(){
    var map = document.getElementById('bk-bigmap'); if(!map) return;
    var cells = [].slice.call(map.querySelectorAll('.bk-cell')), links = [].slice.call(app.querySelectorAll('[data-hl]'));
    function hl(s){ cells.forEach(function(c){ c.classList.toggle('bk-on', !!s && !!sectCells[s] && !!sectCells[s][c.dataset.k]); }); links.forEach(function(l){ l.classList.toggle('bk-hl', l.dataset.hl === s); }); }
    cells.forEach(function(c){ if(!c.dataset.s) return; var first = c.dataset.s;
      c.onmouseenter = c.onfocus = function(){ hl(first); }; c.onmouseleave = c.onblur = function(){ hl(null); };
      c.onclick = function(){ go('/books/' + slug(first)); }; });
    links.forEach(function(l){ l.onmouseenter = l.onfocus = function(){ hl(l.dataset.hl); }; l.onmouseleave = l.onblur = function(){ hl(null); }; });
  }

  /* ---------- Search ---------- */
  var sheet = document.getElementById('bk-sheet'), qi = document.getElementById('bk-q'), res = document.getElementById('bk-res'), sel = 0, opener = null;
  function openSearch(){ if(state !== 'ready') return; opener = document.activeElement; sheet.hidden = false; qi.value = ''; renderSearch(); qi.focus(); setTimeout(function(){ qi.focus(); }, 10); }
  function closeSearch(){ if(sheet.hidden) return; sheet.hidden = true; if(opener && opener.focus && document.contains(opener)) opener.focus(); }
  function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[“”"’'.]/g, ''); }
  function mk(t, q){ if(!q) return esc(t); var i = norm(t).indexOf(q); if(i < 0) return esc(t); return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); }
  function renderSearch(){
    var q = norm(qi.value.trim()); sel = 0;
    if(!q){
      var authors = {}; DATA.forEach(function(d){ if(d.a) authors[d.a] = (authors[d.a] || 0) + 1; });
      var top = Object.keys(authors).sort(function(a, b){ return authors[b] - authors[a]; }).slice(0, 4);
      res.innerHTML = '<h4>Try</h4><div class="bk-sugg">' + ['Saints', 'Prayer', 'Confession'].concat(top).map(function(s){ return '<button class="bk-chip" type="button" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>'
        + '<h4>Sections</h4><div class="bk-sugg">' + SECTIONS.map(function(s){ return '<a class="bk-chip" href="/books/' + slug(s) + '">' + esc(s) + '</a>'; }).join('') + '</div>';
      res.querySelectorAll('[data-q]').forEach(function(b){ b.onclick = function(){ qi.value = b.dataset.q; renderSearch(); qi.focus(); }; });
      return;
    }
    var words = q.split(/\s+/);
    function score(d){ var hay = norm([d.t, d.a, d.c, d.isbn, d.lede, d.best, d.trad].join(' ')); if(!words.every(function(w){ return hay.indexOf(w) > -1; })) return -1;
      var s = 1, t = norm(d.t), a = norm(d.a); if(t.indexOf(q) > -1) s += 10; if(a.indexOf(q) > -1) s += 8; if(t.indexOf(q) === 0) s += 4; if(d.isbn === q) s += 20; return s; }
    var hits = DATA.map(function(d){ return [score(d), d]; }).filter(function(x){ return x[0] > 0; }).sort(function(a, b){ return b[0] - a[0]; }).slice(0, 12).map(function(x){ return x[1]; });
    var secs = SECTIONS.filter(function(s){ return norm(s).indexOf(q) > -1; });
    var h = '';
    if(secs.length) h += '<h4>Sections</h4>' + secs.map(function(s){ return '<a class="bk-hit" href="/books/' + slug(s) + '"><div class="bk-tc" style="height:40px;aspect-ratio:auto"></div><div><div class="bk-tt">' + mk(s, q) + '</div><div class="bk-ss">' + counts[s] + (s === 'Gifts' ? ' gifts' : ' titles') + '</div></div><span></span></a>'; }).join('');
    if(hits.length) h += '<h4>Books &amp; gifts</h4>' + hits.map(function(d){ var a = availability(d); return '<a class="bk-hit" href="/books/item/' + d.id + '">' + (d.img ? '<img src="' + esc(d.img) + '" alt="" loading="lazy">' : '<div class="bk-tc"></div>') + '<div style="min-width:0"><div class="bk-tt">' + mk(d.t, q) + '</div><div class="bk-ss">' + (d.a ? mk(d.a, q) + ' · ' : '') + esc(d.c) + '</div></div><span class="bk-avail"><span class="bk-dot' + (a.on ? '' : ' bk-out') + '"></span>' + money(d) + '</span></a>'; }).join('');
    if(!h) h = '<div class="bk-empty"><p class="bk-big">Nothing on our shelves matches “' + esc(qi.value) + '”.</p><p class="bk-muted">We can often order books in. <a href="/contact">Ask us about it</a>.</p></div>';
    res.innerHTML = h; mark();
  }
  function mark(){ [].slice.call(res.querySelectorAll('.bk-hit')).forEach(function(x, i){ x.classList.toggle('bk-sel', i === sel); }); }
  qi.addEventListener('input', renderSearch);
  qi.addEventListener('keydown', function(e){
    var hs = [].slice.call(res.querySelectorAll('.bk-hit'));
    if(e.key === 'ArrowDown'){ sel = Math.min(sel + 1, hs.length - 1); mark(); e.preventDefault(); }
    else if(e.key === 'ArrowUp'){ sel = Math.max(sel - 1, 0); mark(); e.preventDefault(); }
    else if(e.key === 'Enter' && hs[sel]){ e.preventDefault(); var href = hs[sel].getAttribute('href'); closeSearch(); go(href); }
  });
  sheet.addEventListener('click', function(e){ if(e.target === sheet) closeSearch(); });
  document.getElementById('bk-qx').onclick = closeSearch;
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !sheet.hidden) closeSearch();
    if(e.key === '/' && sheet.hidden && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')){ e.preventDefault(); openSearch(); }
  });

  /* ---------- Data ---------- */
  function ingest(j){
    DATA = j.items || []; SECTIONS = j.sections || []; updated = j.updated || null;
    byId = {}; cellOwners = {}; sectCells = {}; sectLoc = {}; counts = {};
    DATA.forEach(function(d){
      byId[d.id] = d; counts[d.c] = (counts[d.c] || 0) + 1;
      if(!d.shelf) return;
      sectCells[d.c] = sectCells[d.c] || {};
      if(!sectLoc[d.c]) sectLoc[d.c] = d.shelf.loc;
      d.shelf.cells.forEach(function(k){ sectCells[d.c][k] = 1; (cellOwners[k] = cellOwners[k] || {})[d.c] = 1; });
    });
  }
  function load(){
    state = 'loading'; render();
    fetch('/api/catalogue', {headers:{'Accept':'application/json'}})
      .then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(j){ if(!j || !j.items || !j.items.length) throw 0; ingest(j); state = 'ready'; render(); })
      .catch(function(){ state = 'error'; render(); });
  }
  load();
})();
