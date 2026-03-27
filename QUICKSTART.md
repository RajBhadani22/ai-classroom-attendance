# Quick Start Guide

Get the AI Classroom Attendance system running in **5–10 minutes** using Docker.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | Any | https://git-scm.com/downloads |

Verify both are installed:
```bash
docker --version
git --version
```

---

## Steps

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ai-classroom-attendance
```

### 2. Start the stack

```bash
docker-compose up -d
```

Docker will build the images on first run (2–5 minutes). Subsequent starts are instant.

Watch the logs:
```bash
docker-compose logs -f
```

### 3. Seed sample data (optional)

Load example students and sessions so you can explore the UI right away:

```bash
docker-compose exec backend python seed.py
```

### 4. Open the app

| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Stopping the system

```bash
docker-compose down
```

To also remove all data (database + uploaded images):
```bash
docker-compose down -v
```

---

## Troubleshooting

### Port already in use

```bash
# Find what's using port 8000 or 3000
lsof -i :8000
lsof -i :3000
```

Edit `docker-compose.yml` to change the host port if needed (e.g. `"8080:8000"`).

### Backend not starting

```bash
docker-compose logs backend
```

Common cause: missing `requirements.txt` dependency. Rebuild:
```bash
docker-compose build backend
docker-compose up -d
```

### Frontend shows blank page

Wait 30 seconds after `docker-compose up -d` — the React dev server takes a moment to compile.

Check logs:
```bash
docker-compose logs frontend
```

### Face recognition is slow

Face recognition is CPU-intensive. The first upload may take 10–30 seconds. Subsequent ones are faster.

---

## Verify everything is working

Run the verification script:
```bash
bash verify-setup.sh
```

This checks all services and prints PASS/FAIL for each component.
