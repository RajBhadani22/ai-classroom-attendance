# Local Development Setup

Run the backend and frontend without Docker for a faster development experience with hot reloading.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.9+ | `python3 --version` |
| pip | Latest | bundled with Python |
| Node.js | 16+ | `node --version` |
| npm | 8+ | `npm --version` |

Install system dependencies for face_recognition (Linux/Mac):
```bash
# macOS
brew install cmake

# Ubuntu/Debian
sudo apt-get install -y build-essential cmake libopenblas-dev liblapack-dev
```

---

## Backend Setup

### 1. Create and activate a virtual environment

```bash
cd backend
python3 -m venv venv
```

Activate:
```bash
# macOS / Linux
source venv/bin/activate

# Windows (Command Prompt)
venv\Scripts\activate.bat

# Windows (PowerShell)
venv\Scripts\Activate.ps1
```

Your prompt will show `(venv)` when active.

### 2. Install Python dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

> **Note:** Installing `dlib` (required by `face_recognition`) can take 5–10 minutes on the first install because it compiles from source.

### 3. Set environment variables

```bash
export DATABASE_URL=sqlite:///./attendance.db
export UPLOAD_DIR=./uploads
export FACE_RECOGNITION_TOLERANCE=0.5
```

On Windows (PowerShell):
```powershell
$env:DATABASE_URL = "sqlite:///./attendance.db"
$env:UPLOAD_DIR = "./uploads"
$env:FACE_RECOGNITION_TOLERANCE = "0.5"
```

### 4. Start the backend

```bash
uvicorn app.main:app --reload --port 8000
```

The `--reload` flag enables **hot reloading** — the server restarts automatically whenever you save a `.py` file.

Backend is available at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

---

## Frontend Setup

Open a **new terminal** (keep the backend running).

### 1. Install Node dependencies

```bash
cd frontend
npm install
```

### 2. Set environment variables

```bash
# macOS / Linux
export REACT_APP_API_URL=http://localhost:8000

# Windows (PowerShell)
$env:REACT_APP_API_URL = "http://localhost:8000"
```

Or create a `.env.local` file in `frontend/`:
```
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start the frontend

```bash
npm start
```

The browser opens automatically at http://localhost:3000.

React's **hot reloading** (Fast Refresh) updates the browser instantly when you save any `.js` or `.css` file — no manual refresh needed.

---

## How Hot Reloading Works

| Layer | Trigger | What happens |
|-------|---------|-------------|
| Backend (uvicorn) | Save any `.py` file | Server process restarts (~1 sec) |
| Frontend (React) | Save any `.js`/`.css` | Browser updates without full reload |

Changes to `requirements.txt` require `pip install -r requirements.txt` and a server restart.  
Changes to `package.json` require `npm install` and a frontend restart.

---

## Running Tests

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm test
```

---

## Deactivating the Virtual Environment

When done:
```bash
deactivate
```
