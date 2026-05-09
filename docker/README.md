# Docker Setup for Smart Attendance System

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)

## Quick Start

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your desired configuration

3. Start the PostgreSQL database:
   ```bash
   docker-compose up -d
   ```

4. Check if containers are running:
   ```bash
   docker-compose ps
   ```

## Services

### PostgreSQL Database
- **Port**: 5432 (configurable via DB_PORT)
- **User**: attendance_user (configurable via DB_USER)
- **Password**: attendance_pass (configurable via DB_PASSWORD)
- **Database**: smart_attendance (configurable via DB_NAME)

### PgAdmin (Database Management UI)
- **URL**: http://localhost:5050
- **Email**: admin@attendance.com (configurable via PGADMIN_EMAIL)
- **Password**: admin (configurable via PGADMIN_PASSWORD)

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f postgres
```

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U attendance_user -d smart_attendance
```

### Reset database (WARNING: Deletes all data)
```bash
docker-compose down -v
docker-compose up -d
```

### Backup database
```bash
docker-compose exec postgres pg_dump -U attendance_user smart_attendance > backup.sql
```

### Restore database
```bash
cat backup.sql | docker-compose exec -T postgres psql -U attendance_user smart_attendance
```

## Connecting from your application

Use the following connection string format:
```
postgresql+asyncpg://attendance_user:attendance_pass@localhost:5432/smart_attendance
```

Or connect using individual parameters:
- Host: `localhost`
- Port: `5432`
- User: `attendance_user`
- Password: `attendance_pass`
- Database: `smart_attendance`

## Initialization Scripts

SQL scripts in `docker/postgres/init/` are automatically executed when the database is first created.
Add your custom initialization scripts there with numbered prefixes (e.g., `02_custom.sql`).
