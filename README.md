# Upper Room Christian Bookshop Cafe: website

The website for upperroombookshop.com, hosted on Cloudflare (a Worker with static assets).

## How it works

A small Python script (no extra packages) builds plain HTML pages into `dist/`. On every push to `main`, Cloudflare Workers Builds runs `npx wrangler deploy`. That runs the script (see `wrangler.jsonc`) and publishes `dist/`. The contact form handler is in `functions/api/contact.js`, and `worker/index.js` routes `/api/contact` to it.

| Folder / file | What it is |
|---|---|
| `content/catalogue.json` | Words around the Books & gifts pages (section blurbs, hold notes). The books themselves come live from Square |
| `content/settings.json` | **The things staff change:** opening hours, phone and email, Coffee with Christ time, Narellan status, announcement banner, gift card, donate and Google Maps links |
| `src/` | Page templates, styles and scripts (`build.py` runs everything) |
| `static/img/` | Photos and logos, copied to `/img/` on the site |
| `functions/api/contact.js` | Contact form handler: Turnstile spam check, then emails info@ through Resend. Also carries hold and order requests from Books & gifts |
| `worker/catalogue.js` | Reads books, gifts and stock from Square for `/books` (see `docs/cloudflare-setup.md`, section 9) |
| `src/_redirects` | Old Squarespace addresses that forward to the new pages |
| `src/_headers` | Security and caching headers |
| `docs/` | Setup and go-live guides |

## Common edits

All of these are in `content/settings.json`. Edit the file on GitHub (pencil icon), commit, and the site updates in about a minute.

- **Ramsgate address:** `ramsgate.address`. This one entry updates every page. If the shop moves, also check the Google Place ID (`links.google_place_id` here and `GOOGLE_PLACE_ID` in `wrangler.jsonc`), and a few photo descriptions and the Ramsgate intro that mention Rocky Point Road.
- **Opening hours:** `ramsgate.hours`. Times are 24-hour (`"16:00"`). Set `"closed": true` for a closed day. Also update `hours_summary` (the short line shown before the page knows the time, e.g. "Mon–Sat from 7am").
- **Announcement banner:** set `announcement.show` to `true` and write the `text`. Optional `link_text` and `link_url`. Set `show` back to `false` to remove it.
- **Coffee with Christ:** `day` (full day name) and `start` / `end` times. If the day changes, some sentences on the Coffee with Christ and Ramsgate pages also mention Thursday, so ask for those to be updated too.
- **Holiday hours:** add entries to `ramsgate.special_hours` (see `docs/cloudflare-setup.md`, section 7).
- **Homepage and featured photos:** `featured.hero.slides` is the rotating homepage background, and `seconds` is how long each photo holds. `featured.slots` lists the photos each homepage tile takes turns through, one a month. Add `"months": [3, 4, 5]` to show a photo only in those months. The first photo in a slot must be an all-year one. To use a new photo, run `python3 tools/add_photo.py "path/to/original.jpg"` (add `--width 1600` for the hero) and then `python3 tools/optimise.py`. Please check people in a photo have agreed to appear, especially children.
- **Google reviews:** `reviews.curated` or the live feed (section 6).
- **Instagram feed:** `instagram_feed.behold_feed_id` (see `docs/cloudflare-setup.md`, section 5).
- **Books & gifts:** add or change books in Square; the site picks them up within 10 minutes. Section blurbs and notes are in `content/catalogue.json` (section 9).
- **Narellan:** `status` (e.g. "Opening soon"), `hours`, and `mailchimp_form_action` (see `docs/cloudflare-setup.md`).

## Build locally

```
python3 src/build.py           # writes dist/
npx wrangler dev               # builds and serves it with the redirects and the contact form
```

## Pages and addresses

`/` · `/visit` · `/visit/ramsgate` · `/visit/narellan` · `/books` (and `/books/all`, `/books/<section>`, `/books/item/<id>`) · `/coffee-with-christ` · `/events` · `/explore-the-faith` · `/gallery` · `/support` · `/contact`
