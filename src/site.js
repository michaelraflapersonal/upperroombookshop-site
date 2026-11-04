(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s,r){return (r||document).querySelector(s)}, $$ = function(s,r){return [].slice.call((r||document).querySelectorAll(s))};

  /* Header: transparent over the opening photograph, solid after it */
  var hdr = $('#hdr'), first = $('main > section');
  function onHdr(){ var t = first ? first.offsetHeight - 90 : 200; hdr.classList.toggle('solid', window.scrollY > t); }
  onHdr(); window.addEventListener('scroll', onHdr, {passive:true}); window.addEventListener('resize', onHdr);

  /* Mobile menu */
  var mnav = $('#mnav');
  $$('[data-menu]').forEach(function(b){ b.addEventListener('click', function(){ var o = !mnav.classList.contains('open'); mnav.classList.toggle('open', o); $$('[data-menu]').forEach(function(x){x.setAttribute('aria-expanded', o)}); if(o){ var c=$('.close',mnav); c&&c.focus(); } }); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ mnav && mnav.classList.remove('open'); closeLb(); } });

  /* Gentle fade between pages */
  if(!reduce){ $$('a[href^="/"]:not([href^="//"])').filter(function(a){ var h=a.getAttribute('href'); return h.indexOf('#')<0 && h.indexOf('/api/')!==0; }).forEach(function(a){ a.addEventListener('click', function(e){ if(e.metaKey||e.ctrlKey||e.shiftKey||a.target) return; e.preventDefault(); document.body.classList.add('leaving'); setTimeout(function(){ location.href = a.getAttribute('href'); }, 260); }); }); }
  window.addEventListener('pageshow', function(){ document.body.classList.remove('leaving'); });

  /* Sydney time helpers */
  function syd(){ return new Date(new Date().toLocaleString('en-US',{timeZone:'Australia/Sydney'})); }
  function fmt(x){ return (x%12||12)+(x<12?'am':'pm'); }
  var DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* Open-now lines: weekly hours plus holiday or one-off changes, always in Sydney time */
  function ymd(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function tm(x){ var h=Math.floor(x), m=Math.round((x-h)*60); return (h%12||12)+(m?':'+('0'+m).slice(-2):'')+(h<12?'am':'pm'); }
  function hoursOn(date, map, special){
    var s = special[ymd(date)];
    if(s) return s.closed ? null : [s.open, s.close];
    return map[date.getDay()] || null;
  }
  function parseHours(el){
    var map = {}; el.dataset.hours.split(',').forEach(function(p){ var d=p.split(':'), h=d[1].split('-'); map[d[0]]=[+h[0],+h[1]]; });
    var special = {}; try{ special = JSON.parse(el.dataset.special || '{}'); }catch(e){}
    return {map:map, special:special};
  }
  $$('[data-hours]').forEach(function(el){
    try{
      var H = parseHours(el), now = syd(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var t = hoursOn(today, H.map, H.special), h = now.getHours() + now.getMinutes()/60, msg, cls = '';
      var sp = H.special[ymd(today)];
      if(t && h >= t[0] && h < t[1]){
        if(t[1] - h <= 0.5){ msg = 'Closing soon · until ' + tm(t[1]); cls = 'soon'; }
        else msg = 'Open now · until ' + tm(t[1]) + (sp && sp.label ? ' (' + sp.label + ')' : '');
      } else {
        var k = (t && h < t[0]) ? 0 : 1, nt = null, nd = null;
        for(; k < 15; k++){ nd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + k); nt = hoursOn(nd, H.map, H.special); if(nt) break; }
        var when = k === 0 ? 'today' : k === 1 ? 'tomorrow' : DAYS[nd.getDay()];
        if(k === 0 && nt[0] - h <= 1){ msg = 'Opening soon · ' + tm(nt[0]); cls = 'soon'; }
        else { msg = (sp && sp.closed ? 'Closed today' + (sp.label ? ' (' + sp.label + ')' : '') : 'Closed now') + ' · opens ' + when + ' ' + tm(nt[0]); cls = 'closed'; }
      }
      el.classList.remove('soon','closed'); if(cls) el.classList.add(cls);
      var out = el.querySelector('[data-out]') || el.querySelector('span'); if(out) out.textContent = msg;
    }catch(e){}
  });
  /* Upcoming holiday or special hours, shown under the hours table */
  $$('[data-special-note]').forEach(function(p){
    try{
      var src = $('[data-special]'); if(!src) return;
      var special = JSON.parse(src.dataset.special || '{}'), now = syd(), start = new Date(now.getFullYear(), now.getMonth(), now.getDate()), lines = [];
      for(var k = 0; k < 60; k++){
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + k), s = special[ymd(d)];
        if(s) lines.push((s.label ? s.label + ', ' : '') + d.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'}) + ': ' + (s.closed ? 'closed' : tm(s.open) + ' – ' + tm(s.close)));
      }
      if(lines.length){ p.textContent = 'Special hours: ' + lines.join(' · '); p.hidden = false; }
    }catch(e){}
  });
  /* Highlight today in hours tables */
  $$('table.hrs').forEach(function(t){ try{ var d=syd().getDay(); $$('tr[data-d]',t).forEach(function(r){ if((' '+r.dataset.d+' ').indexOf(' '+d+' ')>-1) r.classList.add('is-today'); }); }catch(e){} });

  /* Copy buttons */
  $$('[data-copy]').forEach(function(b){ b.addEventListener('click', function(){ var txt=b.dataset.copy; var done=function(){ var o=b.textContent; b.textContent='Copied'; setTimeout(function(){b.textContent=o},1600); }; try{ navigator.clipboard.writeText(txt).then(done, function(){}); }catch(e){} }); });

  /* Forms: show the thank-you or error line in place */
  function done(f, ok){ var t=f.querySelector('.thanks'), e=f.querySelector('.formerr'), b=f.querySelector('[type=submit]');
    if(ok){ if(t) t.hidden=false; if(e) e.hidden=true; b.disabled=true; $$('input,select,textarea',f).forEach(function(i){i.disabled=true}); }
    else { if(e) e.hidden=false; b.disabled=false; } }
  /* Contact form: posts to the Cloudflare function (/api/contact). Without JS it still posts normally. */
  $$('form[data-ajax]').forEach(function(f){ f.addEventListener('submit', function(e){
    if(!window.fetch || !window.FormData) return; e.preventDefault(); f.querySelector('[type=submit]').disabled=true;
    fetch(f.action,{method:'POST',body:new FormData(f),headers:{'Accept':'application/json'}})
      .then(function(r){ return r.json().catch(function(){return {ok:false}}); })
      .then(function(j){ var ok=!!(j&&j.ok); done(f,ok); if(!ok && window.turnstile){ try{ window.turnstile.reset(); }catch(x){} } })
      .catch(function(){ done(f,false); });
  }); });
  /* Narellan sign-up: Mailchimp's JSONP endpoint, so visitors stay on the page */
  $$('form[data-mailchimp]').forEach(function(f){ f.addEventListener('submit', function(e){
    e.preventDefault(); f.querySelector('[type=submit]').disabled=true;
    var cb='mc'+Date.now(), q=$$('input[name]',f).map(function(i){return encodeURIComponent(i.name)+'='+encodeURIComponent(i.value)}).join('&');
    var tag=document.createElement('script'), timer=setTimeout(function(){ finish(false); },12000);
    function finish(ok){ clearTimeout(timer); window[cb]=function(){}; if(tag.parentNode) tag.parentNode.removeChild(tag); done(f,ok); }
    window[cb]=function(r){ finish(!!(r && r.result==='success')); };
    tag.onerror=function(){ finish(false); };
    tag.src=f.action.replace('/subscribe/post?','/subscribe/post-json?')+'&'+q+'&c='+cb;
    document.body.appendChild(tag);
  }); });

  /* Intro words */
  var big=$('[data-words]');
  if(big){ big.innerHTML = big.innerHTML.replace(/(<em>.*?<\/em>|[^\s<]+)/g,function(w){return '<span class="w">'+w+'</span>';}); }

  /* Gallery filter */
  $$('.chip').forEach(function(c){ c.addEventListener('click', function(){ $$('.chip').forEach(function(x){x.setAttribute('aria-pressed','false')}); c.setAttribute('aria-pressed','true'); var f=c.dataset.f; $$('.masonry figure').forEach(function(fg){ fg.hidden = f!=='all' && (' '+fg.dataset.cat+' ').indexOf(' '+f+' ')<0; }); }); });

  /* Lightbox */
  var lb=$('#lb'), shots=$$('.masonry figure'), cur=0;
  function show(i){ var vis=shots.filter(function(f){return !f.hidden}); if(!vis.length) return; cur=(i+vis.length)%vis.length; var f=vis[cur], im=$('img',f); var big=$('img',lb); big.src=im.src; big.alt=im.alt; $('p',lb).textContent=(f.querySelector('figcaption')||{}).textContent||''; }
  function closeLb(){ if(lb){ lb.classList.remove('open'); } }
  if(lb){
    shots.forEach(function(f){ f.tabIndex=0; var go=function(){ var vis=shots.filter(function(x){return !x.hidden}); show(vis.indexOf(f)); lb.classList.add('open'); $('.x',lb).focus(); }; f.addEventListener('click',go); f.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();go();} }); });
    $('.x',lb).addEventListener('click',closeLb); $('.pv',lb).addEventListener('click',function(){show(cur-1)}); $('.nx',lb).addEventListener('click',function(){show(cur+1)});
    lb.addEventListener('click',function(e){ if(e.target===lb) closeLb(); });
    document.addEventListener('keydown',function(e){ if(!lb.classList.contains('open')) return; if(e.key==='ArrowLeft') show(cur-1); if(e.key==='ArrowRight') show(cur+1); });
  }

  /* Instagram strip: swaps the placeholder photos for the latest posts when a Behold feed ID is set in settings.json.
     Any failure leaves the placeholders in place. */
  $$('[data-ig-feed]').forEach(function(sec){
    var id = sec.getAttribute('data-ig-feed'); if(!id) return;
    var grid = $('.igrid', sec), n = parseInt(sec.getAttribute('data-ig-count'),10) || 6, done = false;
    function load(){
      if(done) return; done = true; grid.classList.add('loading');
      fetch('https://feeds.behold.so/' + encodeURIComponent(id)).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(d){
        var posts = (d.posts || d).filter(function(p){ return p && (p.thumbnailUrl || p.mediaUrl) && p.permalink; })
          .sort(function(a,b){ return (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0); }).slice(0, n);  /* newest first */
        if(!posts.length) throw 0;
        var icon = $('.igi', grid), frag = document.createDocumentFragment();
        posts.forEach(function(p){
          var src = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.mediaUrl;
          var alt = (p.prunedCaption || p.caption || 'Photo from Upper Room on Instagram').replace(/\s+/g,' ').slice(0,110);
          var li = document.createElement('li'), a = document.createElement('a'), im = new Image();
          a.href = p.permalink; a.target = '_blank'; a.rel = 'noopener';
          im.src = src; im.alt = alt; im.loading = 'lazy'; im.decoding = 'async';
          a.appendChild(im);
          if(icon) a.appendChild(icon.cloneNode(true));
          li.appendChild(a); frag.appendChild(li);
        });
        grid.innerHTML = ''; grid.appendChild(frag);
      }).catch(function(){}).then(function(){ grid.classList.remove('loading'); });
    }
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ if(es[0].isIntersecting){ io.disconnect(); load(); } }, {rootMargin:'400px'}); io.observe(sec);
    } else load();
  });

  /* Google reviews: use the live rating and reviews when the site's /api/reviews is set up; otherwise keep the built-in markup */
  $$('[data-reviews]').forEach(function(sec){
    var url = sec.getAttribute('data-reviews'), done = false;
    function stars(n){ var s = document.createElement('span'); s.className = 'stars'; s.setAttribute('role','img'); s.setAttribute('aria-label', n + ' out of 5 stars');
      var tpl = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.4l-5.1 2.9L6 11.6 1.7 7.6l5.8-.7z"/></svg>';
      s.innerHTML = new Array(Math.round(n) + 1).join(tpl); return s; }
    function load(){
      if(done) return; done = true;
      fetch(url).then(function(r){ if(r.status !== 200) throw 0; return r.json(); }).then(function(d){
        if(!d || !d.reviews || !d.reviews.length) throw 0;
        var sum = $('[data-rv-sum]', sec);
        if(sum && d.rating){ sum.innerHTML = ''; var b = document.createElement('strong'); b.textContent = d.rating.toFixed(1); sum.appendChild(b); sum.appendChild(stars(d.rating));
          var c = document.createElement('span'); c.textContent = (d.count ? d.count + ' ' : '') + 'Google reviews'; sum.appendChild(c); }
        var grid = $('.rvgrid', sec), frag = document.createDocumentFragment();
        d.reviews.forEach(function(v){
          var li = document.createElement('li'); li.className = 'rvc';
          var q = document.createElement('blockquote'); var t = v.text.replace(/\s+/g,' ').trim(); q.textContent = t.length > 260 ? t.slice(0,257).replace(/\s+\S*$/,'') + '…' : t;
          var w = document.createElement('p'); w.className = 'who'; w.textContent = v.author + (v.when ? ' · ' + v.when : '');
          li.appendChild(stars(v.rating)); li.appendChild(q); li.appendChild(w); frag.appendChild(li);
        });
        grid.innerHTML = ''; grid.appendChild(frag); grid.hidden = false;
      }).catch(function(){});
    }
    if('IntersectionObserver' in window){ var io = new IntersectionObserver(function(es){ if(es[0].isIntersecting){ io.disconnect(); load(); } }, {rootMargin:'400px'}); io.observe(sec); } else load();
  });

  /* Reading progress + chapter list */
  var bar=$('.progress i'), chapters=$$('.chapter[id]');
  if(bar){
    var onRead=function(){ var h=document.documentElement.scrollHeight-innerHeight; bar.style.transform='scaleX('+(h>0?Math.min(1,scrollY/h):0)+')';
      var on=null; chapters.forEach(function(c){ if(c.getBoundingClientRect().top<innerHeight*0.4) on=c.id; }); $$('.toc a').forEach(function(a){ a.classList.toggle('on', a.getAttribute('href')==='#'+on); }); };
    window.addEventListener('scroll',onRead,{passive:true}); onRead();
  }

  var all=$$('.rv,.intro');
  if(reduce || !('IntersectionObserver' in window)){ all.forEach(function(el){el.classList.remove('pre');}); return; }

  /* Reveal: only what starts below the first screen is hidden, so the page is complete at rest */
  all.forEach(function(el){ if(el.getBoundingClientRect().top > innerHeight*0.92) el.classList.add('pre'); });
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) return; var el=e.target;
      if(el.classList.contains('intro')){ $$('.w',el).forEach(function(w,i){ w.style.transitionDelay=(i*55)+'ms'; }); }
      el.classList.remove('pre'); io.unobserve(el); }); },{rootMargin:'0px 0px -10% 0px'});
  all.forEach(function(el){ if(el.classList.contains('pre')) io.observe(el); });
  setTimeout(function(){ all.forEach(function(el){el.classList.remove('pre');}); }, 9000);

  /* Gentle parallax: photographs drift a little slower than the page, within their frames */
  var imgs=$$('img[data-speed]'), ticking=false;
  function px(){ ticking=false; var vh=innerHeight;
    imgs.forEach(function(img){ var box=img.closest('.frame')||img.parentNode, r=box.getBoundingClientRect(); if(r.bottom<-50||r.top>vh+50) return;
      var c=(r.top+r.height/2-vh/2), room=(img.offsetHeight-r.height)/2, y=-c*parseFloat(img.dataset.speed);
      y=Math.max(-room,Math.min(room,y)); img.style.transform='translate3d(0,'+y.toFixed(1)+'px,0)'; }); }
  window.addEventListener('scroll',function(){ if(!ticking){ ticking=true; requestAnimationFrame(px);} },{passive:true});
  window.addEventListener('resize',px); px();

})();
