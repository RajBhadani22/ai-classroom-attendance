# GitHub Setup Guide

How to push your AI Classroom Attendance system to GitHub and clone it on another machine.

---

## Part 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `ai-classroom-attendance`
   - **Description**: AI-powered classroom attendance using facial recognition
   - **Visibility**: Public or Private (your choice)
3. **Do NOT** initialize with README, .gitignore, or license (you already have these)
4. Click **Create repository**
5. Copy the repository URL shown (e.g. `https://github.com/yourusername/ai-classroom-attendance.git`)

---

## Part 2: Push Your Local Code

Open a terminal in the project root directory:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create the initial commit
git commit -m "Initial commit: AI classroom attendance system"

# Set the default branch name to main
git branch -M main

# Add the GitHub remote (replace URL with yours)
git remote add origin https://github.com/yourusername/ai-classroom-attendance.git

# Push to GitHub
git push -u origin main
```

Refresh your GitHub page — you should see all your files.

---

## Part 3: Verify on GitHub

Check that these files are present:
- [ ] `README.md` (renders on the repo homepage)
- [ ] `docker-compose.yml`
- [ ] `backend/` directory with `Dockerfile`, `requirements.txt`, `app/`
- [ ] `frontend/` directory with `Dockerfile`, `src/`
- [ ] `.gitignore` (no `node_modules` or `*.db` files uploaded)

---

## Part 4: Clone on Another Machine

On any machine with Docker Desktop and Git installed:

```bash
git clone https://github.com/yourusername/ai-classroom-attendance.git
cd ai-classroom-attendance
docker-compose up -d
```

That's it. The full system runs from a single command.

---

## Keeping Your Fork Updated

If you're working from a fork or want to pull the latest changes:

```bash
git pull origin main
docker-compose build   # rebuild images if dependencies changed
docker-compose up -d
```

---

## Making Changes and Pushing

```bash
# After editing files
git add .
git commit -m "Describe what you changed"
git push
```

---

## Working with Branches

```bash
# Create a feature branch
git checkout -b feature/add-export

# ... make changes ...

git add .
git commit -m "Add CSV export feature"
git push origin feature/add-export
```

Then open a Pull Request on GitHub to merge your branch into `main`.

---

## Environment Variables and Secrets

**Never commit `.env` files** — they are listed in `.gitignore`.

For collaborators, provide a `.env.example` file with placeholder values:

```bash
# .env.example
DATABASE_URL=sqlite:///./attendance.db
UPLOAD_DIR=/app/uploads
FACE_RECOGNITION_TOLERANCE=0.5
```

Collaborators copy and fill in their values:
```bash
cp .env.example .env
```
