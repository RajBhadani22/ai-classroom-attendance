# Setup Preferences — Which Path Is Right for You?

Choose the setup option that best matches your goals, skills, and time available.

---

## The 4 Options at a Glance

| Option | Time | Skills Needed | Best For |
|--------|------|--------------|---------|
| **A. Quick Start** | 5–10 min | Docker Desktop | Trying it out, demos |
| **B. GitHub Setup** | 10–15 min | Git + Docker | Sharing with others, team use |
| **C. Local Dev** | 20–30 min | Python + Node.js | Customizing the code |
| **D. Production** | 1–2 hours | Linux sysadmin | Real classroom deployment |

---

## Decision Tree

```
Do you just want to SEE it running?
  └─ YES → Option A: Quick Start (docker-compose up -d)

Do you want to share it or use it on multiple machines?
  └─ YES → Option B: GitHub Setup (push to GitHub, clone anywhere)

Do you want to modify the source code?
  └─ YES → Option C: Local Dev (Python venv + npm start)

Are you deploying for real students in a real classroom?
  └─ YES → Option D: Production (Nginx + SSL + backups)
```

---

## Option A — Quick Start

**Guide:** [QUICKSTART.md](QUICKSTART.md)  
**Time:** 5–10 minutes  
**Prerequisites:** Docker Desktop, Git

```bash
git clone <repo-url>
cd ai-classroom-attendance
docker-compose up -d
```

✅ No Python or Node.js setup required  
✅ Everything runs inside containers  
⚠️ Not for code editing (changes require rebuilding the image)

---

## Option B — GitHub Setup

**Guide:** [GITHUB-SETUP.md](GITHUB-SETUP.md)  
**Time:** 10–15 minutes  
**Prerequisites:** GitHub account, Docker Desktop, Git

Steps:
1. Create a GitHub repo
2. Push your local code
3. Clone on any machine → `docker-compose up -d`

✅ Easy to share and collaborate  
✅ Version controlled  
✅ Deploy anywhere with Docker  
⚠️ Requires a GitHub account

---

## Option C — Local Development

**Guide:** [LOCAL-DEV.md](LOCAL-DEV.md)  
**Time:** 20–30 minutes  
**Prerequisites:** Python 3.9+, Node.js 16+, build tools (cmake)

```bash
# Terminal 1
cd backend && source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm start
```

✅ Hot reloading — instant feedback as you edit  
✅ Full debugger access  
✅ No Docker required  
⚠️ dlib/face_recognition can be tricky to install on Windows

---

## Option D — Production

**Guide:** [PRODUCTION.md](PRODUCTION.md)  
**Time:** 1–2 hours  
**Prerequisites:** Linux server, domain name, Docker, Nginx, Certbot

✅ HTTPS / SSL encryption  
✅ Nginx load balancing & large file uploads  
✅ Automated backups  
✅ Starts automatically on server reboot  
⚠️ Requires a server and domain name  
⚠️ Most complex setup

---

## Interactive Setup Script

Not sure? Let the script guide you:

```bash
bash setup-preferences.sh
```

The script checks your installed tools and recommends the best option for your machine.

---

## Common Questions

**Can I switch between options?**  
Yes. Docker Quick Start and Local Dev can coexist — just use different terminal windows.

**Will I lose data when switching?**  
The SQLite database (`attendance.db`) and `uploads/` folder persist on your local machine regardless of which option you use, as long as you don't run `docker-compose down -v`.

**Which option do most developers use?**  
Option C (Local Dev) for day-to-day development, Option B (GitHub) for collaboration, Option D (Production) for classroom deployment.
