#!/usr/bin/env python3
"""Pull Google Analytics 4 and Search Console statistics for the NLC
dashboard and write dashboard-analytics-data.js.

Needs a Google service account with read access to both products (see
ANALYTICS-SETUP.md) and these environment variables:

  GOOGLE_SERVICE_ACCOUNT_JSON  the service account key file contents
  GA4_PROPERTY_ID              numeric GA4 property id, e.g. 412345678
  GSC_SITE_URL                 Search Console property, e.g. sc-domain:nlc.com.sa

Either product can be left unset; its section then shows as not connected.
Requires: pip install google-auth requests
"""

import json
import os
import sys
from datetime import date, datetime, timedelta, timezone
from urllib.parse import quote

GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
GA_URL = 'https://analyticsdata.googleapis.com/v1beta/properties/{}:runReport'
GSC_URL = 'https://searchconsole.googleapis.com/webmasters/v3/sites/{}/searchAnalytics/query'

PERIOD_DAYS = 28        # headline comparison window, current vs previous
TREND_DAYS = 90         # length of the daily charts
GSC_LAG_DAYS = 3        # Search Console data is final only after ~2-3 days

GA_TOTAL_METRICS = ['activeUsers', 'newUsers', 'sessions', 'screenPageViews',
                    'engagementRate', 'averageSessionDuration', 'keyEvents']


def authorized_post(scopes):
    """Return post(url, body) -> dict, authenticated as the service account."""
    from google.oauth2 import service_account
    from google.auth.transport.requests import AuthorizedSession
    info = json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT_JSON'])
    session = AuthorizedSession(
        service_account.Credentials.from_service_account_info(info, scopes=scopes))

    def post(url, body):
        r = session.post(url, json=body, timeout=60)
        if r.status_code >= 400:
            try:
                msg = r.json().get('error', {}).get('message', r.text)
            except ValueError:
                msg = r.text
            raise RuntimeError(f'HTTP {r.status_code}: {msg[:300]}')
        return r.json()
    return post


def num(value):
    f = float(value)
    return int(f) if f.is_integer() else round(f, 4)


# ── Google Analytics 4 ─────────────────────────────────────────────

def ga_rows(response):
    """Flatten a runReport response into dicts keyed by header name."""
    dims = [h['name'] for h in response.get('dimensionHeaders', [])]
    mets = [h['name'] for h in response.get('metricHeaders', [])]
    out = []
    for row in response.get('rows', []):
        rec = {d: v.get('value') for d, v in zip(dims, row.get('dimensionValues', []))}
        rec.update({m: num(v.get('value', 0)) for m, v in zip(mets, row.get('metricValues', []))})
        out.append(rec)
    return out


def ga_report(post, prop, metrics, dimensions=(), ranges=None, order_metric=None,
              limit=None, dim_filter=None):
    body = {'dateRanges': ranges or [{'startDate': f'{PERIOD_DAYS}daysAgo', 'endDate': 'yesterday'}],
            'metrics': [{'name': m} for m in metrics]}
    if dimensions:
        body['dimensions'] = [{'name': d} for d in dimensions]
    if order_metric:
        body['orderBys'] = [{'metric': {'metricName': order_metric}, 'desc': True}]
    if limit:
        body['limit'] = limit
    if dim_filter:
        body['dimensionFilter'] = dim_filter
    return ga_rows(post(GA_URL.format(prop), body))


def fetch_ga(post, prop):
    ga = {'connected': True, 'errors': []}

    def attempt(key, fn):
        try:
            ga[key] = fn()
        except Exception as e:  # one failing report must not hide the others
            ga['errors'].append(f'{key}: {e}')

    def totals():
        rows = ga_report(post, prop, GA_TOTAL_METRICS, ranges=[
            {'startDate': f'{PERIOD_DAYS}daysAgo', 'endDate': 'yesterday', 'name': 'current'},
            {'startDate': f'{2 * PERIOD_DAYS}daysAgo', 'endDate': f'{PERIOD_DAYS + 1}daysAgo',
             'name': 'previous'}])
        by_range = {r.get('dateRange', 'current'): r for r in rows}
        cur, prev = by_range.get('current', {}), by_range.get('previous', {})
        return {m: {'cur': cur.get(m, 0), 'prev': prev.get(m, 0)} for m in GA_TOTAL_METRICS}

    def daily():
        rows = ga_report(post, prop, ['activeUsers', 'sessions', 'screenPageViews'], ['date'],
                         ranges=[{'startDate': f'{TREND_DAYS}daysAgo', 'endDate': 'yesterday'}])
        out = [{'date': f"{r['date'][:4]}-{r['date'][4:6]}-{r['date'][6:]}",
                'users': r['activeUsers'], 'sessions': r['sessions'],
                'views': r['screenPageViews']} for r in rows]
        return sorted(out, key=lambda r: r['date'])

    def pages():
        rows = ga_report(post, prop, ['screenPageViews', 'activeUsers'], ['pagePath'],
                         order_metric='screenPageViews', limit=1000)
        split = {'en': 0, 'ar': 0}
        for r in rows:
            split['ar' if r['pagePath'].startswith('/ar') else 'en'] += r['screenPageViews']
        ga['langSplit'] = split
        return [{'path': r['pagePath'], 'views': r['screenPageViews'], 'users': r['activeUsers']}
                for r in rows[:15]]

    def breakdown(dim, metric='activeUsers', limit=8):
        rows = ga_report(post, prop, [metric], [dim], order_metric=metric, limit=limit)
        return [{'name': r[dim] or '(not set)', 'value': r[metric]} for r in rows]

    def downloads():
        rows = ga_report(post, prop, ['eventCount'], ['fileName'], order_metric='eventCount',
                         limit=15, dim_filter={'filter': {'fieldName': 'eventName',
                                                          'stringFilter': {'value': 'file_download'}}})
        return [{'file': r['fileName'] or '(not set)', 'count': r['eventCount']} for r in rows]

    attempt('totals', totals)
    attempt('daily', daily)
    attempt('pages', pages)
    attempt('channels', lambda: breakdown('sessionDefaultChannelGroup', 'sessions'))
    attempt('countries', lambda: breakdown('country'))
    attempt('devices', lambda: breakdown('deviceCategory', limit=5))
    attempt('downloads', downloads)
    return ga


# ── Search Console ─────────────────────────────────────────────────

def gsc_query(post, site, start, end, dimensions=(), limit=None):
    body = {'startDate': start.isoformat(), 'endDate': end.isoformat()}
    if dimensions:
        body['dimensions'] = list(dimensions)
    if limit:
        body['rowLimit'] = limit
    res = post(GSC_URL.format(quote(site, safe='')), body)
    return [{'keys': r.get('keys', []), 'clicks': num(r.get('clicks', 0)),
             'impressions': num(r.get('impressions', 0)), 'ctr': round(r.get('ctr', 0), 4),
             'position': round(r.get('position', 0), 1)} for r in res.get('rows', [])]


def fetch_gsc(post, site, today):
    gsc = {'connected': True, 'errors': []}
    end = today - timedelta(days=GSC_LAG_DAYS)
    start = end - timedelta(days=PERIOD_DAYS - 1)
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=PERIOD_DAYS - 1)
    gsc['period'] = {'start': start.isoformat(), 'end': end.isoformat()}

    def attempt(key, fn):
        try:
            gsc[key] = fn()
        except Exception as e:
            gsc['errors'].append(f'{key}: {e}')

    def totals():
        cur = (gsc_query(post, site, start, end) or [{}])[0]
        prev = (gsc_query(post, site, prev_start, prev_end) or [{}])[0]
        return {k: {'cur': cur.get(k, 0), 'prev': prev.get(k, 0)}
                for k in ('clicks', 'impressions', 'ctr', 'position')}

    def daily():
        rows = gsc_query(post, site, end - timedelta(days=TREND_DAYS - 1), end, ['date'])
        return sorted(({'date': r['keys'][0], 'clicks': r['clicks'], 'impressions': r['impressions'],
                        'ctr': r['ctr'], 'position': r['position']} for r in rows),
                      key=lambda r: r['date'])

    def top(dim, limit):
        return [{'name': r['keys'][0], 'clicks': r['clicks'], 'impressions': r['impressions'],
                 'ctr': r['ctr'], 'position': r['position']}
                for r in gsc_query(post, site, start, end, [dim], limit)]

    attempt('totals', totals)
    attempt('daily', daily)
    attempt('queries', lambda: top('query', 25))
    attempt('pages', lambda: top('page', 15))
    attempt('countries', lambda: top('country', 8))
    attempt('devices', lambda: top('device', 5))
    return gsc


def build(env=os.environ, post_factory=authorized_post, today=None):
    today = today or date.today()
    data = {'generated': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
            'periodDays': PERIOD_DAYS,
            'ga': {'connected': False}, 'gsc': {'connected': False}}
    has_key = bool(env.get('GOOGLE_SERVICE_ACCOUNT_JSON'))
    if has_key and env.get('GA4_PROPERTY_ID'):
        try:
            data['ga'] = fetch_ga(post_factory([GA_SCOPE]), env['GA4_PROPERTY_ID'].strip())
        except Exception as e:
            data['ga'] = {'connected': False, 'errors': [str(e)]}
    if has_key and env.get('GSC_SITE_URL'):
        try:
            data['gsc'] = fetch_gsc(post_factory([GSC_SCOPE]), env['GSC_SITE_URL'].strip(), today)
        except Exception as e:
            data['gsc'] = {'connected': False, 'errors': [str(e)]}
    return data


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'dashboard-analytics-data.js'
    data = build()
    with open(out, 'w', encoding='utf-8') as f:
        f.write('/* Generated by analytics_fetch.py, %s. Do not edit by hand. */\n' % data['generated'])
        f.write('window.NLC_ANALYTICS = ')
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    for key, label in (('ga', 'Google Analytics'), ('gsc', 'Search Console')):
        part = data[key]
        if not part.get('connected'):
            reason = '; '.join(part.get('errors', [])) or 'not configured'
            print(f'{label}: not connected ({reason})')
            continue
        t = part.get('totals', {})
        if key == 'ga' and t:
            print(f"{label}: {t['activeUsers']['cur']} users, {t['sessions']['cur']} sessions, "
                  f"{t['screenPageViews']['cur']} page views in the last {PERIOD_DAYS} days")
        elif t:
            print(f"{label}: {t['clicks']['cur']} clicks, {t['impressions']['cur']} impressions, "
                  f"avg position {t['position']['cur']}")
        for err in part.get('errors', []):
            print(f'  warning: {err}')
    print(f'Wrote {out}')
    # Fail only when something was configured but nothing could be fetched.
    configured = [k for k in ('ga', 'gsc') if data[k].get('connected') or data[k].get('errors')]
    if configured and not any(data[k].get('connected') for k in configured):
        sys.exit(1)


if __name__ == '__main__':
    main()
