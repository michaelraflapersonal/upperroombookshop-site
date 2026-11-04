// Books & gifts catalogue, read live from Square.
//
// GET /api/catalogue  -> compact JSON of every book and gift (titles, covers, prices, stock, shelf spots).
// /books/*            -> serves the /books page, with the item or section name in the <title> and share preview.
//
// Needs one Worker secret: SQUARE_ACCESS_TOKEN (see docs/cloudflare-setup.md, section 7).
// This code only ever reads from Square. Results are cached for 10 minutes; when the cache is older,
// visitors get the cached copy at once while a fresh one is fetched in the background. If Square is
// down, the last good copy (kept up to 7 days) is served instead.
import cfg from '../content/catalogue.json';

const SQ = 'https://connect.squareup.com/v2';
const SQ_VERSION = '2025-01-23';
const FRESH_MS = 10 * 60 * 1000;
const KEEP_S = 7 * 24 * 3600;
const CACHE_VER = 'v1';

let inflight = null; // one refresh at a time per Worker instance

async function sq(env, path, body) {
  const r = await fetch((env.SQUARE_API_BASE || SQ) + path, { // SQUARE_API_BASE is only for local testing
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      'Square-Version': SQ_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const text = await r.text();
    let code = '';
    try { code = JSON.parse(text).errors?.[0]?.code || ''; } catch {}
    const e = new Error(`Square ${path} ${r.status}: ${text.slice(0, 300)}`);
    e.reason = `square_${r.status}${code ? `_${code}` : ''}`; // e.g. square_401_UNAUTHORIZED; never contains the token
    throw e;
  }
  return r.json();
}

// ---------- Text helpers (exported for tests) ----------
export function parseDescription(text) {
  const out = { lede: '', more: '', best: null, lvl: null, trad: null };
  const body = [];
  for (const raw of String(text || '').split('\n')) {
    const l = raw.trim();
    if (!l) continue;
    const m = l.match(/^(Best for|Level|Tradition)\s*:\s*(.*)$/i);
    if (m) out[{ 'best for': 'best', level: 'lvl', tradition: 'trad' }[m[1].toLowerCase()]] = m[2].trim() || null;
    else body.push(l);
  }
  out.lede = body[0] || '';
  out.more = body.slice(1).join(' ');
  return out;
}

// Square has no author field, so pull it from the title ("... - by X", "... By X") or the description
// ("By X." / "Written by X"). An item custom attribute named "Author" wins if one is set up later.
export function splitTitle(name) {
  let t = String(name || '').replace(/\s+/g, ' ').trim();
  let a = '';
  const m = t.match(/^(.*?)(?:\s+-\s+|\s+)[Bb]y\s+([A-Z][^()]*?)(?:\s*\((?:Paperback|Hardcover|Hard Cover)\))?\s*$/);
  const nameLike = (s) => /^[A-Z][\w.'’-]*(?:\s+(?:[A-Z][\w.'’-]*|&|and|de|el|van|von))+$/.test(s.trim()) && s.trim().split(/\s+/).length <= 8;
  if (m && m[1].length > 2 && nameLike(m[2])) { t = m[1]; a = m[2]; }
  t = t.replace(/\s*\((?:Paperback|Hardcover|Hard Cover)\)\s*/gi, ' ').replace(/\s*-?\s*\(Popular Patristics\)/gi, '').replace(/\s+:\s*/g, ': ').replace(/\s+-\s*$/, '').trim();
  return { t, a: a.replace(/[.,;]+$/, '').trim() };
}
export function authorFromText(text) {
  const m = String(text || '').match(/(?:^|[\s.])(?:Written by|By)\s+([A-Z][A-Za-z.'’\- ]+?(?:\s(?:and|&)\s[A-Z][A-Za-z.'’\- ]+?)?)(?:[,.]|\s(?:illustrated|edited|published|with)\b)/);
  return m ? m[1].replace(/\s+(?:and|&)$/, '').trim() : '';
}
export function parseShelf(sku) {
  // e.g. "Christian Living · Column 6, Rows 2–5" or "... · Column 9, Rows 1–2 and Column 10, Rows 4–5"
  if (!sku || !/Column\s+\d+/i.test(sku)) return null;
  const loc = sku.includes('·') ? sku.split('·').slice(1).join('·').trim() : sku.trim();
  const cells = [];
  for (const part of loc.split(/\band\b/)) {
    const m = part.match(/Column\s+(\d+),?\s*Rows?\s+(\d+)(?:\s*[–-]\s*(\d+))?/i);
    if (!m) continue;
    const c = +m[1], a = +m[2], b = +(m[3] || m[2]);
    for (let r = Math.min(a, b); r <= Math.max(a, b); r++) cells.push(`${c}:${r}`);
  }
  return cells.length ? { loc, cells } : null;
}

// ---------- Build the catalogue from Square ----------
export async function buildCatalogue(env) {
  const loc = env.SQUARE_LOCATION_ID || cfg.square_location_id;
  const atLoc = (o) => !o.is_deleted && (o.present_at_all_locations ? !(o.absent_at_location_ids || []).includes(loc) : (o.present_at_location_ids || []).includes(loc));

  // 1. Categories, and which top-level one (Books / Gifts) each belongs to
  const cats = {};
  let cursor;
  do {
    const d = await sq(env, `/catalog/list?types=CATEGORY${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    for (const o of d.objects || []) if (!o.is_deleted) cats[o.id] = { name: (o.category_data?.name || '').trim(), parent: o.category_data?.parent_category?.id || null };
    cursor = d.cursor;
  } while (cursor);
  const rootOf = (id, depth = 0) => (!cats[id] ? null : (!cats[id].parent || depth > 8) ? id : rootOf(cats[id].parent, depth + 1));
  const roots = Object.keys(cats).filter((id) => !cats[id].parent && cfg.square_categories.includes(cats[id].name));
  const wanted = Object.keys(cats).filter((id) => roots.includes(rootOf(id)));
  if (!roots.length) throw new Error('No Square categories named ' + cfg.square_categories.join(' / '));

  // 2. Items in those categories
  const items = [];
  cursor = undefined;
  do {
    const d = await sq(env, '/catalog/search-catalog-items', { category_ids: wanted, limit: 100, ...(cursor ? { cursor } : {}) });
    items.push(...(d.items || []));
    cursor = d.cursor;
  } while (cursor);
  const live = items.filter((it) => atLoc(it) && !it.item_data?.is_archived && it.item_data?.ecom_visibility !== 'HIDDEN');

  // 3. Cover images
  const imgIds = [...new Set(live.map((it) => (it.item_data.image_ids || [])[0]).filter(Boolean))];
  const imgs = {};
  for (let i = 0; i < imgIds.length; i += 1000) {
    const d = await sq(env, '/catalog/batch-retrieve', { object_ids: imgIds.slice(i, i + 1000) });
    for (const o of d.objects || []) if (o.image_data?.url) imgs[o.id] = o.image_data.url;
  }

  // 4. Stock on the shelf at this location
  const vars = live.flatMap((it) => (it.item_data.variations || []).filter(atLoc));
  const qty = {};
  for (let i = 0; i < vars.length; i += 1000) {
    let c;
    do {
      const d = await sq(env, '/inventory/counts/batch-retrieve', { catalog_object_ids: vars.slice(i, i + 1000).map((v) => v.id), location_ids: [loc], states: ['IN_STOCK'], limit: 1000, ...(c ? { cursor: c } : {}) });
      for (const x of d.counts || []) qty[x.catalog_object_id] = (qty[x.catalog_object_id] || 0) + Number(x.quantity || 0);
      c = d.cursor;
    } while (c);
  }

  // 5. Shape each item
  const out = [], seen = new Set();
  for (const it of live) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    const d = it.item_data;
    const catIds = (d.categories || []).map((c) => c.id).filter((id) => cats[id] && roots.includes(rootOf(id)));
    if (!catIds.length) continue;
    const root = cats[rootOf(catIds[0])].name;
    const gift = root !== cfg.square_categories[0];
    const sub = catIds.map((id) => cats[id]).find((c) => c.parent && roots.includes(c.parent));
    const section = gift ? root : (sub ? sub.name : 'More books');

    const vs = (d.variations || []).filter(atLoc).filter((v) => v.item_variation_data?.sellable !== false);
    const prices = vs.map((v) => v.item_variation_data?.price_money?.amount).filter((n) => typeof n === 'number' && n > 0);
    let q = null;
    for (const v of vs) {
      const vd = v.item_variation_data || {};
      const ov = (vd.location_overrides || []).find((o) => o.location_id === loc) || {};
      const tracked = ov.track_inventory ?? vd.track_inventory;
      if (ov.sold_out) { q = q ?? 0; continue; }
      if (!tracked) continue;
      q = (q ?? 0) + Math.max(0, qty[v.id] || 0);
    }
    const v0 = vs[0]?.item_variation_data || {};
    const shelf = vs.map((v) => parseShelf(v.item_variation_data?.sku)).find(Boolean) || null;
    const upc = String(v0.upc || '');
    const desc = parseDescription(d.description_plaintext || '');
    const ttl = splitTitle(d.name);
    const caAuthor = Object.values(it.custom_attribute_values || {}).find((x) => /author/i.test(x.name || '') && x.string_value);
    out.push({
      id: it.id.toLowerCase(),
      t: ttl.t,
      a: caAuthor?.string_value?.trim() || ttl.a || (gift ? '' : authorFromText(desc.more)),
      c: section,
      kind: gift ? 'gift' : 'book',
      p: prices.length ? Math.min(...prices) : null,
      pv: new Set(prices).size > 1,
      q,
      img: imgs[(d.image_ids || [])[0]] || null,
      isbn: /^97[89]\d{10}$/.test(upc) ? upc : null,
      shelf,
      ...desc,
      added: it.created_at ? it.created_at.slice(0, 10) : null,
    });
  }
  const sectionsInUse = [...new Set(out.map((x) => x.c))];
  const order = Object.keys(cfg.sections);
  sectionsInUse.sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999) || a.localeCompare(b));
  return { updated: new Date().toISOString(), sections: sectionsInUse, items: out };
}

// ---------- Cache ----------
function cacheKey(request) { return new Request(new URL(`/api/catalogue-cache-${CACHE_VER}`, request.url).toString()); }

async function refresh(request, env, ctx) {
  if (!inflight) {
    inflight = (async () => {
      const data = await buildCatalogue(env);
      const res = new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${KEEP_S}`, 'X-Fetched-At': String(Date.now()) } });
      await caches.default.put(cacheKey(request), res.clone());
      return data;
    })().finally(() => { inflight = null; });
  }
  return inflight;
}

// Returns the catalogue object, or null if Square has never answered.
// Why the last fetch failed, shown by /api/catalogue so the problem can be read in a browser.
let lastFailure = null;

export async function getCatalogue(request, env, ctx) {
  if (!env.SQUARE_ACCESS_TOKEN) { lastFailure = 'no_token'; console.error('Catalogue: SQUARE_ACCESS_TOKEN is not set for this deployment'); return null; }
  const hit = await caches.default.match(cacheKey(request));
  if (hit) {
    const age = Date.now() - Number(hit.headers.get('X-Fetched-At') || 0);
    if (age > FRESH_MS) ctx.waitUntil(refresh(request, env, ctx).catch((e) => console.error('Catalogue refresh failed, serving the last good copy:', e.message)));
    return hit.json();
  }
  try {
    return await refresh(request, env, ctx);
  } catch (e) {
    lastFailure = e.reason || 'fetch_failed';
    console.error('Catalogue fetch failed:', e.message);
    return null;
  }
}

export async function onRequestCatalogue({ request, env, ctx }) {
  const data = await getCatalogue(request, env, ctx);
  if (!data) return Response.json({ ok: false, reason: lastFailure }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
}

// ---------- /books/* pages: one static page, with the right title and share preview ----------
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function onRequestShelfPage({ request, env, ctx }) {
  const url = new URL(request.url);
  const page = await env.ASSETS.fetch(new Request(new URL('/books', url).toString(), request));
  const parts = url.pathname.replace(/\/+$/, '').split('/').slice(2); // after /books
  if (!parts.length || !page.ok) return page;
  let title = null, desc = null, image = null, status = 200;
  if (parts[0] === 'all') {
    title = 'All books & gifts | Upper Room';
  } else {
    const data = await getCatalogue(request, env, ctx);
    if (data && parts[0] === 'item' && parts[1]) {
      const it = data.items.find((x) => x.id === parts[1].toLowerCase());
      if (it) {
        title = `${it.t}${it.a ? ` by ${it.a}` : ''} | Upper Room Ramsgate`;
        desc = it.lede || `${it.t}, in ${it.c} at Upper Room Christian Bookshop Cafe, Ramsgate.`;
        image = it.img;
      } else status = 404;
    } else if (data) {
      const s = data.sections.find((x) => slug(x) === parts[0]);
      if (s) { title = `${s} | Books & gifts at Upper Room`; desc = cfg.sections[s] || null; } else status = 404;
    }
  }
  const canon = `https://www.upperroombookshop.com${url.pathname.replace(/\/+$/, '')}`;
  const rw = new HTMLRewriter()
    .on('link[rel="canonical"]', { element: (e) => e.setAttribute('href', canon) })
    .on('meta[property="og:url"]', { element: (e) => e.setAttribute('content', canon) });
  if (title) rw.on('title', { element: (e) => e.setInnerContent(title) }).on('meta[property="og:title"]', { element: (e) => e.setAttribute('content', title) });
  if (desc) rw.on('meta[name="description"]', { element: (e) => e.setAttribute('content', desc) }).on('meta[property="og:description"]', { element: (e) => e.setAttribute('content', desc) });
  if (image) rw.on('meta[property="og:image"]', { element: (e) => e.setAttribute('content', image) });
  const res = rw.transform(page);
  return new Response(res.body, { status, headers: res.headers });
}
