# Protecting /admin.html on www.nlc.com.sa

The client-side password gate in admin.html is a **deterrent, not real security**. Anyone can:
- See `admin.html` HTML/JS by choosing "View Source"
- Read the SHA-256 password hash
- Disable JS and bypass the gate entirely

For production on `www.nlc.com.sa`, add server-side HTTP Basic Authentication. Pick the section that matches your hosting:

---

## Option A — cPanel / Apache shared hosting (most common for `.com.sa` domains)

This is likely what you have if the domain was purchased through a Saudi hosting reseller (e.g. SaudiNIC, OrbitHost, Buzinessware, etc.).

### 1. Create a password file

SSH into the server (or use cPanel "Terminal"). Run:
```bash
htpasswd -c ~/.htpasswds/admin-users admin
# You'll be prompted for the password: NLC-Portal-2026!Zx9
```

If `htpasswd` isn't available, use an online generator (e.g. https://www.web2generators.com/apache-tools/htpasswd-generator) to make a line like:
```
admin:$apr1$xxxxxxxx$abc123...
```
and save it as `~/.htpasswds/admin-users`.

### 2. Add a `.htaccess` file next to `admin.html`

Create `public_html/.htaccess` (or append if it exists):

```apache
<Files "admin.html">
    AuthType Basic
    AuthName "NLC Admin — Authorized Users Only"
    AuthUserFile /home/YOUR_CPANEL_USER/.htpasswds/admin-users
    Require valid-user
</Files>
```

Replace `YOUR_CPANEL_USER` with your actual cPanel username. The path must be absolute.

Now `www.nlc.com.sa/admin.html` will show the browser's native login prompt before serving any content.

---

## Option B — Nginx

Append inside your `server { }` block in `/etc/nginx/sites-available/nlc.com.sa`:

```nginx
location = /admin.html {
    auth_basic "NLC Admin — Authorized Users Only";
    auth_basic_user_file /etc/nginx/.htpasswd-nlc-admin;
    try_files $uri =404;
}
```

Generate the password file:
```bash
sudo htpasswd -c /etc/nginx/.htpasswd-nlc-admin admin
sudo systemctl reload nginx
```

---

## Option C — Cloudflare (if the domain is behind Cloudflare)

The easiest and most secure option — no server config needed.

1. Log in to your Cloudflare dashboard
2. Select the `nlc.com.sa` zone → **Zero Trust** → **Access** → **Applications**
3. Click **Add an application** → **Self-hosted**
4. Configure:
   - **Application name:** NLC Admin
   - **Session duration:** 8 hours
   - **Application domain:** `www.nlc.com.sa/admin.html`
5. Create a **policy**:
   - **Action:** Allow
   - **Include:** Emails → enter the admin email(s) — users get a one-time code by email, no password needed
6. Save. Done.

Anyone hitting `/admin.html` now gets Cloudflare's auth page; unauthorized users never see the file.

Cloudflare's free plan includes up to 50 users on Access — more than enough for NLC admins.

---

## Option D — Netlify

If deployed via Netlify, add to `netlify.toml`:

```toml
[[headers]]
  for = "/admin.html"
  [headers.values]
    Basic-Auth = "admin:NLC-Portal-2026!Zx9"
```

Or in the Netlify dashboard → **Site settings → Access control → Visitor access → Basic authentication**. Enter `admin:NLC-Portal-2026!Zx9`. Only applies on the "Production" context by default; configure per-branch if needed.

---

## Option E — Vercel

If deployed via Vercel, use middleware in `middleware.ts`:

```typescript
import { NextResponse, type NextRequest } from 'next/server';

export const config = { matcher: ['/admin.html'] };

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic') {
      const [user, pass] = atob(encoded).split(':');
      if (user === 'admin' && pass === 'NLC-Portal-2026!Zx9') return NextResponse.next();
    }
  }
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="NLC Admin"' }
  });
}
```

---

## Recommendation

If `www.nlc.com.sa` uses:
- **cPanel hosting** → Option A (`.htaccess`) — works immediately, no extra signup.
- **Cloudflare in front of your server** → Option C (Cloudflare Access) — **easiest and most secure**. Even if your server auth fails, Cloudflare blocks unauthorized requests before they reach the server.

If you don't know your hosting setup, log in to the registrar/hosting control panel — the landing screen usually shows either "cPanel", "Plesk", "Cloudflare", "Netlify" etc.
