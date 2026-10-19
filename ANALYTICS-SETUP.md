# Connect Google Analytics and Search Console to the dashboard

One-time setup, about 15 minutes. After it, the dashboard's **Traffic** tab
refreshes itself every morning. You need admin access to the NLC Google
Analytics property, the Search Console property, and this GitHub repo.

## Before you start: make sure Google Analytics is actually installed

The dashboard's live-site audit checks every page for the Google Analytics
tag. In the repository copy, the tag on `index.html` still contains the
template placeholder `GA_MEASUREMENT_ID`, and no other page has a tag. If
the live site is the same, Google Analytics has no data to report.

Fix: in Google Analytics, open **Admin → Data streams → (your web stream)**
and copy the **Measurement ID** (`G-XXXXXXXXXX`). Put it in place of
`GA_MEASUREMENT_ID` and add the same snippet to the `<head>` of **every**
page, English and Arabic. The Live site tab shows coverage per page.

## Step 1. Create a read-only robot account (Google Cloud)

1. Go to https://console.cloud.google.com and create a project, for
   example `nlc-dashboard` (or reuse an existing one).
2. Open **APIs & Services → Library** and enable both:
   - **Google Analytics Data API**
   - **Google Search Console API**
3. Open **IAM & Admin → Service accounts → Create service account**.
   Name it `nlc-dashboard`. Skip the optional role and user steps.
4. Open the new account → **Keys → Add key → Create new key → JSON**.
   A `.json` file downloads. Treat it like a password.
5. Copy the account's email address. It looks like
   `nlc-dashboard@your-project.iam.gserviceaccount.com`.

## Step 2. Give it view access

**Google Analytics:** **Admin → Property access management → + → Add
users**, paste the service account email, role **Viewer**, uncheck
"notify". While in Admin, open **Property details** and copy the
**Property ID** (a number like `412345678`, not the `G-` ID).

**Search Console:** open the nlc.com.sa property → **Settings → Users and
permissions → Add user**, paste the email, permission **Restricted**.
Note the property name shown in the top-left selector:
- a domain property is written as `sc-domain:nlc.com.sa`
- a URL-prefix property is written exactly as shown, e.g. `https://nlc.com.sa/`

## Step 3. Store the three values in GitHub

Repo **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | the entire contents of the downloaded `.json` file |
| `GA4_PROPERTY_ID` | the numeric Property ID |
| `GSC_SITE_URL` | `sc-domain:nlc.com.sa` (or your URL-prefix property) |

Secrets are encrypted; they never appear in the repo, the logs or the page.
Delete the downloaded `.json` file from your computer afterwards.

## Step 4. Decide who may see the numbers

This repository is **public**, and so is its GitHub Pages site. Traffic
figures, top pages, search terms and download counts would be visible to
anyone with the link. So the workflow **refuses to fetch** traffic data in
a public repo unless you explicitly allow it. Pick one:

- **Keep it private:** make the repository private (Settings → General →
  Danger zone → Change visibility). The data then stays private, but on
  GitHub's free plan the Pages site stops working, so you would view the
  dashboard by opening `dashboard.html` from the repo or via a private host.
- **Accept public numbers:** under **Variables** (next to Secrets), add
  `PUBLISH_ANALYTICS` with the value `true`.

## Step 5. Run it

**Actions → Site audit → Run workflow**. After a couple of minutes the
Traffic tab shows your numbers, and it refreshes daily at 06:17 Riyadh time.
If something is wrong, the tab and the run's summary say what failed (for
example "HTTP 403: User does not have sufficient permissions", which means
step 2 is incomplete).

## What the Traffic tab shows

**Google Analytics (last 28 days vs the 28 before):** visitors and new
visitors, visits, page views, engaged-visit rate, average visit length,
key events (conversions), a 90-day daily visitor chart, traffic channels,
countries, devices, English vs Arabic page views, the 15 most viewed
pages, and datasheet/file downloads.

**Search Console (same comparison, 3-day reporting delay):** clicks,
times shown in Google results, click-through rate, average position, 90-day
daily charts, the top 25 search terms people used to find you, the pages
that get search clicks, and clicks by country.
