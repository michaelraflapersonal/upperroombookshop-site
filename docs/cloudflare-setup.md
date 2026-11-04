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

## 5. Analytics (optional, free)

Cloudflare → **Web Analytics → Add a site**. It's free, and needs no cookies or banner.
