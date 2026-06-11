# Google Business Profile — Live Data Setup

This guide connects the dashboard's **"Latest Google Business Profile Report"**
panel to the real Google Business Profile (GBP) Performance API, replacing the
bundled sample digest. Total cost: **$0** — the API is free; Google only
requires a one-time access approval.

Until these steps are completed the panel shows the **Sample** badge and the
bundled May 2026 figures. The moment the env vars are in place it switches to
**Live** automatically — no code changes needed.

---

## Prerequisites

- The Google account that **owns or manages** the NLC Business Profile
  (the one that receives the monthly performance emails).
- ~30 minutes, plus a few days' wait for Google's approval.

---

## Step 1 — Create a Google Cloud project (5 min)

1. Go to <https://console.cloud.google.com/> and sign in with the GBP owner
   account.
2. Top bar → project selector → **New Project** → name it `nlc-dashboard` →
   **Create**.

## Step 2 — Request GBP API access (5 min + wait)

Google gates these APIs behind a short approval form:

1. Open <https://developers.google.com/my-business/content/prereqs> and follow
   the **"Request access to the API"** link (the GBP API access request form).
2. Fill it in with the NLC business details and the email of the owner account.
   For "use case" something like: *"Internal analytics dashboard displaying our
   own Business Profile performance metrics."*
3. Wait for the approval email — typically a few days. (Everything below can be
   prepared while you wait, but API calls only succeed after approval.)

## Step 3 — Enable the APIs (2 min)

In the Cloud Console, **APIs & Services → Library**, search for and **Enable**
each of:

- **Business Profile Performance API**
- **My Business Account Management API**
- **My Business Business Information API**

## Step 4 — OAuth consent screen (5 min)

1. **APIs & Services → OAuth consent screen**.
2. User type: **External** → Create.
3. App name `NLC Dashboard`, support + developer email: your address. Save.
4. Scopes: **Add or Remove Scopes** → manually add
   `https://www.googleapis.com/auth/business.manage` → Update → Save.
5. Test users: add the GBP owner account's email. Save.
   (Keeping the app in "Testing" mode is fine for an internal tool; refresh
   tokens for test users expire after 7 days, so either click **Publish app**
   once it works, or re-issue the token weekly — publishing is the right call.)

## Step 5 — Create OAuth credentials (3 min)

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**, name `nlc-dashboard`.
3. Authorized redirect URIs: add `https://developers.google.com/oauthplayground`
4. **Create** → copy the **Client ID** and **Client Secret**.

## Step 6 — Get a refresh token (5 min)

Using Google's OAuth Playground:

1. Open <https://developers.google.com/oauthplayground>.
2. Click the gear icon (top right) → tick **"Use your own OAuth credentials"**
   → paste the Client ID and Client Secret from Step 5.
3. In the left panel ("Step 1"), type the scope
   `https://www.googleapis.com/auth/business.manage` into the input box →
   **Authorize APIs**.
4. Sign in with the GBP owner account and allow access.
5. In "Step 2", click **Exchange authorization code for tokens**.
6. Copy the **Refresh token**.

## Step 7 — Find your location ID (3 min)

Easiest way — from the GBP dashboard URL:

1. Go to <https://business.google.com/locations> signed in as the owner.
2. Click the NLC Factory#2 location. The URL contains `.../l/XXXXXXXXXXXXXXX`
   or you can find the **store code / location ID** under
   **Settings → Advanced settings**.

Or via API (after approval), in OAuth Playground "Step 3":

- Request `GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts`
  → note `accounts/ACCOUNT_ID`.
- Request `GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/ACCOUNT_ID/locations?readMask=name,title`
  → each entry's `name` is `locations/XXXXXXXXXX` — the number is your
  `GBP_LOCATION_ID`.

## Step 8 — Configure the dashboard (2 min)

```bash
cd dashboard
cp .env.example .env.local
```

Fill in `.env.local`:

```ini
GBP_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GBP_CLIENT_SECRET=GOCSPX-xxxxxxxx
GBP_REFRESH_TOKEN=1//xxxxxxxx
GBP_LOCATION_ID=1234567890
GBP_LOCATION_LABEL="NLC — Factory#2, 106, Dammam"
```

Restart the dev server (`npm run dev`). The panel header badge flips from
**Sample** to **Live**, showing the last full calendar month with
month-over-month deltas and real top search terms. Data is cached server-side
for 6 hours. You can also verify raw JSON at `/api/gbp` (`"source": "live"`).

> If deploying (e.g. Vercel/Netlify), add the same five variables in the
> hosting provider's environment settings instead of a file.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Badge stays **Sample** | One of the 4 required env vars missing, or server not restarted |
| `403` in server logs | API access not yet approved (Step 2) or API not enabled (Step 3) |
| `401 invalid_grant` | Refresh token expired — app still in "Testing" mode (Step 4.5: publish it) |
| Keywords list empty | Search keyword data lags ~5 days into the new month — normal |

## Adding more locations later

`lib/gbp.ts` currently reads one `GBP_LOCATION_ID`. To show all NLC branches,
list location IDs (Step 7 API call returns all of them) and extend
`getGbpReport()` to loop over them — the panel/data shapes already support one
report object per location.
