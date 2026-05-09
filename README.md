# Smart Attendance System

A modern, automated attendance tracking solution built with **FastAPI** (Backend) and **React + Vite** (Frontend). This system leverages biometric/device integration, session management, and real-time analytics to streamline attendance recording for educational or corporate environments.

## 🚀 Features

- **Session Management**: Create and manage attendance sessions for different courses and sections.
- **Student Portal**: View enrollment, attendance history, and profile settings.
- **Instructor Dashboard**: Real-time monitoring of active sessions, student participation, and course analytics.
- **Reporting**: Export attendance data to Excel/PDF formats for administrative use.
- **Biometric/Device Integration**: Support for hardware device check-ins via dedicated API endpoints.
- **Real-time Updates**: WebSocket integration for live status updates during sessions.
- **Responsive UI**: Polished dashboard built with React, TypeScript, and Recharts for data visualization.

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Authentication**: JWT (OAuth2) with Passlib (Argon2/Bcrypt)
- **Dependency Management**: `uv` or `pip`

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: Modern CSS with modular components
- **Charts**: Recharts for attendance analytics

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
alembic upgrade head
```

**Start Server:**
```bash
uvicorn src.main:app --reload --port 5000
```

### 2. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🐳 Docker Deployment

You can run the entire stack using Docker Compose:
```bash
cd docker
docker-compose up --build
```
This will spin up the FastAPI backend, React frontend, and a PostgreSQL database.

---

## 📂 Project Structure

- `src/`: Backend source code (Controllers, Models, Routes, Services).
- `frontend/`: React application (Pages, Components, Assets).
- `docker/`: Docker configuration and environment templates.
- `alembic/`: Database migration scripts.

---

## 📄 License

This project is licensed under the terms provided in the [LICENSE](LICENSE) file.
