
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: transparent over the hero, solid after */
  var hdr=document.getElementById('hdr');
  function onHdr(){ hdr.classList.toggle('solid', window.scrollY > window.innerHeight*0.6); }
  onHdr(); window.addEventListener('scroll',onHdr,{passive:true});

  /* Open-now line, Sydney time */
  document.querySelectorAll('[data-hours]').forEach(function(el){
    try{
      var now=new Date(new Date().toLocaleString('en-US',{timeZone:'Australia/Sydney'}));
      var map={}; el.dataset.hours.split(',').forEach(function(p){var d=p.split(':'),h=d[1].split('-');map[d[0]]=[+h[0],+h[1]];});
      var t=map[now.getDay()], h=now.getHours()+now.getMinutes()/60, f=function(x){return (x%12||12)+(x<12?'am':'pm');};
      el.querySelector('span').textContent = t&&h>=t[0]&&h<t[1] ? 'Open now · until '+f(t[1]) : 'Closed now · opens '+(map[(now.getDay()+(t&&h<t[0]?0:1))%7]?f(map[(now.getDay()+(t&&h<t[0]?0:1))%7][0]):'Monday 7am');
    }catch(e){}
  });

  /* Split the intro line into words for a soft read-in */
  var big=document.querySelector('[data-words]');
  if(big){ big.innerHTML = big.innerHTML.replace(/(<em>.*?<\/em>|[^\s<]+)/g,function(w){return '<span class="w">'+w+'</span>';}); }

  var all=[].slice.call(document.querySelectorAll('.rv,.intro'));
  if(reduce || !('IntersectionObserver' in window)){ all.forEach(function(el){el.classList.remove('pre');}); return; }

  /* Only hide what is below the first screen; everything else stays visible at rest */
  all.forEach(function(el){ if(el.getBoundingClientRect().top > innerHeight*0.92) el.classList.add('pre'); else el.classList.remove('pre'); });
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) return; var el=e.target;
      if(el.classList.contains('intro')){ el.querySelectorAll('.w').forEach(function(w,i){ w.style.transitionDelay=(i*55)+'ms'; }); }
      el.classList.remove('pre'); io.unobserve(el); }); },{rootMargin:'0px 0px -10% 0px'});
  all.forEach(function(el){ if(el.classList.contains('pre')) io.observe(el); });
  setTimeout(function(){ all.forEach(function(el){el.classList.remove('pre');}); }, 9000);

  /* Gentle parallax: images drift slower than the page; never scroll-jacks */
  var imgs=[].slice.call(document.querySelectorAll('img[data-speed]')), ticking=false;
  function px(){ ticking=false; var vh=innerHeight;
    imgs.forEach(function(img){ var r=img.parentNode.getBoundingClientRect(); if(r.bottom<-50||r.top>vh+50) return;
      var c=(r.top+r.height/2-vh/2), room=(img.offsetHeight-r.height)/2, y=-c*parseFloat(img.dataset.speed);
      y=Math.max(-room,Math.min(room,y)); img.style.transform='translate3d(0,'+y.toFixed(1)+'px,0)'; }); }
  window.addEventListener('scroll',function(){ if(!ticking){ ticking=true; requestAnimationFrame(px);} },{passive:true});
  window.addEventListener('resize',px); px();
})();
