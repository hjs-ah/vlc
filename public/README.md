# Verity Learning Center

Ministry LMS for VOW Center — built with React + Vite + Supabase, deployed on Vercel.

## Stack
- **Frontend** — React 18 + Vite + React Router v6
- **Styling** — CSS Modules + global design tokens
- **Backend** — Supabase (Postgres 17, Auth, Storage)
- **Deployment** — Vercel

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Add environment variables
cp .env.example .env.local
# Fill in your Supabase URL and anon key

# 3. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

**Never commit `.env.local`** — it's in `.gitignore`.

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Vercel auto-detects Vite — no build config needed
4. Add environment variables in Vercel → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

The `vercel.json` file handles SPA routing so all routes resolve correctly.

---

## Project Structure

```
src/
├── lib/
│   ├── supabase.js          # Supabase client singleton
│   └── AuthContext.jsx      # Auth state + role management
├── components/
│   ├── ui/
│   │   ├── Button.jsx       # Reusable button component
│   │   └── Button.module.css
│   └── layout/
│       ├── Nav.jsx          # Public nav (constrained to 1200px)
│       ├── Sidebar.jsx      # Dashboard sidebar w/ role-gated nav
│       ├── DashboardLayout.jsx
│       └── ProtectedRoute.jsx
├── pages/
│   ├── HomePage.jsx         # Live data: site_settings, publications, pathway
│   ├── LoginPage.jsx        # Supabase email/password auth
│   ├── dashboard/
│   │   └── DashboardHome.jsx # Live: enrollments, assignments
│   └── admin/
│       └── AdminPage.jsx    # Full CRUD: settings, users, email list, pathway, publications
├── styles/
│   └── globals.css          # Design tokens + resets
└── App.jsx                  # Router + route protection
```

---

## Adding Users

Users are **invite-only**. To add someone:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mpswxsbczxmdvfjidbqq) → Authentication → Users → Invite user
2. After they accept, go to the `profiles` table and set their `role` to `student`, `instructor`, or `admin`

---

## Supabase Project

- **Project ID:** `mpswxsbczxmdvfjidbqq`
- **Region:** us-east-1
- **Dashboard:** https://supabase.com/dashboard/project/mpswxsbczxmdvfjidbqq
- **Notion docs:** https://www.notion.so/Verity-Learning-Center-36cfffd7c625805aa117e1001b04150a
