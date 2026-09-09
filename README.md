# Group Travel Savings — Full-Stack Upgrade

Your app now has a real database, a live-updating multi-device backend, and admin-PIN-protected editing. Here's what changed and how to get it live.

## What you're deploying

| Piece | Where | Why |
|---|---|---|
| Frontend (`frontend/index.html`) | **Netlify** (your existing site) | No change needed here — same static hosting |
| Backend (`backend/`) | **Render** (free web service) | Runs your Express API + Socket.IO |
| Database | **Neon** (free Postgres) | Render's free Postgres now expires after 30 days — Neon's free tier doesn't |

Total cost: **$0**. The only catch is Render's free web service sleeps after 15 minutes idle, so the first request after a quiet period takes ~30-60 seconds to wake up. Everything after that is instant, including the live Socket.IO updates.

---

## Step 1 — Create the database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (no card required).
2. Create a project. Copy the **connection string** it gives you (starts with `postgresql://...?sslmode=require`).
3. You'll paste this into Render in Step 2 as `DATABASE_URL`.

## Step 2 — Deploy the backend (Render)

1. Push this whole project to a GitHub repo (or just the `backend/` folder as its own repo — either works, just point Render at the right root directory).
2. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo.
3. Settings:
   - **Root directory:** `backend` (if it's a monorepo)
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Add environment variables (from `backend/.env.example`):
   - `DATABASE_URL` — your Neon connection string
   - `JWT_SECRET` — generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `ADMIN_PIN` — pick a PIN only you and trusted members know
   - `FRONTEND_URL` — `https://travel-mandala.netlify.app` (your live site, no trailing slash)
5. Deploy. Once it's live, note your backend URL, e.g. `https://travel-mandala-api.onrender.com`.
6. Run the one-time migration to create tables and seed your 5 existing members. In the Render dashboard → your service → **Shell**, run:
   ```
   npm run migrate
   ```
   (Or run it locally with the same `DATABASE_URL` in a local `.env` — see "Local development" below.)

## Step 3 — Point the frontend at your backend

Open `frontend/index.html`, find this near the top of the `<script>` block:

```js
const API_BASE = "https://your-backend-url.onrender.com/api";
const SOCKET_URL = "https://your-backend-url.onrender.com";
```

Replace both with your actual Render URL from Step 2, e.g.:

```js
const API_BASE = "https://travel-mandala-api.onrender.com/api";
const SOCKET_URL = "https://travel-mandala-api.onrender.com";
```

## Step 4 — Redeploy the frontend to Netlify

Drag the updated `frontend/index.html` into Netlify (or push to the connected Git repo, whichever you already use). That's it — the file is still a single static HTML file, same as before.

---

## Using it

- **Viewing** the savings tracker works for anyone with the link — no login needed.
- **Editing** (add/remove members, mark payments, change the month range) requires tapping **🔒 Login** and entering the `ADMIN_PIN` you set in Render. The session stays logged in on that device for 30 days.
- Changes made by one person **appear instantly** on everyone else's screen — that's the Socket.IO live sync. If the connection drops, a small banner tells you.

## What changed vs. your original app

- Data lives in PostgreSQL, not `localStorage` — it survives clearing your browser, works across devices, and multiple people can use it at once.
- Members are identified by a real database `id`, not their position in an array — so deleting someone in the middle no longer risks corrupting anyone else's payment history.
- The `PUT /api/payments` upsert with a `UNIQUE(member_id, payment_month)` constraint means two people tapping the same cell at the same moment can't create duplicate/conflicting rows.
- The backend validates everything server-side (name length, valid dates, etc.) — it never trusts the frontend, per the plan you shared.

## Local development

```bash
cd backend
cp .env.example .env      # fill in a local/dev DATABASE_URL, JWT_SECRET, ADMIN_PIN, FRONTEND_URL
npm install
npm run migrate           # creates tables + seeds the 5 original members
npm run dev                # nodemon, restarts on changes
```

Then open `frontend/index.html` directly in a browser (or serve it with any static server), with `API_BASE`/`SOCKET_URL` pointed at `http://localhost:3000`.

## Where I simplified vs. the original plan

The doc you shared proposed a layered `controllers/services/routes` structure. For a project this size I collapsed that into single route files per resource (`routes/members.routes.js` etc.) that talk to Postgres directly — same behavior, much less indirection to maintain. If this ever grows into something bigger (multiple trips, multiple groups, real user accounts), splitting services back out is a natural next step.

I also skipped `express-validator` in favor of small hand-written checks, since the validation rules here are simple (a name and a couple of dates) — worth swapping in if the form surface grows.

## Not done (tell me if you want these next)

- Editing an existing member's name/join-month from the UI (backend route `PUT /api/members/:id` already exists — just needs an "Edit" button wired up, same pattern as Add)
- Rate limiting on the login route (a determined attacker could brute-force a short PIN — fine for a friends-only tracker, worth adding if you're worried)
- A UI to change `monthly_amount` (backend supports it via `PUT /api/settings`, just no button yet)
