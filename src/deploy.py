# Live-site extras: 404 page, sitemap, robots, redirects and headers.
# Executed at the end of build.py (shares its globals).

nf = phero(None, [('index.html', 'Home'), (None, 'Page not found')], 'Page not found',
  'This page has <em>moved</em>', 'We&rsquo;ve recently given our website a fresh start, so some old links no longer work. Everything is still here.',
  f'<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center"><a class="btn" href="index.html">Go to the homepage {ARR}</a><a class="tlink" href="visit.html">Opening hours and directions {ARR}</a></div>',
  cls='plain sagehero')
page('404.html', 'Page not found | Upper Room', 'This page could not be found.', nf, noindex=True)

today = datetime.date.today().isoformat()
open(os.path.join(OUT, 'sitemap.xml'), 'w').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url><loc>{SITE}{p}</loc><lastmod>{today}</lastmod></url>\n' for p in PAGES)
    + '</urlset>\n')

open(os.path.join(OUT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n')

shutil.copy(os.path.join(B, '_redirects'), os.path.join(OUT, '_redirects'))
shutil.copy(os.path.join(B, '_headers'), os.path.join(OUT, '_headers'))
print('built', PAGES)
