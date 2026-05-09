# AttendU — Smart Attendance System

A modern, automated attendance tracking solution built with **FastAPI** (Backend) and **React + Vite** (Frontend). This system leverages biometric/device integration, session management, and real-time analytics to streamline attendance recording for educational or corporate environments.

## 🚀 Features

- **User Authentication**: JWT-based authentication with refresh tokens and role-based access control (admin, instructor, device)
- **Session Management**: Create and manage attendance sessions for different courses and sections
- **Student Portal**: View enrollment, attendance history, and profile settings
- **Instructor Dashboard**: Real-time monitoring of active sessions, student participation, and course analytics
- **Attendance Check-in**: Support for multiple check-in methods (RFID, Face Recognition, Manual)
- **Device Integration**: Support for hardware device check-ins via dedicated API endpoints
- **Student Management**: Complete student enrollment and profile management
- **Course & Section Management**: Organize courses and student sections
- **Device Management**: Configure and manage attendance devices
- **Enrollment Management**: Manage student-course enrollments
- **Reporting & Exports**: Export attendance data to Excel/PDF formats
- **Real-time Updates**: WebSocket integration for live status updates during sessions
- **Responsive UI**: Mobile-first design with polished dashboard and data visualization

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Database**: PostgreSQL with SQLAlchemy ORM (async support via asyncpg)
- **Migrations**: Alembic
- **Authentication**: JWT (OAuth2) with Passlib (Argon2/Bcrypt)
- **Dependency Management**: `uv` or `pip`
- **Real-time**: WebSocket support

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: Modern CSS with modular components (mobile-first design)
- **Charts**: Recharts for attendance analytics
- **HTTP Client**: Axios
- **State Management**: Custom auth store with context API

---

## 📋 Prerequisites

- **Python**: 3.12 or higher
- **Node.js**: 20.x or higher
- **Database**: PostgreSQL instance
- **Docker**: (Optional) For containerized deployment

---

## 🔧 Installation & Setup

### 1. Backend Setup
Navigate to the root directory:
```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r src/requirements.txt
# Or using uv (recommended)
uv sync
```

**Environment Variables:**
Create a `.env` file in the root directory (referencing `docker/.env` for keys):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your_secret_key
# Add other relevant variables
```

**Run Migrations:**
```bash
cd src
python3 -m alembic upgrade head
```

**Start Server:**
```bash
# Option 1: Development with reload
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Option 2: Production
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend runs on port **5001** by default, with API requests proxied to `localhost:8000`.

---

## 🐳 Docker Deployment

You can run the entire stack using Docker Compose:
```bash
cd docker
docker-compose up --build
```

This will spin up:
- FastAPI backend (port 8000)
- React frontend (port 5001)
- PostgreSQL database (default managed by Replit or local instance)

---

## 📂 Project Structure

```
frontend/                    # React + Vite frontend
├── src/
│   ├── api/                # Axios HTTP client
│   ├── components/         # Shared UI components (WorkspaceShell, admin/*)
│   ├── features/           # Feature modules (auth, attendance, admin, courses, sections, etc.)
│   ├── pages/              # Route-level page components + per-page CSS
│   ├── routes/             # React Router configuration
│   ├── context/            # Theme & topbar context providers
│   ├── shared/             # Shared config, utilities, environment setup
│   ├── store/              # Auth state management
│   ├── styles/             # Global design system CSS
│   └── utils/              # Helper utilities (CSV export, etc.)
├── public/                 # Static assets
└── vite.config.ts

src/                         # FastAPI Python backend
├── main.py                 # FastAPI app entrypoint
├── routes/                 # API route handlers
├── controllers/            # Business logic
│   ├── crud/              # CRUD operations for each entity
│   └── base_controller.py
├── Models/                 # SQLAlchemy ORM models
│   ├── schemas/           # Pydantic schemas for API requests/responses
│   └── enums/             # Enum definitions
├── helpers/
│   ├── config.py          # Pydantic-settings config (reads DATABASE_URL)
│   ├── database.py        # SQLAlchemy engine + session setup
│   ├── dependencies.py    # FastAPI dependencies (auth, DB session, etc.)
│   ├── auth.py            # Authentication helpers
│   ├── exporters.py       # Export utilities (Excel, PDF)
│   └── ws_manager.py      # WebSocket connection management
├── services/              # Business services
│   └── face_recognition_service.py
├── media/                 # Media storage (faces, etc.)
├── alembic/              # Database migrations
└── requirements.txt

docker/                    # Docker configuration
├── docker-compose.yml
└── .env

```

---

## ⚙️ Key Configuration

### Frontend
- **Vite dev server**: Runs on `0.0.0.0:5001` with hot module replacement
- **API proxy**: `/api` requests → `http://localhost:8000`
- **API base URL**: Uses `/api/v1` (relative path, via Vite proxy)
- **Configuration file**: `frontend/src/shared/config/env.ts`

### Backend
- **Database connection**: Reads `DATABASE_URL` from environment
- **URL transformation**: Converts `postgresql://` → `postgresql+asyncpg://` for async support
- **Configuration file**: `src/helpers/config.py`
- **Server ports**: 
  - Development: `8000` (with `--reload`)
  - WebSocket support on same port

---

## 🎨 Design System

Pure CSS design system (no Tailwind or shadcn). Mobile-first responsive design.

### Colors
- **Primary**: `#4d9cff`
- **Secondary**: `#22d5eb`
- **Background (Dark)**: `#080c14`
- **Background (Light)**: `#f0f4fb`

### Typography
- **Fonts**: Outfit (primary), Space Grotesk (secondary)

### Responsive Breakpoints
- `≤1024px`: Mobile layout (sidebar hidden, hamburger menu, bottom nav)
- `≤900px`, `≤720px`, `≤640px`, `≤560px`, `≤480px`: Progressive refinements

### Key CSS Files
- `frontend/src/styles/design-system.css`: Design tokens, keyframes, utilities
- `frontend/src/styles/app-ui.css`: Shell layout, buttons, forms, mobile header/drawer/bottom-nav
- `frontend/src/pages/`: Per-page CSS (mobile-first, all components)
- `frontend/src/components/admin/`: Admin component styles

### Mobile Layout
- Sticky header with hamburger menu + brand + theme toggle
- Slide-out drawer overlay with backdrop blur
- Bottom tab bar (4-5 main nav items with safe-area inset)
- Body scroll lock when drawer is open

---

## ⚡ Loading Experience

### Global Loading States
- **TopProgressBar**: 3px gradient bar at top of viewport. Fires on route changes with two-phase animation (0→85% in 320ms, then complete)
- **RouteTransition**: Fade-up animation (220ms) on page navigation with reduced-motion support

### Skeleton Components
- **TableSkeleton**: Reusable animated table skeleton with compound avatar + staggered row entrance
- **MetricCardSkeleton**: Stat card skeleton matching MetricCard layout

### Per-page Loading
| Page | Stat Area | Content Area |
|------|-----------|--------------|
| Dashboard | 2 metric skeletons | 6 course card skeletons |
| History | 3 metric skeletons | Table skeleton (7 cols × 7 rows) |
| Students | — | Table skeleton (3 cols × 8 rows) |
| Course Dashboard | — | 4 metric card skeletons |
| Admin Pages | — | Built-in DataTable skeletons |

---

## 🗄️ Database

### Migrations
- Location: `src/alembic/versions/`
- Run migrations: `cd src && python3 -m alembic upgrade head`
- Create new migration: `cd src && alembic revision --autogenerate -m "description"`

### Connection
- Async support via asyncpg
- Connection pooling via SQLAlchemy
- Automatic connection lifecycle management

---

## 🔑 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (required) | `postgresql://user:pass@localhost:5432/dbname` |
| `SECRET_KEY` | JWT signing secret key (required) | Generate a secure random string for production |

---

## 📊 Test Credentials

**Admin Account:**
- Email: `admin@test.com`
- Password: `admin123`

**Instructor Account:**
- Email: `instructor@test.com`
- Password: `instr123`

---

## 🚀 Running the Application

### Development Mode (Both Services)

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5001
```

**Terminal 2 - Backend:**
```bash
cd src
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Runs on http://localhost:8000
```

### Production Deployment

See `docker/docker-compose.yml` for full stack deployment with PostgreSQL.

---

## 📄 License

This project is licensed under the terms provided in the [LICENSE](LICENSE) file.
