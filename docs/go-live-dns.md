# Going live on upperroombookshop.com

**Don't start this until the pages.dev version has been checked and approved.** The main risk is email: info@ runs on Google Workspace, and its DNS records must come across exactly or mail stops arriving.

## Before you start

1. **Write down every current DNS record.** In Squarespace: Settings → Domains → upperroombookshop.com → DNS settings. Screenshot or copy every record, including the "Squarespace Defaults" and any custom ones.
2. Check which records Google Workspace needs: admin.google.com → Account → Domains → Manage domains. Expect:
   - **MX:** `smtp.google.com` (priority 1), or the older five `aspmx.l.google.com` / `alt1…alt4` records
   - **SPF:** a TXT on `@` with `v=spf1 include:_spf.google.com ~all`
   - **DKIM:** a TXT on `google._domainkey` (a long `v=DKIM1; k=rsa; p=…` value)
   - **DMARC:** a TXT on `_dmarc` (for example `v=DMARC1; p=none; …`)
   - **Verification:** a TXT on `@` starting `google-site-verification=…`
3. Turn off **DNSSEC** at Squarespace Domains if it's on (it blocks a nameserver change). You can turn it back on in Cloudflare afterwards.

## Move DNS to Cloudflare

1. Cloudflare → **Add a domain** → `upperroombookshop.com` → Free plan. Cloudflare scans and imports existing records.
2. **Compare the import against your list, record by record.** Add anything missing. Every Google record above must be there with the exact same value.
3. Set all Google records (MX, TXT) to **DNS only** (grey cloud). MX and TXT can't be proxied anyway; just confirm.
4. **Do not turn on Cloudflare Email Routing.** It replaces the MX records and would take mail away from Google Workspace.
5. Delete the old Squarespace website records (the `A` records to Squarespace IPs and the `www` CNAME to `ext-cust.squarespace.com`). The Worker step below replaces them.
6. Cloudflare shows two nameservers. In Squarespace → Domains → upperroombookshop.com → **Nameservers → Use custom nameservers**, enter them.
7. Wait for Cloudflare to email "your domain is active" (usually under an hour, up to 24).

## Point the domain at the new site

1. Worker → **Settings → Domains & Routes → Add → Custom domain** → `www.upperroombookshop.com`. Then add `upperroombookshop.com` too. After that, you can turn off the workers.dev address so Google doesn't index the test copy.
2. Make `www` the main address (it's what Google already knows): Cloudflare → **Rules → Redirect Rules → Create** → "Redirect from root to WWW" template.
3. Add the Turnstile hostname `upperroombookshop.com` if you haven't, and add Resend's DNS records if they were set up in Squarespace before the move.

## Check afterwards

- [ ] Send an email to info@ from a personal account, and reply from info@. Both work.
- [ ] Run upperroombookshop.com through mxtoolbox.com (MX, SPF, DMARC all green).
- [ ] www and the bare domain both load the new site over https.
- [ ] Old addresses forward: `/grand-opening` → `/gallery`. `/learn-more` and `/contact` still work.
- [ ] Contact form arrives at info@.
- [ ] Google Search Console: add the domain if it isn't there, and submit `https://www.upperroombookshop.com/sitemap.xml`.
- [ ] Update the website link in the Google Business Profile if it changed.
- [ ] Only then cancel the Squarespace **website** plan. Keep the **domain** registration (or transfer it to Cloudflare Registrar later).
