# AI Classroom Attendance System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.9%2B-blue)
![React](https://img.shields.io/badge/react-18%2B-61dafb)
![Docker](https://img.shields.io/badge/docker-ready-2496ED)

An AI-powered classroom attendance system using facial recognition. Students are enrolled once; the system automatically marks attendance by recognizing faces in uploaded class photos.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Enroll      │  │ Mark         │  │ Attendance    │  │
│  │  Student     │  │ Attendance   │  │ Dashboard     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  │
└─────────┼────────────────┼────────────────┼─────────────┘
          │  HTTP/REST      │                │
┌─────────▼────────────────▼────────────────▼─────────────┐
│                   FastAPI Backend (port 8000)             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  /students   │  │ /attendance  │  │ /sessions     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │
│         │                 │                               │
│  ┌──────▼─────────────────▼──────────────────────────┐   │
│  │         face_recognition + SQLite Database         │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
          │
    ┌─────▼──────┐
    │  uploads/  │  (face images stored here)
    └────────────┘
```

---

## Features

- 📸 **Face Enrollment** — Register students with one or more reference photos
- 🤖 **AI Recognition** — Automatically identify students in class photos
- 📊 **Attendance Dashboard** — View, filter, and export attendance records
- ✅ **Manual Review** — Correct AI errors before finalizing records
- 🗄️ **SQLite Storage** — Zero-config database, easy to back up
- 🐳 **Docker Ready** — One command to run the entire stack

---

## Quick Start (Docker)

> **Fastest path** — requires Docker Desktop only.

```bash
git clone <your-repo-url>
cd ai-classroom-attendance
docker-compose up -d
```

Seed sample data (optional):
```bash
docker-compose exec backend python seed.py
```

Open your browser:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

## Manual Setup

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (React)

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/students/` | Enroll a new student |
| `GET` | `/students/` | List all students |
| `POST` | `/attendance/upload` | Upload class photo & run recognition |
| `GET` | `/attendance/` | List attendance records |
| `PUT` | `/attendance/{id}` | Update attendance record (manual review) |
| `GET` | `/sessions/` | List class sessions |

Full interactive docs: http://localhost:8000/docs

---

## Screenshots

> _Add screenshots here after first run._

| Enroll Student | Mark Attendance | Dashboard |
|:--------------:|:---------------:|:---------:|
| _(screenshot)_ | _(screenshot)_  | _(screenshot)_ |

---

## Project Structure

```
ai-classroom-attendance/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app & routes
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── face_utils.py   # Face recognition helpers
│   ├── uploads/             # Stored face images
│   ├── requirements.txt
│   ├── seed.py              # Sample data seeder
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── components/     # React components
│   └── ...
├── docker-compose.yml
└── README.md
```

---

## Setup Guides

| Guide | Description |
|-------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Docker-based 5-minute setup |
| [GITHUB-SETUP.md](GITHUB-SETUP.md) | Push to GitHub & clone on another machine |
| [LOCAL-DEV.md](LOCAL-DEV.md) | Local development without Docker |
| [PRODUCTION.md](PRODUCTION.md) | Production deployment with Nginx + SSL |
| [PREFERENCES.md](PREFERENCES.md) | Decision guide: which path is right for you? |

Not sure where to start? Run:
```bash
bash setup-preferences.sh
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.
