# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ICU Risk Intelligence System — a full-stack web application for monitoring ICU patients and predicting deterioration risk. The backend is a Flask REST API backed by MySQL; the frontend is a React + Vite SPA with role-based dashboards.

## Development Commands

### Backend (Flask)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the dev server (auto-seeds DB on first run)
python app.py
# Runs on http://localhost:5000

# Use SQLite for testing (no MySQL needed)
FLASK_ENV=testing python app.py
```

The database is **auto-created and seeded** when `app.py` starts if the `users` table is empty. Re-seeding requires clearing the DB manually.

### Frontend (Vite + React)

```bash
cd frontend

npm install
npm run dev       # http://localhost:5173
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview production build
```

The Vite dev proxy is **not configured** — the frontend's `api.js` uses `baseURL: '/api'`, so either configure a Vite proxy or run both servers and point the browser at the backend directly during development.

## Architecture

### Backend (`/backend`)

Layered Flask app following **Routes → Controllers → Services → Models** separation:

| Layer | Dir | Responsibility |
|---|---|---|
| Routes | `routes/` | URL binding + auth decorators |
| Controllers | `controllers/` | Request parsing, response shaping |
| Services | `services/` | Business logic, DB writes |
| Models | `models/` | SQLAlchemy ORM definitions |

**Blueprints and their URL prefixes:**
- `auth_bp` → `/api/auth` (public — no JWT)
- `patient_bp` → `/api/patient`
- `prediction_bp` → `/api` (`/api/predict`, `/api/predictions`)
- `alert_bp` → `/api/alerts`
- `dashboard_bp` → `/api/dashboard`
- `analytics_bp` → `/api/analytics`

**Auth flow:** JWT issued on login, stored in `Authorization: Bearer <token>` header. Two middleware decorators in `middleware/auth.py`:
- `@jwt_required_custom` — any authenticated user
- `@role_required('doctor', 'nurse', ...)` — role allowlist; injects `current_user` into view kwargs

**User roles:** `doctor`, `nurse`, `admin`. Role controls both route access and dashboard routing on the frontend.

**Risk prediction** (`services/prediction_service.py`) is a rule-based scorer (not a trained ML model despite `scikit-learn` in requirements). It sums weighted penalty scores for out-of-range vitals and classifies as `LOW RISK` (≤0.39), `MEDIUM RISK` (≤0.69), or `HIGH RISK` (>0.69). Predictions with score ≥ 0.75 auto-create a critical `Alert`.

**Database:** MySQL in dev/prod (`mysql+pymysql://`); SQLite in-memory for `TestingConfig`. `DATABASE_URL` env var overrides the default connection string.

**Seeded demo credentials** (created automatically on first run):
| Role | Email | Password |
|---|---|---|
| Doctor | `doctor@icu.com` | `doctor123` |
| Nurse | `nurse@icu.com` | `nurse123` |
| Admin | `admin@icu.com` | `admin123` |

### Frontend (`/frontend/src`)

React 19 SPA using React Router v7. Entry: `App.jsx` → `AuthProvider` wraps all routes.

**Auth state** is managed in `AuthContext.jsx` and persisted to `localStorage` (`token` + `user` keys). The `ProtectedRoute` component gates routes by role; unauthenticated users are redirected to `/login`.

**Route → Dashboard mapping:**
- `/doctor/dashboard` — doctors only
- `/nurse/dashboard` — nurses only
- `/admin/dashboard` — admins only
- `/history`, `/alerts` — any authenticated role

**API calls** all go through `services/api.js` (an Axios instance). The request interceptor attaches `Bearer <token>` automatically. The response interceptor catches 401s and redirects to `/login`.

**Layouts:**
- `AuthLayout` — wraps login page
- `DashboardLayout` — wraps all protected pages (includes `Sidebar` + `Header`)

## Configuration

Backend is configured via environment variables (loaded from `.env` by `python-dotenv`):

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `mysql+pymysql://root:password@localhost:3306/icu_risk_db` | Full SQLAlchemy URI |
| `SECRET_KEY` | `icu-risk-default-secret-key-CHANGE-ME` | Flask secret |
| `JWT_SECRET_KEY` | `jwt-icu-risk-secret-CHANGE-ME` | JWT signing key |
| `JWT_ACCESS_TOKEN_EXPIRES` | `3600` | Seconds |
| `FLASK_ENV` | `development` | `development` / `production` / `testing` |
