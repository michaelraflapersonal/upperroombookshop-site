NAR_SCHEMA = {"@context":"https://schema.org","@type":["BookStore","CafeOrCoffeeShop"],"@id":"https://www.upperroombookshop.com/visit/narellan#location",
  "name":"Upper Room Christian Bookshop Cafe, Narellan","url":"https://www.upperroombookshop.com/visit/narellan",
  "address":{"@type":"PostalAddress","streetAddress":"Kasland House 6","addressLocality":"Narellan","addressRegion":"NSW","postalCode":"2567","addressCountry":"AU"},
  "parentOrganization":ORG,"sameAs":[IG]}
nar = phero(None, [('index.html','Home'),('visit.html','Visit'),(None,'Narellan')], '%%NAR_STATUS%% · Sydney\'s South West',
  'Upper Room, <em>Narellan</em>', 'A second Upper Room is coming to Narellan, opposite the town centre. A quiet place for books, coffee and conversation in Sydney\'s South West.',
  '<img src="img/mark-gold.png" alt="" style="width:46px;margin-top:8px">', cls='plain sagehero')
nar += f'''
<section style="background:var(--bg)">
  <div class="wrap today">
    <div><span class="k">Status</span><span class="v status soon"><i aria-hidden="true"></i><span>%%NAR_STATUS%%</span></span></div>
    <div><span class="k">Where</span><span class="v">Kasland House 6, opposite Narellan Town Centre</span></div>
    <div><span class="k">Hours</span><span class="v">%%NAR_HOURS%%</span></div>
    <div><a class="btn" href="#notify">Hear when we open {ARR}</a></div>
  </div>
</section>
<section class="band">
  <div class="wrap split">
    <div class="prose rv">
      <span class="eyebrow">Our vision</span>
      <h2>A second quiet room, coming soon</h2>
      <p class="lead">More than a bookshop, Upper Room is a place of encounter. A place to pause, reflect and connect, whether through quiet reading, a coffee and conversation, or a moment of stillness in a busy world.</p>
      <p>God willing, St Abraam Church will soon open Upper Room in Narellan, bringing a Christian bookshop and cafe to Sydney's South West. Like Ramsgate, it will be a not-for-profit ministry of the Coptic Orthodox Church, open to everyone.</p>
    </div>
    {fr('URM_Bookshop-64.jpg','Inside Upper Room Ramsgate, the first Upper Room','tall','0.07')}
  </div>
  <p class="wrap muted" style="font-size:14px;margin-top:14px;text-align:right">Photo: our Ramsgate shop. Narellan photos to come once it opens.</p>
</section>
<section class="band alt">
  <div class="wrap">
    <div class="sechead rv"><span class="eyebrow">What you'll find</span><h2>Coffee, conversation, books, faith and community</h2></div>
    <div class="impact">
      <div class="rv"><h3 class="serif">An open bookshop</h3><p class="muted">Christian books and gifts chosen with care, for every age and every stage of faith.</p></div>
      <div class="rv"><h3 class="serif">A cafe counter</h3><p class="muted">Good coffee and somewhere comfortable to sit, with permission to stay as long as you like.</p></div>
      <div class="rv"><h3 class="serif">Coffee with Christ</h3><p class="muted">Our weekly Bible study will meet here too, around a table in the cafe. <a href="coffee-with-christ.html">See what to expect</a>.</p></div>
    </div>
  </div>
</section>
<section class="band dark" id="notify">
  <div class="wrap split">
    <div class="prose rv">
      <span class="eyebrow">Stay in the loop</span>
      <h2>Hear when the doors open</h2>
      <p class="muted">One email when Upper Room Narellan opens. Nothing else.</p>
    </div>
    %%NAR_SIGNUP%%
  </div>
</section>
<section class="band alt" style="padding-block:clamp(56px,7vw,96px)">
  <div class="wrap"><a class="nextcard rv" href="ramsgate.html"><div><span class="eyebrow">Open now</span><h3 class="serif" style="margin-top:12px">Visit Upper Room, Ramsgate</h3></div><span class="arr" aria-hidden="true">→</span></a></div>
</section>'''
page('narellan.html','Christian Bookshop &amp; Cafe in Narellan | Upper Room','Upper Room Christian Bookshop Cafe is coming to Narellan, opposite the town centre: a Christian bookshop and cafe for Sydney\'s South West. Opening soon.', nar, NAR_SCHEMA)
