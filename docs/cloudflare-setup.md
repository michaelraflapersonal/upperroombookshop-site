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
4. In the Worker → Settings → Variables and Secrets add `GOOGLE_PLACES_API_KEY` as a Secret, then redeploy. `GOOGLE_PLACE_ID` is set in `wrangler.jsonc` under `vars` (a dashboard-only Text variable would be removed on deploy).
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

## 9. Books & gifts catalogue (live from Square)

The `/books` pages show every book and gift from Square: titles, covers, prices, stock at Ramsgate and the shelf spot. The Worker reads Square (it never changes anything there), keeps a copy for 10 minutes, and falls back to the last good copy for up to a week if Square is down. Until the token below is set, `/books` shows a friendly "call us" message.

**Connect Square (once):**
1. Go to developer.squareup.com and sign in with the shop's Square account. **Applications → +** and name it "Upper Room website".
2. Open the app, switch the toggle at the top to **Production**, then **Credentials → Production Access token → Show**, and copy it.
3. Cloudflare → Workers & Pages → `upperroombookshop-site` → **Settings → Variables and Secrets → Add**: type **Secret**, name `SQUARE_ACCESS_TOKEN`, paste the token, **Deploy**.
4. Open `/books`. The first visit takes a few seconds while it reads Square; after that it's instant.

The token can see everything in the Square account, so keep it only in Cloudflare (never in GitHub, email or chat). The website code only reads the catalogue and stock. To revoke or replace it, use the same Credentials page in Square, then update the secret.

**What appears:** items in the Square categories named in `content/catalogue.json` (`square_categories`: Books and Gifts, including their subcategories), at the Ramsgate location, and not set to hidden online. Each Books subcategory becomes a section. Archived items are left out.

**How to fill items in Square so they look their best:**
- **Shelf spot:** put it in the variation SKU as `Section · Column 6, Rows 2–5` (several spots: `… and Column 10, Rows 4–5`). The site draws the bookcase from these.
- **Description:** first line is a one-sentence summary, then a paragraph, then optional lines `Best for: …`, `Level: Easy read …` and `Tradition: …`. "Level" and "Tradition" become the filters.
- **ISBN:** in the variation's UPC/GTIN field.
- **Author:** the site reads it from the title ("… by Name") or the description ("By Name."). For full control, add an item custom attribute called **Author** in Square.
- **Cover:** the item's first image. Sharp, upright covers look best; very small images (under about 500px) look soft.

**Words around the catalogue** (section blurbs, the "What brings you in?" paths, hold and order notes, the shelf-map notes) are in `content/catalogue.json`.

**Hold and order requests** use the contact form's Turnstile and Resend settings (sections 2 and 3). They arrive at info@ with a subject like "Please put aside: Title (from Name)", with the ISBN, price and shelf spot inside. Reply to the email to answer.

**Pull-request previews don't share the live site's secrets.** A secret added under Production is not seen by previews. To test on a preview, switch Variables and Secrets to **Previews Base** and add `SQUARE_ACCESS_TOKEN` there too. It applies to previews created after that, so push a new branch or ask Claude to recreate the preview.

**If `/books` says the shelves aren't loading**, open `/api/catalogue` on the same site. The `reason` it shows tells you why: `no_token` means this deployment can't see the secret, and `square_401_UNAUTHORIZED` means the token is wrong, revoked, or a Sandbox token. For more detail, check Worker → Logs. "Square … 401" means the token is wrong or revoked. "Exceeded CPU" means the catalogue has grown past what the Workers Free plan allows in one go (10 ms of processing per visit); the Workers Paid plan (US$5 a month) removes that limit.
