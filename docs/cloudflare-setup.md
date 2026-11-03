# Cloudflare Pages setup

This gets the site running on a free `*.pages.dev` address for testing. It does **not** touch upperroombookshop.com, DNS or email. Going live on the real domain is in `go-live-dns.md`.

## 1. Connect the repo (about 5 minutes)

1. Sign in at dash.cloudflare.com (create a free account if needed).
2. **Workers & Pages → Create → Pages → Connect to Git.** Authorise GitHub and pick this repository.
3. Build settings:
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: `python3 src/build.py`
   - Build output directory: `dist`
   - Root directory: leave blank
4. **Save and Deploy.** You get an address like `upperroom-site.pages.dev`.

Every push to `main` redeploys. Pushes to other branches get their own preview address.

## 2. Contact form: Turnstile (spam check)

1. Cloudflare dashboard → **Turnstile → Add widget**. Name it "Upper Room contact form".
2. Hostnames: add `upperroom-site.pages.dev` (your Pages address) and `upperroombookshop.com`. Widget mode: **Managed**.
3. Copy the **Site key** and **Secret key**.
4. In the Pages project → **Settings → Variables and Secrets**, add (for Production *and* Preview):
   - `TURNSTILE_SITE_KEY` = the site key (type: Text). The build puts it into the page.
   - `TURNSTILE_SECRET_KEY` = the secret key (type: Secret).

Until these are set, the site uses Cloudflare's test keys, which let everything through. That is fine for a first look but not for going live.

## 3. Contact form: Resend (sends the email)

1. Sign up at resend.com (free: 3,000 emails a month, 100 a day).
2. **Domains → Add domain** → `upperroombookshop.com`. Resend shows 3 DNS records (an MX and a TXT on a `send` subdomain, plus a DKIM TXT `resend._domainkey`). These sit alongside Google Workspace and don't affect info@ mail.
   - **Before the domain moves:** add them in Squarespace (Settings → Domains → DNS settings → Add record).
   - **After it moves:** add them in Cloudflare DNS instead.
   - Then click **Verify** in Resend.
3. **API Keys → Create** with "Sending access" only. Copy it.
4. Add to Pages → Settings → Variables and Secrets:
   - `RESEND_API_KEY` = the key (Secret)
   - `CONTACT_TO` = `info@upperroombookshop.com` (Text)
   - `CONTACT_FROM` = `Upper Room website <website@upperroombookshop.com>` (Text)
5. **Deployments → latest → Retry deployment** so the new settings take effect.

Test: send a message from `/contact` on the pages.dev address. It should arrive at info@ within a few seconds. Replying to it goes straight to the visitor. If it fails, check **Deployments → Functions → Real-time logs**.

## 4. Narellan sign-up: Mailchimp

1. Mailchimp → **Audience → Signup forms → Embedded forms**.
2. In the generated code, find `<form action="https://…list-manage.com/subscribe/post?u=…&amp;id=…"`. Copy the whole address inside the quotes.
3. Paste it into `content/settings.json` → `narellan.mailchimp_form_action`, and commit.

Until then the Narellan page asks people to email info@ instead. Tip: create a tag or group called "Narellan opening" in Mailchimp so you know who to email on opening day.

## 5. Analytics (optional, free)

Pages project → **Metrics → Web Analytics → Enable**. No cookies or banner needed.
