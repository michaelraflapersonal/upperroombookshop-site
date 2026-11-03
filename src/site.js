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

  /* Open-now lines */
  $$('[data-hours]').forEach(function(el){
    try{
      var now=syd(), map={}; el.dataset.hours.split(',').forEach(function(p){var d=p.split(':'),h=d[1].split('-');map[d[0]]=[+h[0],+h[1]];});
      var d=now.getDay(), t=map[d], h=now.getHours()+now.getMinutes()/60, msg;
      if(t && h>=t[0] && h<t[1]) msg='Open now · until '+fmt(t[1]);
      else { var k = (t && h<t[0]) ? 0 : 1; while(!map[(d+k)%7] && k<7) k++; var nd=(d+k)%7; msg='Closed now · opens '+(k===0?'today':k===1?'tomorrow':DAYS[nd])+' '+fmt(map[nd][0]); el.classList.add('closed'); }
      var out = el.querySelector('[data-out]') || el.querySelector('span'); if(out) out.textContent = msg;
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
