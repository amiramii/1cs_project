# Deploy Chekin frontend on Render

Production backend (already deployed):

```text
https://checkin-backend-z1f2.onrender.com
```

The frontend reads the API from **one env var**: `NEXT_PUBLIC_API_URL`. All API calls go through `src/lib/apiBase.ts` → `getApiBaseUrl()`.

---

## 1. Push code to GitHub

Commit and push `1cs_project/frontend` (or the whole repo). Render deploys from Git.

---

## 2. Create the Web Service on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect your GitHub repo.
3. Configure:

| Setting | Value |
|--------|--------|
| **Name** | `checkin-frontend` (or any name) |
| **Region** | Same as backend (e.g. Frankfurt) |
| **Root Directory** | `1cs_project/frontend` if repo root is `1cs_front`; leave empty if repo root *is* `frontend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

4. **Environment variables** (required at build time for Next.js):

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://checkin-backend-z1f2.onrender.com` |
| `NODE_VERSION` | `20` |

5. Click **Create Web Service**. Wait for the first deploy (5–10 min).

Your frontend URL will look like:

```text
https://checkin-frontend-xxxx.onrender.com
```

---

## 3. Update backend CORS (required)

On your **backend** Render service, add or update:

| Key | Value |
|-----|--------|
| `FRONTEND_URL` | `https://checkin-frontend-xxxx.onrender.com` (your exact frontend URL, no trailing slash) |

Redeploy the backend after saving. Django adds `FRONTEND_URL` to `CORS_ALLOWED_ORIGINS` in `settings.py`.

Without this step, the browser will block login and API requests (CORS error).

---

## 4. Verify

1. Open the frontend URL in a browser.
2. Try **Login** on the landing page.
3. If it fails, open DevTools → **Network** and check:
   - Requests go to `https://checkin-backend-z1f2.onrender.com/api/...`
   - No CORS errors in the console.

---

## 5. Chekin mobile APK (optional)

After the frontend is live, point the Flutter WebView at the deployed site:

`chekin-mobile/checkin/build_apk.env`:

```env
WEB_BASE_URL=https://checkin-frontend-xxxx.onrender.com
```

Rebuild the APK. The baked-in Next.js app already uses `NEXT_PUBLIC_API_URL` from the **frontend build** on Render (not from the phone).

---

## Local development

`.env.local`:

```env
NEXT_PUBLIC_API_URL=https://checkin-backend-z1f2.onrender.com
```

Restart `npm run dev` after changing env vars.

For local Django instead:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## Blueprint (optional)

This folder includes `render.yaml`. In Render: **New** → **Blueprint** → select the repo and apply, or adjust paths if your repo layout differs.

---

## Free tier notes

- Render free services **spin down** after inactivity; first load can take ~30s.
- Backend cold start on Render adds extra delay on first API call.
