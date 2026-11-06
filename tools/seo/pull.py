#!/usr/bin/env python3
"""Pull Search Console and GA4 numbers for the SEO agent.

Reads a Google service account key from the GOOGLE_SA_KEY environment
variable (the whole JSON as one string) or from a file named by
GOOGLE_SA_KEY_FILE. The account only needs read access:
  - Search Console: added as a Restricted user on the Domain property
  - GA4: added as a Viewer on the property
Settings come from seo/config.json. Output: seo/data/<date>.json (git-ignored:
the repo is public, so raw numbers stay out of it). Search Console keeps 16
months of history, so each run compares against Google's own past data
instead of a file we keep.

  pip install google-auth requests
  python3 tools/seo/pull.py            # last 28 days vs the 28 before
"""
import datetime as dt, json, os, sys, urllib.parse
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CFG = json.load(open(os.path.join(ROOT, 'seo', 'config.json')))
SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly',
          'https://www.googleapis.com/auth/analytics.readonly']

def creds():
    raw = os.environ.get('GOOGLE_SA_KEY')
    if not raw and os.environ.get('GOOGLE_SA_KEY_FILE'):
        raw = open(os.environ['GOOGLE_SA_KEY_FILE']).read()
    if not raw:
        sys.exit('No service account key: set GOOGLE_SA_KEY (see docs/seo-agent-setup.md).')
    c = service_account.Credentials.from_service_account_info(json.loads(raw), scopes=SCOPES)
    c.refresh(Request())
    return c

def windows(days=28, lag=3):
    # Search Console data lags 2-3 days.
    end = dt.date.today() - dt.timedelta(days=lag)
    cur = (end - dt.timedelta(days=days - 1), end)
    prev = (cur[0] - dt.timedelta(days=days), cur[0] - dt.timedelta(days=1))
    return cur, prev

def gsc(tok, start, end, dims, limit=1000, filters=None):
    site = urllib.parse.quote(CFG['search_console_property'], safe='')
    body = {'startDate': str(start), 'endDate': str(end), 'dimensions': dims, 'rowLimit': limit}
    if filters: body['dimensionFilterGroups'] = [{'filters': filters}]
    r = requests.post(f'https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query',
                      headers={'Authorization': f'Bearer {tok}'}, json=body, timeout=60)
    r.raise_for_status()
    return [dict(zip(dims, row['keys']), clicks=row['clicks'], impressions=row['impressions'],
                 ctr=round(row['ctr'], 4), position=round(row['position'], 1)) for row in r.json().get('rows', [])]

def gsc_sitemaps(tok):
    site = urllib.parse.quote(CFG['search_console_property'], safe='')
    r = requests.get(f'https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/sitemaps',
                     headers={'Authorization': f'Bearer {tok}'}, timeout=60)
    return r.json() if r.ok else {'error': r.text[:300]}

def inspect(tok, url):
    r = requests.post('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
                      headers={'Authorization': f'Bearer {tok}'}, timeout=60,
                      json={'inspectionUrl': url, 'siteUrl': CFG['search_console_property']})
    if not r.ok: return {'error': r.text[:300]}
    res = r.json().get('inspectionResult', {}).get('indexStatusResult', {})
    return {k: res.get(k) for k in ('verdict', 'coverageState', 'googleCanonical', 'lastCrawlTime', 'pageFetchState')}

def ga4(tok, start, end):
    pid = CFG.get('ga4_property_id')
    if not pid: return {'skipped': 'ga4_property_id not set in seo/config.json'}
    url = f'https://analyticsdata.googleapis.com/v1beta/properties/{pid}:runReport'
    H = {'Authorization': f'Bearer {tok}'}
    organic = {'filter': {'fieldName': 'sessionDefaultChannelGroup', 'stringFilter': {'value': 'Organic Search'}}}
    out = {}
    r = requests.post(url, headers=H, timeout=60, json={
        'dateRanges': [{'startDate': str(start), 'endDate': str(end)}],
        'dimensions': [{'name': 'landingPagePlusQueryString'}],
        'metrics': [{'name': 'sessions'}, {'name': 'engagedSessions'}],
        'dimensionFilter': organic, 'limit': 100})
    out['organic_landing_pages'] = r.json() if r.ok else {'error': r.text[:300]}
    r = requests.post(url, headers=H, timeout=60, json={
        'dateRanges': [{'startDate': str(start), 'endDate': str(end)}],
        'dimensions': [{'name': 'eventName'}, {'name': 'sessionDefaultChannelGroup'}],
        'metrics': [{'name': 'eventCount'}],
        'dimensionFilter': {'filter': {'fieldName': 'eventName', 'inListFilter': {'values': CFG['ga4_key_events']}}}})
    out['key_events'] = r.json() if r.ok else {'error': r.text[:300]}
    return out

def main():
    tok = creds().token
    (cs, ce), (ps, pe) = windows()
    data = {'pulled': dt.datetime.now().isoformat(timespec='minutes'),
            'window': {'current': [str(cs), str(ce)], 'previous': [str(ps), str(pe)]}}
    q0, q1 = cs - dt.timedelta(days=91), ce - dt.timedelta(days=91)
    data['window']['quarter_ago'] = [str(q0), str(q1)]
    data['queries'] = {'current': gsc(tok, cs, ce, ['query']), 'previous': gsc(tok, ps, pe, ['query']),
                       'quarter_ago': gsc(tok, q0, q1, ['query'])}
    data['pages'] = {'current': gsc(tok, cs, ce, ['page']), 'previous': gsc(tok, ps, pe, ['page'])}
    data['query_page'] = gsc(tok, cs, ce, ['query', 'page'], limit=2000)
    data['sitemaps'] = gsc_sitemaps(tok)
    data['inspection'] = {u: inspect(tok, u) for u in CFG['inspect_urls']}
    data['ga4'] = ga4(tok, cs, ce)
    os.makedirs(os.path.join(ROOT, 'seo', 'data'), exist_ok=True)
    out = os.path.join(ROOT, 'seo', 'data', f'{dt.date.today()}.json')
    json.dump(data, open(out, 'w'), indent=1, ensure_ascii=False)

    # Tracked searches: where each one stands now and 28 days ago.
    prev = {r['query'].lower(): r for r in data['queries']['previous']}
    cur = {r['query'].lower(): r for r in data['queries']['current']}
    data['targets'] = {g: [{'query': q, 'now': cur.get(q.lower()), 'before': prev.get(q.lower())}
                           for q in qs] for g, qs in CFG['targets'].items() if not g.startswith('_')}
    print('wrote', os.path.relpath(out, ROOT))

if __name__ == '__main__':
    main()
