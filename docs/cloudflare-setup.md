# Cloudflare setup

The site runs as a Cloudflare **Worker with static assets** (`wrangler.jsonc`). This setup doesn't touch upperroombookshop.com, DNS or email. Going live on the real domain is covered in `go-live-dns.md`.

## 1. Connect the repo (done 4 Nov 2026)

Workers & Pages → Create → Import a repository → `upperroombookshop-site`. Leave the build command blank and set the deploy command to `npx wrangler deploy`. Wrangler reads `wrangler.jsonc`, runs `python3 src/build.py`, then uploads `dist/` and `worker/index.js`. Every push to `main` deploys, and other branches get preview builds. The test address is `upperroombookshop-site.<your-subdomain>.workers.dev`.

## 2. Contact form: Turnstile (spam check)

1. Cloudflare dashboard → **Turnstile → Add widget**. Name it "Upper Room contact form".
2. Hostnames: add your `workers.dev` address and `upperroombookshop.com`. Widget mode: **Managed**.
3. Copy the **Site key** and **Secret key**.
4. Add the keys to the Worker:
   - `TURNSTILE_SITE_KEY` = the site key. It's a **build** variable, because the build writes it into the page: Worker → Settings → Build → Variables and secrets.
   - `TURNSTILE_SECRET_KEY` = the secret key (type Secret): Worker → Settings → Variables and Secrets.

Until these are set, the site uses Cloudflare's test keys, which let everything through. That is fine for a first look but not for going live.

## 3. Contact form: Resend (sends the email)

1. Sign up at resend.com (free: 3,000 emails a month, 100 a day).
2. **Domains → Add domain** → `upperroombookshop.com`. Resend shows 3 DNS records (an MX and a TXT on a `send` subdomain, plus a DKIM TXT `resend._domainkey`). These sit alongside Google Workspace and don't affect info@ mail.
   - **Before the domain moves:** add them in Squarespace (Settings → Domains → DNS settings → Add record).
   - **After it moves:** add them in Cloudflare DNS instead.
   - Then click **Verify** in Resend.
3. **API Keys → Create** with "Sending access" only. Copy it.
4. Add these in Worker → Settings → Variables and Secrets:
   - `RESEND_API_KEY` = the key (Secret)
   - `CONTACT_TO` = `info@upperroombookshop.com` (Text)
   - `CONTACT_FROM` = `Upper Room website <website@upperroombookshop.com>` (Text)
5. Redeploy (Deployments → latest → Retry, or push any commit) so the new settings take effect.

Test: send a message from `/contact` on the workers.dev address. It should arrive at info@ within a few seconds. Replying to it goes straight to the visitor. If it fails, check the Worker's **Logs** tab.

## 4. Narellan sign-up: Mailchimp

1. Mailchimp → **Audience → Signup forms → Embedded forms**.
2. In the generated code, find `<form action="https://…list-manage.com/subscribe/post?u=…&amp;id=…"`. Copy the whole address inside the quotes.
3. Paste it into `content/settings.json` → `narellan.mailchimp_form_action`, and commit.

Until then the Narellan page asks people to email info@ instead. Tip: create a tag or group called "Narellan opening" in Mailchimp so you know who to email on opening day.

## 5. Instagram feed (free)

The home and gallery pages have a "Follow along" strip. It shows six placeholder photos until a live feed is connected, then shows the latest posts. It costs nothing.

1. The Instagram account must be a **Business or Creator** (professional) account. It is free to switch in Instagram: Settings → Account type and tools.
2. Sign up at behold.so (free plan, one feed) and choose **Create feed → Instagram**. Connect @upperroombookshop and pick a grid layout (the layout doesn't matter; the site uses its own styling).
3. In Behold, open the feed and copy its **Feed URL**, which looks like `https://feeds.behold.so/AbCdEf123`. The part after the last `/` is the feed ID.
4. Paste the ID into `content/settings.json` → `instagram_feed.behold_feed_id` and commit. The strip updates in about a minute.

If Behold is ever down, or the ID is empty, the strip quietly keeps the placeholder photos, which link to the Instagram page.

## 6. Google reviews strip

The home and Ramsgate pages have a "What people say about us" strip with a link to read and leave reviews on Google. Two ways to fill it with reviews:

**A. Live from Google (automatic).** Needs a Google Cloud project with billing switched on (Google asks for a card even though the usage here is tiny: the site asks Google at most twice a day and caches the answer).
1. Google Cloud console → create a project → enable **Places API (New)**.
2. Credentials → Create API key → restrict it to *Places API (New)*.
3. Find the shop's Place ID with Google's "Place ID Finder" (search "Upper Room Christian Bookshop Cafe Ramsgate"). It starts with `ChIJ`.
4. In the Worker → Settings → Variables and Secrets add `GOOGLE_PLACES_API_KEY` (Secret) and `GOOGLE_PLACE_ID` (Text), then redeploy.
Google returns the rating, review count and up to five recent reviews. The site shows the 4 and 5 star ones.

**B. Hand-picked (free, no keys).** In `content/settings.json` under `reviews.curated`, add real reviews you have permission to show: `{"author": "Name", "rating": 5, "text": "…", "when": "October 2026"}`. Optionally set `reviews.write_review_url` to the shop's "Write a review" link.

If neither is set, the strip shows just the Google buttons.

## 7. Opening hours that update themselves

The "Open now · until 4pm" line is worked out in the visitor's browser from `ramsgate.hours`, always in Sydney time. For public holidays or one-off changes, add to `ramsgate.special_hours` in `content/settings.json`:

```
{ "date": "2026-12-25", "label": "Christmas Day", "closed": true }
{ "date": "2026-12-24", "label": "Christmas Eve", "open": "07:00", "close": "12:00" }
{ "date": "2026-12-27", "until": "2027-01-02", "label": "Summer break", "closed": true }
```
Past dates can stay; they do nothing. Upcoming ones also appear as a short "Special hours" line under the hours table.

## 8. Analytics (optional, free)

Cloudflare → **Web Analytics → Add a site**. It's free, and needs no cookies or banner.
