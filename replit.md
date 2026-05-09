# Attendu — Smart Attendance System

## Architecture

- **Frontend**: React 19 + TypeScript + Vite, running on port 5001
- **Backend**: FastAPI (Python 3.12), running on port 8000
- **Database**: PostgreSQL (Replit managed), accessed via SQLAlchemy async + asyncpg
- **Migrations**: Alembic (located in `src/alembic/`)

## Project Structure

```
frontend/         # React + Vite frontend
  src/
    api/          # axios HTTP client
    components/   # shared UI components (WorkspaceShell, admin/*)
    features/     # feature modules (auth, attendance, admin, etc.)
    pages/        # route-level page components + per-page CSS
    routes/       # React Router route configuration
    shared/       # shared config, utils
    store/        # auth store
    styles/       # global design system CSS

src/              # FastAPI Python backend
  main.py         # FastAPI app entrypoint
  routes/         # API route handlers
  controllers/    # business logic
  Models/         # SQLAlchemy ORM models
  helpers/
    config.py     # pydantic-settings config (reads DATABASE_URL env)
    database.py   # SQLAlchemy engine + session setup
    dependencies.py # FastAPI dependencies (auth, etc.)
  alembic/        # database migrations
```

## Key Configuration

- `frontend/vite.config.ts`: Vite dev server on 0.0.0.0:5001, proxies `/api` → `localhost:8000`
- `frontend/src/shared/config/env.ts`: API base URL uses `/api/v1` (relative, via Vite proxy)
- `src/helpers/config.py`: Reads `DATABASE_URL` from environment, converts `postgresql://` to `postgresql+asyncpg://` and strips `sslmode` param

## Workflows

- **Start application** (webview, port 5001): `cd frontend && npm run dev`
- **Backend API** (console, port 8000): `cd src && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

## Database

- Replit managed PostgreSQL; connection string read from `DATABASE_URL` secret
- Run migrations: `cd src && python3 -m alembic upgrade head`
- All migrations are in `src/alembic/versions/`

## Environment Variables

- `DATABASE_URL` — set by Replit (Replit managed PostgreSQL)
- `SECRET_KEY` — JWT secret key (defaults to a placeholder; set a real value for production)

## Design System (Mobile-First Redesign — COMPLETE)

Pure CSS design system (no Tailwind / shadcn). Fonts: Outfit + Space Grotesk.

### Colors
- Primary: `#4d9cff`, Secondary: `#22d5eb`
- BG dark: `#080c14`, BG light: `#f0f4fb`

### Key CSS Files
- `frontend/src/styles/design-system.css` — tokens, keyframes, utilities (fully rewritten)
- `frontend/src/styles/app-ui.css` — shell layout, buttons, forms, badges, mobile header/drawer/bottom-nav (fully rewritten)
- `frontend/src/components/ui/WorkspaceShell.tsx` — mobile menu state, hamburger, slide-out drawer, body scroll lock (fully rewritten)

### Per-page CSS (all mobile-first, complete)
- `frontend/src/pages/DashboardPage.css` — course card grid, staggered entrance, hover micro-interactions
- `frontend/src/pages/HistoryPage.css` — filter grid, responsive table shell, status badges
- `frontend/src/pages/StudentsPage.css` — filter tabs, sortable table, avatar, progress bars, standing badges
- `frontend/src/pages/SessionPage.css` — sidebar/main two-column, status bar, mode toggle, live pulse dot
- `frontend/src/pages/SettingsPage.css` — theme selector cards, account card, session row, danger button
- `frontend/src/pages/CourseDashboardPage.css` — chart grid, responsive stacking

### Admin component CSS (all mobile-first, complete)
- `frontend/src/pages/admin/AdminPages.css` — form grid, enrollment layout, status pills
- `frontend/src/components/admin/DataTable.css` — table shell, skeleton, action buttons, touch targets
- `frontend/src/components/admin/Modal.css` — centered modal on desktop, bottom-sheet on mobile ≤640px
- `frontend/src/components/admin/EmptyState.css` — centered empty state with CTA button
- `frontend/src/components/admin/AdminShell.css` — delegates to app-ui.css shell styles

### Mobile Layout (≤1024px)
- Sidebar hidden; mobile sticky header (hamburger + brand + theme toggle) shown
- Slide-out drawer overlay (translateX, visibility toggle) with backdrop blur
- Bottom tab bar (4-5 main nav items, safe-area inset) replaces sidebar nav
- Body scroll lock when drawer is open

### Breakpoints
- `≤1024px` — mobile layout
- `≤900px` / `≤720px` / `≤640px` / `≤560px` / `≤480px` — progressive refinements

## Loading Experience (COMPLETE)

### Global

- **`TopProgressBar`** (`components/ui/TopProgressBar.tsx` + `.css`) — 3px gradient bar fixed at top of viewport (z-index 9999). Fires on every route change via `useLocation`. Two-phase animation: 0→85% in 320ms (ease-out-expo), then 100% + fade-out. Added to `main.tsx` inside `BrowserRouter`.
- **`RouteTransition`** (`components/ui/RouteTransition.tsx` + `.css`) — wraps `<Outlet />` in `AppLayout`, keyed by `location.key`. Each navigation triggers a `fade-up` re-mount animation (220ms, ease-out-circ). Respects `prefers-reduced-motion`.

### Skeleton Components

- **`TableSkeleton`** (`components/ui/TableSkeleton.tsx` + `.css`) — reusable animated table skeleton. Props: `columns`, `rows`, `hasActions`. First column renders compound avatar + two-line layout. Each row fades in with a staggered delay. Used in HistoryPage (7 cols) and StudentsPage (3 cols).
- **`MetricCardSkeleton`** (`components/ui/MetricCardSkeleton.tsx` + `.css`) — stat card skeleton matching the `MetricCard` layout (icon box + label shimmer + value shimmer). Used in DashboardPage and HistoryPage while data loads.

### Per-page Loading

| Page | Stat Area (loading) | Content Area (loading) |
|------|--------------------|-----------------------|
| DashboardPage | `MetricCardSkeleton count=2` | 6 course card skeletons (existing) |
| HistoryPage | `MetricCardSkeleton count=3` | `TableSkeleton columns=7 rows=7` |
| StudentsPage | — | `TableSkeleton columns=3 rows=8` |
| CourseDashboardPage | — | 4 metric card skeletons (existing) |
| Admin pages | — | Built-in `admin-skeleton-line` in `DataTable` |

### Animation Timings

- Progress bar: 320ms phase-1 (ease-out-expo), 120ms phase-2 complete
- Route transition: 220ms fade-up (ease-out-circ)
- Skeleton shimmer: 1.5s linear infinite
- MetricCard/TableSkeleton row entrance: 300ms staggered fade-up

## Features

- User authentication (JWT with refresh tokens)
- Student management
- Course and section management
- Attendance sessions and check-in (RFID / Face / Manual methods)
- Device management
- Enrollment management
- Reports and exports (Excel, PDF)
- WebSocket real-time updates
- Role-based access control (admin, instructor, device roles)

## Test Credentials

- Admin: `admin@test.com` / `admin123`
- Instructor: `instructor@test.com` / `instr123`
