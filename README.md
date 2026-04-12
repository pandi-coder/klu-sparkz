# 🎬 KLU Sparkz — EventFlow Pro
### Full-Stack College Event Management Platform

> React 18 · Node.js · Supabase · Hosted on Vercel + Render

---

## 🗂 Project Structure

```
klu-sparkz/
├── supabase/
│   └── schema.sql               ← Run this first in Supabase SQL Editor
├── backend/                     ← Node.js + Express REST API
│   ├── src/
│   │   ├── index.js             ← Express server
│   │   ├── config/supabase.js
│   │   ├── middleware/auth.js   ← JWT + role guards
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── events.js
│   │       ├── registrations.js
│   │       ├── users.js
│   │       ├── notifications.js
│   │       ├── schools.js
│   │       └── leaderboard.js
│   ├── package.json
│   └── .env.example
├── frontend/                    ← React 18 + Vite SPA
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  ← Login/logout/register state
│   │   │   └── AppContext.jsx   ← Toast, sidebar, confetti
│   │   ├── lib/
│   │   │   ├── api.js           ← Axios client + all API helpers
│   │   │   └── supabase.js      ← Supabase client (frontend)
│   │   ├── components/
│   │   │   ├── Layout/          ← Sidebar, Topbar, MainLayout
│   │   │   ├── common/          ← Toast, Modal, Spinner, Confetti
│   │   │   └── Events/          ← EventDetailModal, CreateEventModal
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx     ← Login + Register
│   │   │   ├── Dashboard.jsx    ← Stats, charts, upcoming events
│   │   │   ├── EventsPage.jsx   ← Browse + filter + register
│   │   │   ├── MyEventsPage.jsx ← My registrations table
│   │   │   ├── LeaderboardPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── AdminPage.jsx    ← Approvals, event mgmt, schools
│   │   └── styles/globals.css
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── render.yaml                  ← Render deployment config
└── .gitignore
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- A free Supabase account
- Git

---

### Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region (Singapore for India)
3. Open **SQL Editor** → paste contents of `supabase/schema.sql` → **Run**
4. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon / public` key
   - `service_role` key (keep this secret!)

---

### Step 2 — Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=any-long-random-string-min-32-chars
FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

```bash
npm install
npm run dev
# → API running at http://localhost:5000
# → Health: http://localhost:5000/health
```

---

### Step 3 — Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000
```

```bash
npm install
npm run dev
# → App running at http://localhost:5173
```

---

## 🚀 Production Deployment

### Backend → Render.com (Free Tier)

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Set these settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Region:** Singapore
5. Add Environment Variables in the Render dashboard:
   ```
   SUPABASE_URL=...
   SUPABASE_SERVICE_KEY=...
   JWT_SECRET=...
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=10000
   ```
6. Deploy → copy your Render URL (e.g. `https://klu-sparkz-api.onrender.com`)

---

### Frontend → Vercel (Free Tier)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add Environment Variables:
   ```
   VITE_API_URL=https://klu-sparkz-api.onrender.com
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. **Deploy** → your app is live! 🎉

---

## 🗃 Database Schema

| Table           | Purpose                              |
|-----------------|--------------------------------------|
| `users`         | Students and admins                  |
| `schools`       | University schools/faculties         |
| `departments`   | Departments under each school        |
| `events`        | All events with metadata             |
| `registrations` | Student ↔ Event registration records |
| `notifications` | Per-user notification feed           |
| `leaderboard`   | Points and rankings after events     |

---

## 🔐 Authentication Flow

```
User registers/logs in
    ↓
Supabase Auth validates credentials
    ↓
Backend issues JWT (7-day expiry)
    ↓
Frontend stores JWT in localStorage
    ↓
Every API call: Authorization: Bearer <token>
    ↓
Backend middleware verifies JWT + fetches user from DB
```

---

## 👥 Roles

| Role         | Can do                                              |
|--------------|-----------------------------------------------------|
| `Student`    | Browse events, register, view own profile/history   |
| `Admin`      | Create/delete events, mark attendance, view all regs, manage schools |
| `SuperAdmin` | All of the above + approve/reject admin registrations |

> **Admin registration requires SuperAdmin approval** before login is allowed.

---

## 📡 API Endpoints

| Method | Path                               | Auth     | Description              |
|--------|------------------------------------|----------|--------------------------|
| POST   | `/api/auth/register`               | Public   | Register new user        |
| POST   | `/api/auth/login`                  | Public   | Login, receive JWT       |
| GET    | `/api/auth/me`                     | User     | Get current user         |
| GET    | `/api/events`                      | Public   | List events (filterable) |
| POST   | `/api/events`                      | Admin    | Create event             |
| DELETE | `/api/events/:id`                  | Admin    | Soft delete event        |
| POST   | `/api/registrations`               | User     | Register for event       |
| GET    | `/api/registrations/my`            | User     | My registrations         |
| GET    | `/api/registrations/all`           | Admin    | All registrations        |
| GET    | `/api/users/pending-admins`        | Admin    | Pending admin list       |
| PATCH  | `/api/users/:id/approve`           | Admin    | Approve admin            |
| GET    | `/api/notifications`               | User     | My notifications         |
| GET    | `/api/schools`                     | Public   | Schools + departments    |
| GET    | `/api/leaderboard`                 | Public   | Rankings                 |

---

## 🛠 Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18, React Router 6, TanStack Query v5 |
| Styling     | Pure CSS (custom design system, no framework) |
| Backend     | Node.js, Express 4                |
| Database    | Supabase (PostgreSQL)             |
| Auth        | Supabase Auth + JWT               |
| Charts      | Chart.js + react-chartjs-2        |
| Hosting     | Vercel (frontend) + Render (backend) |
| State       | React Context + TanStack Query    |

---

## 🧑‍💻 Development Tips

- **Hot reload** works on both frontend (Vite) and backend (nodemon)
- **React Query DevTools** — add `@tanstack/react-query-devtools` for debugging
- **Supabase Dashboard** — monitor DB, auth users, and RLS policies live
- **Test with Postman** — import the Render URL base and attach your JWT

---

## 📝 License

MIT — built for KLU Sparkz 2K26 🎬
