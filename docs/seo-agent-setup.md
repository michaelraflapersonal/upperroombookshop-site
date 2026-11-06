# Setting up the SEO agent (about 20 minutes, once)

The SEO agent reads Search Console and Google Analytics through a **read-only
Google service account**: a robot Google account that can look but not
change anything. You create it once; the agent uses it every fortnight.

## 1. Search Console: verify the whole domain

1. Go to https://search.google.com/search-console and choose **Add property**.
2. Pick **Domain** (left box) and enter `upperroombookshop.com`.
3. Google shows a TXT record starting `google-site-verification=`. Copy it.
4. In Cloudflare: your domain → **DNS** → **Records** → **Add record**.
   Type **TXT**, Name **@**, Content = the value you copied. Save.
5. Back in Search Console, press **Verify**. It can take a few minutes.
6. In the new property: **Sitemaps** → enter `sitemap.xml` → **Submit**.

If you already had a property for the old Squarespace site, keep it. The
Domain property covers www and non-www together and keeps the history.

## 2. Google Analytics: reuse the existing property

The new site has no Analytics tag yet, so it isn't being measured.

1. https://analytics.google.com → **Admin** (gear, bottom left).
2. **Data collection and modification** → **Data streams** → open the web
   stream for upperroombookshop.com (the one Squarespace used is fine; reusing
   it keeps your history). If there isn't one, **Add stream** → **Web**.
3. Copy the **Measurement ID** (starts with `G-`). Put it in
   `content/settings.json` under `analytics.ga4_id`, or send it to Claude.
   Then remove the Google Analytics setting from Squarespace if it is still
   running there.
4. **Admin** → **Property details**: copy the **Property ID** (a number). It
   goes in `seo/config.json` as `ga4_property_id`.
5. Optional but useful: **Admin** → **Events**, and once the events below
   start appearing (a day or two after the tag goes live), mark
   `call`, `get_directions` and `generate_lead` as **key events**.

## 3. Create the read-only service account

1. https://console.cloud.google.com → pick the **Upper Room** project (the one
   that already holds the Places key for reviews).
2. **APIs & Services** → **Library**. Search for and **Enable** both:
   - Google Search Console API
   - Google Analytics Data API
3. **IAM & Admin** → **Service Accounts** → **Create service account**.
   Name: `seo-agent`. Skip the optional role and user steps. **Done**.
4. Copy its email (looks like `seo-agent@<project>.iam.gserviceaccount.com`).
5. Open it → **Keys** → **Add key** → **Create new key** → **JSON**. A file
   downloads. Treat it like a password: don't email it, paste it in chat or
   commit it.

## 4. Give the service account read access

- **Search Console:** the property → **Settings** → **Users and permissions**
  → **Add user** → paste the service account email → Permission
  **Restricted** → Add.
- **Analytics:** **Admin** → **Property access management** → **+** → **Add
  users** → paste the email → role **Viewer** → untick "Notify by email" →
  Add.

## 5. Put the key where the agent can read it

In Claude: open **Project settings** → **Cloud environment** → the gear beside
the selected environment → **Environment variables**. Add:

```
GOOGLE_SA_KEY=<the whole contents of the JSON file, on one line>
```

Then delete the downloaded file from your Downloads folder. If the key is ever
exposed, delete it in Cloud Console (service account → Keys) and make a new one.

## What the agent then does

Every fortnight it runs `tools/seo/pull.py` and `tools/seo/site_check.py`,
follows `seo/AGENT.md`, and opens one pull request with a short report and at
most 3 changes. Nothing reaches the live site until you merge.

## Visit events the site sends to Analytics

| Event | When |
|---|---|
| `call` | someone taps the phone number |
| `get_directions` | someone opens a Google or Apple Maps link |
| `gift_card_click` | someone opens the Square gift card page |
| `donate_click` | someone opens the donation link |
| `generate_lead` | the contact form (or a book hold/question) is sent |
