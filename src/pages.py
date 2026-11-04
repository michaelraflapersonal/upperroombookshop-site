# Inner pages. Executed from build.py (shares its helpers).

HRS_TABLE = '''<table class="hrs"><caption class="eyebrow" style="text-align:left;caption-side:top;padding-bottom:16px">Opening hours</caption><tbody>
%%HOURS_TABLE_ROWS%%</tbody></table>
<p class="muted" style="font-size:15px;margin-top:14px">%%HOURS_NOTE%%</p>'''

MAP_SVG = '''<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<rect width="400" height="300" fill="var(--bg-alt)"/>
<g stroke="var(--line)" stroke-width="10" fill="none" stroke-linecap="round"><path d="M-10 210 C 90 190, 160 175, 410 120"/><path d="M190 -10 L 215 310"/><path d="M-10 80 L 410 60"/></g>
<g stroke="var(--line)" stroke-width="4" fill="none"><path d="M60 -10 L 80 310"/><path d="M320 -10 L 300 310"/><path d="M-10 260 L 410 250"/><path d="M-10 30 L 410 20"/></g>
<path d="M330 300 C 350 250, 400 240, 410 230 L 410 300 Z" fill="var(--sage)" opacity=".35"/>
<text x="232" y="112" font-family="Source Sans 3, sans-serif" font-size="10" letter-spacing="1.5" fill="var(--muted)">ROCKY POINT RD</text>
</svg>'''

def mapcard(label, href):
    return f'<a class="mapcard rv" href="{href}">{MAP_SVG}<div class="pin"><img src="img/mark-olive.png" alt=""><span>{label}</span></div><span class="open">Open in Google Maps {ARR}</span></a>'

# ================================================================ VISIT HUB
visit = phero('cafe-62.jpg', [('index.html','Home'),(None,'Visit')], 'Visit Upper Room',
  'Two quiet rooms, <em>one welcome</em>', 'Find the Upper Room nearest you. Each one has books worth lingering over, good coffee, and a table waiting for you.',
  f'<div class="ctas" style="display:flex;gap:24px;flex-wrap:wrap;align-items:center"><a class="btn" href="ramsgate.html">Ramsgate {ARR}</a><a class="tlink" href="narellan.html" style="color:#F4F2EE">Narellan, opening soon {ARR}</a></div>')
visit += f'''
<section class="band alt">
  <div class="wrap">
    <div class="sechead rv"><span class="eyebrow">Our locations</span><h2>Choose your Upper Room</h2><p>Both are open to everyone, whatever your background. Drop in for a book, a coffee, or both.</p></div>
    <div class="locs">
      <article class="loc rv">
        <div class="frame still"><img src="img/URM_Bookshop-81.jpg" alt="The Upper Room sign above the entrance on Rocky Point Rd, Ramsgate" loading="lazy"></div>
        <div class="body">
          <span class="status" data-hours="%%HOURS_DATA%%"><i aria-hidden="true"></i><span>%%HOURS_SUMMARY%%</span></span>
          <h3 class="serif">Ramsgate</h3>
          <p class="addr">219 Rocky Point Rd, Ramsgate NSW 2217</p>
          <div class="hours" style="font-size:15px;color:var(--muted)">%%HOURS_GRID%%</div>
          <div class="links"><a class="tlink" href="ramsgate.html">Plan your visit to Ramsgate {ARR}</a><a class="tlink" href="{DIRS}">Directions</a></div>
        </div>
      </article>
      <article class="loc rv">
        <div class="soonbg"><span>A second quiet room,<br>opening soon</span><img src="img/mark-olive.png" alt=""></div>
        <div class="body">
          <span class="status soon"><i aria-hidden="true"></i><span>%%NAR_STATUS%%</span></span>
          <h3 class="serif">Narellan</h3>
          <p class="addr">Kasland House 6, opposite Narellan Town Centre</p>
          <p class="near">Sydney's South West. Opening hours to come.</p>
          <div class="links"><a class="tlink" href="narellan.html">About the new shop {ARR}</a></div>
        </div>
      </article>
    </div>
  </div>
</section>
<section class="band">
  <div class="wrap">
    <div class="sechead rv"><span class="eyebrow">Which is closer?</span><h2>Find the one nearest you</h2></div>
    <div class="compare">
      <div class="col rv"><h3 class="serif" style="color:var(--head)">Ramsgate is close to</h3><div class="suburbs"><span>Sans Souci</span><span>Sandringham</span><span>Sylvania</span><span>Kogarah</span><span>Rockdale</span><span>Blakehurst</span><span>Monterey</span><span>Kyeemagh</span></div><p class="muted">A short drive from across the St George area and the Sutherland Shire.</p></div>
      <div class="col rv"><h3 class="serif" style="color:var(--head)">Narellan is close to</h3><div class="suburbs"><span>Harrington Park</span><span>Mount Annan</span><span>Camden</span><span>Oran Park</span><span>Smeaton Grange</span><span>Elderslie</span><span>Spring Farm</span><span>Currans Hill</span></div><p class="muted">Opposite Narellan Town Centre, serving the Camden area and Sydney's South West.</p></div>
    </div>
  </div>
</section>
<section class="pause" aria-label="Scripture">
  <div class="frame" aria-hidden="true"><img data-speed="0.16" src="img/URM_Bookshop-76.jpg" alt=""></div>
  <div class="shade" aria-hidden="true"></div>
  <div class="wrap verse"><span class="hair rv" aria-hidden="true"></span><blockquote class="rv">“For where two or three gather in my name, there am I with them.”</blockquote><cite class="rv">Matthew 18:20</cite></div>
</section>'''
page('visit.html','Visit Upper Room | Christian Bookshops &amp; Cafes in Sydney','Visit Upper Room Christian Bookshop Cafe in Ramsgate, and soon in Narellan. Opening hours, directions and what to expect.', visit)

# ================================================================ RAMSGATE
rams = phero('cafe-12.jpg', [('index.html','Home'),('visit.html','Visit'),(None,'Ramsgate')], 'Christian bookshop &amp; cafe · Ramsgate',
  'Upper Room, <em>Ramsgate</em>', 'Timber shelves, warm light and good coffee on Rocky Point Road, a short drive from Sans Souci, Sandringham and Sylvania.', mob='URM_Bookshop-12.jpg')
rams += f'''
<section style="background:var(--bg)">
  <div class="wrap today">
    <div><span class="k">Right now</span><span class="v status" data-hours="%%HOURS_DATA%%"><i aria-hidden="true"></i><span>%%HOURS_SUMMARY%%</span></span></div>
    <div><span class="k">Address</span><span class="v">219 Rocky Point Rd, Ramsgate NSW 2217</span><button class="copy-btn" type="button" data-copy="219 Rocky Point Rd, Ramsgate NSW 2217">Copy</button></div>
    <div><span class="k">Phone</span><span class="v"><a href="tel:%%PHONE_TEL%%">%%PHONE%%</a></span></div>
    <div><a class="btn" href="{DIRS}">Get directions {ARR}</a></div>
  </div>
</section>
<section class="band">
  <div class="wrap split top">
    <div class="rv">{HRS_TABLE}</div>
    <div>{mapcard('Upper Room, Ramsgate', DIRS)}</div>
  </div>
</section>
<section class="band alt">
  <div class="wrap split">
    {fr('URM_Bookshop-49.jpg','A guest sharing a book she has found with a friend','tall','0.07')}
    <div class="prose rv">
      <span class="eyebrow">At this location</span>
      <h2>A bookshop, a cafe, and a place to stay</h2>
      <p class="lead">Browse Christian books for every age, from Church Fathers and stories of the saints to devotionals, Bibles and children's titles.</p>
      <p>Then order a coffee, find a seat by the window and take your time. Our team are always happy to recommend a book, or simply say hello.</p>
      <p>On Thursday evenings the shop stays open late for <a href="coffee-with-christ.html">Coffee with Christ, our weekly Bible study</a>.</p>
    </div>
  </div>
</section>
<section class="band">
  <div class="wrap">
    <div class="sechead rv"><span class="eyebrow">Getting here</span><h2>Plan your visit</h2></div>
    <div class="info">
      <div class="rv"><h3 class="serif">Parking</h3><p>There's parking close by, right around the cafe.</p></div>
      <div class="rv"><h3 class="serif">Public transport</h3><p>Buses stop nearby. There's no train station within walking distance, so most people come by car or bus.</p></div>
      <div class="rv"><h3 class="serif">Gift cards</h3><p>Available in store and <a href="{GIFT}">online</a>.</p></div>
    </div>
  </div>
</section>
<section class="band alt" style="padding-block:clamp(64px,8vw,110px)">
  <div class="wrap">
    <div class="inhead rv"><div style="display:grid;gap:14px"><span class="eyebrow">Inside Ramsgate</span><h2>Have a look around</h2></div><a class="tlink" href="gallery.html">See the full gallery {ARR}</a></div>
    <div class="prow">
      {fr('URM_Bookshop-78.jpg','The cafe counter with pastries and cakes','','0.05')}
      {fr('URM_Bookshop-9.jpg','Shelves of Christian spirituality, commentaries and prayer books','','0.08')}
      {fr('URM_Bookshop-11.jpg','Prayer bracelets and crosses on the gift table','','0.05')}
      {fr('URM_Bookshop-55.jpg','Two visitors looking closely at an icon of St Michael','','0.08')}
    </div>
  </div>
</section>
<section class="band" style="padding-block:clamp(56px,7vw,96px)">
  <div class="wrap"><a class="nextcard rv" href="narellan.html"><div><span class="eyebrow">In Sydney's South West?</span><h3 class="serif" style="margin-top:12px">Upper Room Narellan is opening soon</h3></div><span class="arr" aria-hidden="true">→</span></a></div>
</section>'''
page('ramsgate.html','Christian Bookshop &amp; Cafe in Ramsgate | Upper Room','Books, gifts and coffee at 219 Rocky Point Rd, Ramsgate. Open Monday to Saturday from 7am, with Bible study on Thursday nights. Near Sans Souci and Sylvania.', rams, RAMS_SCHEMA)

exec(open(os.path.join(B,'narellan.py')).read())

# ================================================================ COFFEE WITH CHRIST
CWC_SCHEMA = {"@context":"https://schema.org","@type":"Event","name":"Coffee with Christ: Thursday Bible study","description":"A relaxed weekly Bible study held in the cafe. No church background needed, no booking required.","eventSchedule":{"@type":"Schedule","byDay":"https://schema.org/"+CWC["day"],"startTime":CWC["start"],"endTime":CWC["end"],"repeatFrequency":"P1W","scheduleTimezone":"Australia/Sydney"},"eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode","isAccessibleForFree":True,"startDate":next_cwc()+"T"+CWC["start"],"endDate":next_cwc()+"T"+CWC["end"],"eventStatus":"https://schema.org/EventScheduled","location":{"@type":"Place","@id":"https://www.upperroombookshop.com/visit/ramsgate#location","name":"Upper Room Christian Bookshop Cafe, Ramsgate","address":{"@type":"PostalAddress","streetAddress":"219 Rocky Point Rd","addressLocality":"Ramsgate","addressRegion":"NSW","postalCode":"2217","addressCountry":"AU"}},"organizer":ORG}
cwc = phero("URM_Bookshop-5-2.jpg", [("index.html","Home"),("events.html","Events"),(None,"Coffee with Christ")], '%%CWC_EVERY%% · %%CWC_WHERE%%',
  'Coffee with <em>Christ</em>', 'A relaxed weekly Bible study, held around a table in the cafe. No church background needed, no booking required. Come as you are, and bring your questions.',
  f'<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center"><a class="btn" href="ramsgate.html">How to find us {ARR}</a><a class="tlink" href="narellan.html" style="color:#F4F2EE">Coming to Narellan too {ARR}</a></div>', mob='URM_Bookshop-26.jpg')
cwc += f'''
<section class="band">
  <div class="wrap">
    <div class="sechead rv"><span class="eyebrow">What to expect</span><h2>An hour that feels like a conversation</h2></div>
    <div class="steps">
      <div class="step rv"><span class="n">First</span><h3 class="serif">Gather</h3><p class="muted">Arrive from just before 7. Someone will say hello and find you a seat at the table.</p></div>
      <div class="step rv"><span class="n">Then</span><h3 class="serif">Read</h3><p class="muted">We read a passage of Scripture together, slowly, a few verses at a time.</p></div>
      <div class="step rv"><span class="n">Together</span><h3 class="serif">Talk</h3><p class="muted">We talk about what we've read and what it means for everyday life. Questions are always welcome, and no one is put on the spot.</p></div>
    </div>
  </div>
</section>
<section class="band alt">
  <div class="wrap split">
    {fr('URM_Bookshop-31.jpg','A guest smiling at a cafe table, with staff at the counter behind','tall','0.07')}
    <div class="prose rv">
      <span class="eyebrow">Who it's for</span>
      <h2>For the curious, the faithful, and everyone in between</h2>
      <p class="lead">Coffee with Christ is a casual way into the ancient faith of the Bible.</p>
      <p>It suits anyone who finds church a little intimidating, anyone looking for community, and anyone who simply wants to read the Bible with others. You don't need to know anything first.</p>
    </div>
  </div>
</section>
<section class="band dark">
  <div class="wrap split top">
    <div class="rv" style="display:grid;gap:18px"><span class="eyebrow">Questions</span><h2>Good to know</h2><p style="color:#F4F2EE">Anything else? <a href="contact.html">Send us a message</a>.</p></div>
    <div class="faq rv">
      <details open><summary>Do I need to book?</summary><p class="ans">No. Just turn up on a Thursday evening. If you're coming with a group, a quick message helps us set out enough chairs.</p></details>
      <details><summary>Is it free?</summary><p class="ans">Yes. It's free and open to everyone, every week.</p></details>
      <details><summary>I'm not a Christian. Can I still come?</summary><p class="ans">Absolutely. Many people come with questions rather than answers. Faith is present here, never forced.</p></details>
      <details><summary>Do I need a Bible?</summary><p class="ans">No. We'll have one for you, and you're welcome to bring your own.</p></details>
      <details><summary>Is it at Narellan too?</summary><p class="ans">Yes. Coffee with Christ will also run at Upper Room Narellan once the shop opens. We'll share the night and time here.</p></details>
      <details><summary>Can I bring a friend?</summary><p class="ans">Please do. There's always room for one more at the table.</p></details>
    </div>
  </div>
</section>
<section class="band" style="padding-block:clamp(56px,7vw,96px)">
  <div class="wrap"><a class="nextcard rv" href="learn-more.html"><div><span class="eyebrow">Before you come</span><h3 class="serif" style="margin-top:12px">Read our gentle introduction to Christian Orthodoxy</h3></div><span class="arr" aria-hidden="true">→</span></a></div>
</section>'''
page('coffee-with-christ.html','Coffee with Christ | Thursday Bible Study Cafe, Sydney','A relaxed Thursday night Bible study in the cafe at Upper Room, Ramsgate, 7 to 8pm. No church background needed, no booking required.', cwc, CWC_SCHEMA)

# ================================================================ EVENTS
ev = phero('cafe-58.jpg', [('index.html','Home'),(None,'Events')], 'Events',
  'Gather at <em>Upper Room</em>', 'A weekly Bible study in the cafe, and other gatherings shared on Instagram as they come up. Everyone is welcome.')
ev += f'''
<section class="band">
  <div class="wrap">
    <div class="sechead rv"><span class="eyebrow">Every week</span><h2>Coffee with Christ</h2></div>
    <a class="nextcard rv" href="coffee-with-christ.html" style="grid-template-columns:auto 1fr auto;gap:clamp(20px,4vw,48px)">
      <div class="frame still" style="width:clamp(110px,16vw,200px);aspect-ratio:1"><img src="img/URM_Bookshop-20.jpg" alt="" loading="lazy"></div>
      <div style="display:grid;gap:8px"><h3 class="serif">Thursday Bible study</h3><p class="muted">%%CWC_EVERY%% · %%CWC_WHERE%%. Relaxed, no booking needed.</p></div>
      <span class="arr" aria-hidden="true">→</span>
    </a>
  </div>
</section>
<section class="band">
  <div class="wrap split">
    <div class="prose rv"><span class="eyebrow">Never miss one</span><h2>Follow along on Instagram</h2><p class="lead">We share new arrivals, feast days and Thursday nights at @upperroombookshop.</p><p><a class="tlink" href="{IG}">Follow on Instagram {ARR}</a></p></div>
    {fr('cafe-36.jpg','Clergy cutting the ribbon at the Upper Room grand opening','wide','0.06')}
  </div>
</section>'''
page('events.html','Events | Upper Room Christian Bookshop Cafe','A weekly Thursday Bible study and occasional gatherings at Upper Room Christian Bookshop Cafe. Everyone is welcome.', ev)

# ================================================================ LEARN MORE
lm = '<div class="progress" aria-hidden="true"><i></i></div>' + phero(None, [('index.html','Home'),(None,'Learn More')], 'An introduction',
  'The greatest love story <em>ever told</em>', 'A gentle, no-pressure introduction to the Christian faith and the Orthodox tradition. No prior knowledge assumed.', cls='plain lmhero').replace(
  '<div class="wrap" style="width:100%"><div class="content">',
  '<div class="wrap lmgrid" style="width:100%"><figure class="lmart" aria-hidden="true"><img src="img/learn-more-cross.jpg" width="900" height="1119" alt="" fetchpriority="high"></figure><div class="content">', 1)
lm += f'''
<section class="band" style="padding-top:clamp(56px,7vw,96px)">
  <div class="wrap reading">
    <nav class="toc" aria-label="On this page"><a href="#message">The message</a><a href="#orthodoxy">What is Orthodoxy?</a><a href="#deeper">Going deeper</a><a href="#church">Visit a church</a><a href="#app">Keep in touch</a></nav>
    <div>
      <div class="chapter rv" style="padding-top:0">
        <p class="prose lead" style="font:400 clamp(22px,2.3vw,27px)/1.55 var(--serif)">Many people walk into Upper Room curious about Christianity but unsure where to begin. This page is a quiet place to start: the heart of the Christian story, a little about the ancient tradition that has carried it, and some simple next steps if you'd like to go further.</p>
      </div>
      <article class="chapter rv" id="message">
        <span class="num">One</span><h2>The message</h2>
        <p>At the centre of Christianity is a surprising claim. God did not simply send us a message. He came Himself.</p>
        <blockquote class="pull">“He became what we are, so that we might become what He is.”<cite>St Athanasius of Alexandria, On the Incarnation, c. 318 AD</cite></blockquote>
        <p>The Son of God took on human flesh, lived among us, died and rose again, so that He could draw us into God's own life. This is the good news the Church has proclaimed for two thousand years.</p>
        <blockquote class="pull">“For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.”<cite>John 3:16</cite></blockquote>
      </article>
      <article class="chapter rv" id="orthodoxy">
        <span class="num">Two</span><h2>What is Christian Orthodoxy?</h2>
        <p>Orthodoxy is the ancient, unbroken stream of Christian faith reaching back to the Apostles, carried through prayer, sacrament, song and the witness of the saints.</p>
        <blockquote class="pull">“Orthodoxy is not a system of ideas to be studied from a distance.”</blockquote>
        <p>At its heart is the belief that Jesus is fully God and fully human, and that His life, death and resurrection open the way to union with God. The Orthodox Church preserves the theology, worship and way of life of the earliest Christian teachers. Its services have been prayed for centuries, its icons show us a “cloud of witnesses”, and its fasts and feasts give time itself a meaning.</p>
        <p>If you sense there is more to Christianity than you've seen so far, Orthodoxy is a faith that rewards a lifetime of reading, prayer and discovery.</p>
      </article>
      <figure class="icon-break rv"><img src="img/icon-christ-and-abbot-menas.jpg" width="1000" height="1130" alt="A sixth-century Coptic icon of Christ with His arm around the shoulder of Abbot Menas" loading="lazy"></figure>
      <article class="chapter rv" id="deeper">
        <span class="num">Three</span><h2>How to go deeper</h2>
        <div class="steps" style="grid-template-columns:1fr">
          <div class="step"><span class="n">Browse the shelves</span><p>Devotionals, the writings of the Church Fathers, stories of the saints, spiritual classics and children's titles. Ask us and we'll gladly recommend something.</p></div>
          <div class="step"><span class="n">Sit with a question</span><p>Order a coffee, choose a book and linger. Often the deepest understanding comes in simple conversation, and our team are always happy to talk.</p></div>
          <div class="step"><span class="n">Attend a service</span><p>Orthodox worship is meant to be experienced, not just read about. Visitors are always welcome, and no prior knowledge is needed.</p></div>
        </div>
      </article>
      <article class="chapter rv" id="church">
        <span class="num">Four</span>
        <div style="display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end"><h2>Visit a church near you</h2><img class="ink" src="img/church-line-drawing.png" alt="" style="width:110px" loading="lazy"></div>
        <p>These local parishes in Sydney's south welcome visitors. You're welcome to contact the priest before you go.</p>
        <div class="parishes">
          <div class="parish"><h3 class="serif">St Luke's, Sylvania</h3><p>Fr Dan · 0421 311 750</p><p><a href="https://stlukesorthodox.com">stlukesorthodox.com</a></p></div>
          <div class="parish"><h3 class="serif">St John's, Hurstville</h3><p>Fr Luke · 0431 532 531</p><p><a href="https://stjohnschurch.com.au">stjohnschurch.com.au</a></p></div>
          <div class="parish"><h3 class="serif">St Mark's, Arncliffe</h3><p>Fr Mark · 0416 614 148</p><p><a href="https://stmark.com.au">stmark.com.au</a></p></div>
          <div class="parish"><h3 class="serif">St Mary's, Pymble</h3><p>Fr Meena · 0404 176 039</p><p><a href="https://stmarysorthodox.com.au">stmarysorthodox.com.au</a></p></div>
        </div>
      </article>
      <article class="chapter rv" id="app">
        <span class="num">Five</span><h2>Keep in touch</h2>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center"><img class="applogo" src="img/upper-room-media-app-logo.png" alt="Upper Room Media app icon" loading="lazy"><p>We often introduce visitors to our friends at Upper Room Media. Their free app brings sermons, music and spiritual resources from the Coptic Orthodox Church to your phone or tablet.</p></div>
        <div style="display:flex;gap:22px;flex-wrap:wrap"><a class="tlink" href="https://apps.apple.com/app/id1172592102">App Store {ARR}</a><a class="tlink" href="https://play.google.com/store/apps/details?id=com.subsplashconsulting.s_9XTSHD">Google Play {ARR}</a><a class="tlink" href="https://www.amazon.com/gp/mas/dl/android?p=com.subsplashconsulting.s_9XTSHD">Amazon Appstore {ARR}</a></div>
        <p>And follow <a href="{IG}">@upperroombookshop</a> on Instagram for new arrivals and Thursday nights.</p>
      </article>
    </div>
  </div>
</section>
<section class="band sage" style="padding-block:clamp(64px,8vw,110px)">
  <div class="wrap quote"><span class="eyebrow rv">Come and see</span><blockquote class="rv">The best introduction is a quiet hour with a book and a coffee.</blockquote><p class="rv"><a class="tlink" href="visit.html">Plan your visit {ARR}</a></p></div>
</section>'''
page('learn-more.html','An Introduction to Orthodox Christianity | Upper Room','A gentle introduction to the Christian faith and the Orthodox tradition, with local parishes to visit in Sydney. No prior knowledge assumed.', lm)

# ================================================================ GALLERY
G = [
 ('URM_Bookshop-4.jpg','The timber wall of books around the illuminated logo','books'),
 ('URM_Bookshop-21.jpg','A latte and almond croissant','cafe'),
 ('URM_Bookshop-64.jpg','Browsing beneath the paper lantern','books people'),
 ('URM_Bookshop-26.jpg','Reading by the window','cafe people'),
 ('URM_Bookshop-9.jpg','Christian Spirituality, Commentaries, Apologetics and Prayer','books'),
 ('URM_Bookshop-86.jpg','Pouring latte art','cafe'),
 ('URM_Bookshop-11.jpg','Beaded bracelets and gifts','gifts'),
 ('URM_Bookshop-76.jpg','Conversation over coffee','cafe people'),
 ('URM_Bookshop-92.jpg','The Bibles shelf, with an icon of the Theotokos','books'),
 ('URM_Bookshop-3.jpg','A warm welcome at the counter','cafe people'),
 ('URM_Bookshop-87.jpg','Gift baskets of books and chocolates','gifts'),
 ('URM_Bookshop-7.jpg','The display table','books gifts'),
 ('URM_Bookshop-25.jpg','The Way of Wisdom and a latte','cafe books'),
 ('URM_Bookshop-55.jpg','An icon of the Archangel Michael','books people'),
 ('URM_Bookshop-95.jpg','Children\'s Bibles','books'),
 ('URM_Bookshop-14.jpg','Icons, prayer beads and tote bags','gifts'),
 ('URM_Bookshop-2-2.jpg','The illuminated Upper Room logo','books'),
 ('URM_Bookshop-27.jpg','Friends talking by the window','cafe people'),
 ('URM_Bookshop-20.jpg','Two coffees and a prayer rope','cafe'),
 ('URM_Bookshop-68.jpg','Finding the right book','books people'),
 ('URM_Bookshop-83.jpg','St George on the Commentaries shelf','books'),
 ('URM_Bookshop-10.jpg','Crosses, icons and bracelets','gifts'),
 ('URM_Bookshop-84.jpg','Steaming milk','cafe'),
 ('URM_Bookshop-31.jpg','A recommendation from the team','books people'),
 ('URM_Bookshop-91.jpg','A gift hamper','gifts'),
 ('URM_Bookshop-5-2.jpg','An icon on the shelf','books'),
 ('URM_Bookshop-49.jpg','Browsing together','books people'),
 ('URM_Bookshop-99.jpg','The Ramsgate storefront','cafe'),
 ('cafe-12.jpg','Opening day: the shop, ready','opening'),
 ('cafe-36.jpg','Opening day: cutting the ribbon','opening people'),
 ('cafe-7.jpg','Opening day: the team','opening people'),
 ('cafe-10.jpg','Opening day: Upper Room biscuits','opening'),
 ('cafe-22.jpg','Opening day: welcome trays','opening people'),
 ('cafe-2.jpg','Opening day: the new sign','opening'),
 ('cafe-62.jpg','Opening day: the corner on Rocky Point Rd','opening'),
 ('cafe-58.jpg','Opening day: friends and family','opening people'),
]
figs = '\n'.join(f'<figure data-cat="{c}"><img src="img/{f}" alt="{a}" loading="lazy"><figcaption>{a}</figcaption></figure>' for f,a,c in G)
gal = phero('URM_Bookshop-75.jpg', [('index.html','Home'),(None,'Gallery')], 'Gallery',
  'Inside <em>Upper Room</em>', 'Timber, light, books and coffee. A look around before you visit.', pos='center 60%')
gal += f'''
<section class="band" style="padding-top:clamp(56px,7vw,90px)">
  <div class="wrap">
    <div class="chips" role="group" aria-label="Filter photos">
      <button class="chip" type="button" data-f="all" aria-pressed="true">All</button>
      <button class="chip" type="button" data-f="books" aria-pressed="false">Books</button>
      <button class="chip" type="button" data-f="cafe" aria-pressed="false">Cafe</button>
      <button class="chip" type="button" data-f="gifts" aria-pressed="false">Gifts</button>
      <button class="chip" type="button" data-f="people" aria-pressed="false">Community</button>
      <button class="chip" type="button" data-f="opening" aria-pressed="false">Opening day</button>
    </div>
    <div class="masonry">{figs}</div>
  </div>
</section>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Photo viewer"><div style="display:grid;justify-items:center"><img src="" alt=""><p></p></div><button class="x" type="button">Close</button><button class="pv" type="button" aria-label="Previous photo">‹</button><button class="nx" type="button" aria-label="Next photo">›</button></div>'''
page('gallery.html','Gallery | Inside Upper Room Christian Bookshop Cafe','Photos from inside Upper Room Christian Bookshop Cafe in Ramsgate: the bookshop, the cafe, gifts and our grand opening day.', gal)

# ================================================================ SUPPORT
sup = phero('URM_Bookshop-87.jpg', [('index.html','Home'),(None,'Support')], 'Support Upper Room',
  'Help keep <em>the door open</em>', 'Upper Room is a not-for-profit ministry. Every gift card and donation helps keep this space open to everyone who walks in.', pos='center 40%')
sup += f'''
<section class="band">
  <div class="wrap tiers">
    <article class="tier rv"><div class="frame still"><img src="img/URM_Bookshop-21.jpg" alt="A latte and almond croissant at the Upper Room cafe" loading="lazy"></div>
      <div class="body"><span class="eyebrow">Gift cards</span><h2 style="font-size:clamp(28px,3vw,38px)">The gift of a good story and a great coffee</h2><p class="muted">Spend in store on books, gifts and the cafe. Delivered by email, ready to give.</p><p><a class="btn" href="{GIFT}">Buy a gift card {ARR}</a></p></div></article>
    <article class="tier rv"><div class="frame still"><img src="img/URM_Bookshop-95.jpg" alt="A well-stocked shelf of children's Bibles" loading="lazy"></div>
      <div class="body"><span class="eyebrow">Donate</span><h2 style="font-size:clamp(28px,3vw,38px)">Keep the shelves stocked and the doors open</h2><p class="muted">A one-off gift of any size supports the ministry and everyone it welcomes. All donations are tax deductible.</p><p><a class="btn" href="{DONATE}">Make a donation {ARR}</a></p></div></article>
  </div>
</section>
<section class="band alt">
  <div class="wrap">
    <div class="sechead rv"><span class="eyebrow">Where it goes</span><h2>What your support makes possible</h2></div>
    <div class="impact">
      <div class="rv"><h3 class="serif">Unique titles</h3><p class="muted">Sourcing books you won't find elsewhere, from the Church Fathers to children's Bibles.</p></div>
      <div class="rv"><h3 class="serif">A weekly table</h3><p class="muted">Hosting Coffee with Christ every Thursday, free for everyone who comes.</p></div>
      <div class="rv"><h3 class="serif">An open door</h3><p class="muted">Keeping a calm, welcoming space open to anyone curious about faith.</p></div>
    </div>
  </div>
</section>'''
page('support.html','Gift Cards &amp; Donations | Support Upper Room','Buy an Upper Room gift card or make a donation to support a not-for-profit Christian bookshop and cafe that is open to everyone.', sup)

# ================================================================ CONTACT
con = phero('URM_Bookshop-70.jpg', [('index.html','Home'),(None,'Contact')], 'Contact',
  'Get <em>in touch</em>', 'Ask a question, share an idea, or just say hello. We\'d love to hear from you.', pos='center 35%')
con += f'''
<section class="band">
  <div class="wrap split top">
    <div class="rv" style="display:grid;gap:28px">
      <h2 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">Contact details</h2>
      <div class="info">
        <div><h3 class="serif">Phone</h3><p><a href="tel:%%PHONE_TEL%%">%%PHONE%%</a></p></div>
        <div><h3 class="serif">Email</h3><p>%%EMAIL%% <button class="copy-btn" type="button" data-copy="%%EMAIL%%" aria-label="Copy email address">Copy</button></p></div>
        <div><h3 class="serif">Ramsgate</h3><p>219 Rocky Point Rd, Ramsgate NSW 2217<br><a class="tlink" href="ramsgate.html" style="margin-top:8px">Hours and directions {ARR}</a></p></div>
        <div><h3 class="serif">Narellan</h3><p>Kasland House 6, opposite Narellan Town Centre. %%NAR_STATUS%%. <a href="narellan.html">Find out more</a></p></div>
        <div><h3 class="serif">Instagram</h3><p><a href="{IG}">@upperroombookshop</a></p></div>
      </div>
    </div>
    <div class="rv" style="padding:clamp(26px,4vw,44px);background:var(--card);border:1px solid var(--line)">
      <h2 style="font-size:clamp(28px,3vw,38px);margin-bottom:22px">Send a message</h2>
      <form class="form" method="post" action="/api/contact" data-ajax>
        <div class="row2"><label for="c-name">Name<input id="c-name" name="name" autocomplete="name" required maxlength="120"></label><label for="c-email">Email<input id="c-email" name="email" type="email" autocomplete="email" required maxlength="200"></label></div>
        <label for="c-loc">Which Upper Room?<select id="c-loc" name="loc"><option>Ramsgate</option><option>Narellan (opening soon)</option><option>General enquiry</option></select></label>
        <label for="c-msg">Message<textarea id="c-msg" name="message" required maxlength="5000"></textarea></label>
        <div class="hp" aria-hidden="true"><label for="c-web">Leave this empty<input id="c-web" name="website" tabindex="-1" autocomplete="off"></label></div>
        <div class="cf-turnstile" data-sitekey="%%TURNSTILE_SITE_KEY%%" data-theme="auto" data-size="flexible"></div>
        <button class="btn" type="submit">Send message {ARR}</button>
        <p class="thanks" hidden>Thank you. Your message is on its way, and we'll reply soon.</p>
        <p class="formerr" role="alert" hidden>Sorry, that didn't send. Please try again, or email us at %%EMAIL%%.</p>
      </form>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    </div>
  </div>
</section>'''
page('contact.html','Contact | Upper Room Christian Bookshop Cafe','Contact Upper Room Christian Bookshop Cafe in Ramsgate by phone, email or message. 0494 729 748, info@upperroombookshop.com.', con)
