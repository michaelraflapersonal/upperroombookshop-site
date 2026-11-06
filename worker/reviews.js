// GET /api/reviews: Google rating and recent reviews, fetched from the Places API and cached for about a month (30 days).
// Needs two Worker settings: GOOGLE_PLACES_API_KEY (secret) and GOOGLE_PLACE_ID (text).
// Without them it answers 204 and the page keeps its built-in fallback.
export async function onRequestReviews({ request, env, ctx }) {
  const key = env.GOOGLE_PLACES_API_KEY, id = env.GOOGLE_PLACE_ID;
  if (!key || !id) return new Response(null, { status: 204 });
  const cache = caches.default, cacheKey = new Request(new URL('/api/reviews', request.url).toString());
  const hit = await cache.match(cacheKey);
  if (hit) return hit;
  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=en`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' },
    });
    if (!r.ok) return new Response(null, { status: 204 });
    const d = await r.json();
    const body = JSON.stringify({
      rating: d.rating || null,
      count: d.userRatingCount || null,
      url: d.googleMapsUri || null,
      reviews: (d.reviews || []).filter(v => v.rating >= 4 && v.text && v.text.text).slice(0, 6).map(v => ({
        author: v.authorAttribution && v.authorAttribution.displayName || 'A Google user',
        url: v.authorAttribution && v.authorAttribution.uri || null,
        rating: v.rating,
        text: v.text.text,
        when: v.relativePublishTimeDescription || '',
      })),
    });
    const res = new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600, s-maxage=2592000' } });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (e) {
    return new Response(null, { status: 204 });
  }
}
