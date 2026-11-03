# Upper Room Christian Bookshop Cafe: website

The website for upperroombookshop.com, hosted on Cloudflare Pages.

## How it works

A small Python script (no extra packages) builds plain HTML pages into `dist/`. Cloudflare Pages runs that script on every push to `main` and publishes the result. The contact form is a Cloudflare Pages Function in `functions/`.

| Folder / file | What it is |
|---|---|
| `content/settings.json` | **The things staff change:** opening hours, phone and email, Coffee with Christ time, Narellan status, announcement banner, gift card and donate links |
| `src/` | Page templates, styles and scripts (`build.py` runs everything) |
| `static/img/` | Photos and logos, copied to `/img/` on the site |
| `functions/api/contact.js` | Contact form handler: Turnstile spam check, then emails info@ through Resend |
| `src/_redirects` | Old Squarespace addresses that forward to the new pages |
| `src/_headers` | Security and caching headers |
| `docs/` | Setup and go-live guides |

## Common edits

All of these are in `content/settings.json`. Edit the file on GitHub (pencil icon), commit, and the site updates in about a minute.

- **Opening hours:** `ramsgate.hours`. Times are 24-hour (`"16:00"`). Set `"closed": true` for a closed day. Also update `hours_summary` (the short line shown before the page knows the time, e.g. "Mon–Sat from 7am").
- **Announcement banner:** set `announcement.show` to `true` and write the `text`. Optional `link_text` and `link_url`. Set `show` back to `false` to remove it.
- **Coffee with Christ:** `day` (full day name) and `start` / `end` times. If the day changes, some sentences on the Coffee with Christ and Ramsgate pages also mention Thursday, so ask for those to be updated too.
- **Narellan:** `status` (e.g. "Opening soon"), `hours`, and `mailchimp_form_action` (see `docs/cloudflare-setup.md`).

## Build locally

```
python3 src/build.py           # writes dist/
npx wrangler pages dev dist    # serves it with the redirects and the contact function
```

## Pages and addresses

`/` · `/visit` · `/visit/ramsgate` · `/visit/narellan` · `/coffee-with-christ` · `/events` · `/learn-more` · `/gallery` · `/support` · `/contact`
