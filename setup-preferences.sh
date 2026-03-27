#!/bin/bash
# setup-preferences.sh — Interactive setup guide for AI Classroom Attendance

set -euo pipefail

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Helpers ──────────────────────────────────────────────────────────────────

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${RESET}"
    echo -e "${CYAN}${BOLD}   AI Classroom Attendance — Setup Wizard          ${RESET}"
    echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${RESET}"
    echo ""
}

check_tool() {
    local name="$1"
    local cmd="$2"
    if command -v "$cmd" &>/dev/null; then
        echo -e "  ${GREEN}✔${RESET}  $name"
        return 0
    else
        echo -e "  ${RED}✘${RESET}  $name ${RED}(not found)${RESET}"
        return 1
    fi
}

section() {
    echo ""
    echo -e "${YELLOW}${BOLD}▶ $1${RESET}"
    echo ""
}

step() {
    echo -e "  ${CYAN}$1.${RESET} $2"
}

code() {
    echo -e "     ${BOLD}$1${RESET}"
}

pause() {
    echo ""
    echo -e "${YELLOW}Press Enter to continue...${RESET}"
    read -r
}

# ── Prerequisite checks ───────────────────────────────────────────────────────

check_prerequisites() {
    local has_docker=false has_git=false has_python=false has_node=false

    echo -e "${BOLD}Checking installed tools:${RESET}"
    check_tool "Docker"  "docker"  && has_docker=true
    check_tool "Git"     "git"     && has_git=true
    check_tool "Python3" "python3" && has_python=true
    check_tool "Node.js" "node"    && has_node=true

    echo ""
    echo "$has_docker $has_git $has_python $has_node"
}

# ── Option guides ─────────────────────────────────────────────────────────────

guide_quickstart() {
    section "Option A — Quick Start (Docker)"
    echo -e "  Get running in ${GREEN}5–10 minutes${RESET} with Docker."
    echo ""

    step 1 "Ensure Docker Desktop is running:"
    code "docker info"

    step 2 "Clone the repository (if you haven't already):"
    code "git clone <your-repo-url>"
    code "cd ai-classroom-attendance"

    step 3 "Start all services:"
    code "docker-compose up -d"

    step 4 "Watch startup logs (wait for 'Application startup complete'):"
    code "docker-compose logs -f"

    step 5 "Seed sample data (optional):"
    code "docker-compose exec backend python seed.py"

    step 6 "Open in browser:"
    code "Frontend → http://localhost:3000"
    code "API Docs → http://localhost:8000/docs"

    echo ""
    echo -e "  ${YELLOW}Tip:${RESET} Run ${BOLD}bash verify-setup.sh${RESET} to confirm everything is healthy."
}

guide_github() {
    section "Option B — GitHub Setup"
    echo -e "  Push your code to GitHub and clone it on any machine."
    echo ""

    step 1 "Create a new repository at https://github.com/new"
    echo "     (Do NOT initialize with README or .gitignore)"

    step 2 "Initialize local git and push:"
    code "git init"
    code "git add ."
    code 'git commit -m "Initial commit"'
    code "git branch -M main"
    code "git remote add origin https://github.com/YOU/REPO.git"
    code "git push -u origin main"

    step 3 "Clone on another machine:"
    code "git clone https://github.com/YOU/REPO.git"
    code "cd ai-classroom-attendance"
    code "docker-compose up -d"

    echo ""
    echo -e "  ${YELLOW}Guide:${RESET} See ${BOLD}GITHUB-SETUP.md${RESET} for full instructions."
}

guide_localdev() {
    section "Option C — Local Development"
    echo -e "  Edit code with instant hot reloading. Needs Python 3.9+ and Node 16+."
    echo ""

    step 1 "Set up Python virtual environment:"
    code "cd backend"
    code "python3 -m venv venv"
    code "source venv/bin/activate   # Windows: venv\\Scripts\\activate"
    code "pip install -r requirements.txt"

    step 2 "Start the backend (in one terminal):"
    code "uvicorn app.main:app --reload --port 8000"

    step 3 "Set up and start the frontend (in another terminal):"
    code "cd frontend"
    code "npm install"
    code "REACT_APP_API_URL=http://localhost:8000 npm start"

    step 4 "Access the app:"
    code "Frontend → http://localhost:3000"
    code "API Docs → http://localhost:8000/docs"

    echo ""
    echo -e "  ${YELLOW}Guide:${RESET} See ${BOLD}LOCAL-DEV.md${RESET} for full instructions including Windows setup."
}

guide_production() {
    section "Option D — Production Deployment"
    echo -e "  Full deployment with Nginx, SSL, and automated backups."
    echo ""

    step 1 "Build production images:"
    code "docker-compose build"

    step 2 "Create .env file on server with production values:"
    code "cp .env.example .env && nano .env"

    step 3 "Install and configure Nginx + Certbot:"
    code "sudo apt-get install nginx certbot python3-certbot-nginx"
    code "sudo certbot --nginx -d attendance.yourdomain.com"

    step 4 "Copy Nginx config from PRODUCTION.md and reload:"
    code "sudo nginx -t && sudo systemctl reload nginx"

    step 5 "Start containers:"
    code "docker-compose up -d"

    step 6 "Set up cron backup (see PRODUCTION.md)."

    echo ""
    echo -e "  ${YELLOW}Guide:${RESET} See ${BOLD}PRODUCTION.md${RESET} for the full Nginx config and backup script."
}

recommend() {
    local has_docker="$1" has_git="$2" has_python="$3" has_node="$4"
    echo ""
    echo -e "${BOLD}Recommendation based on your installed tools:${RESET}"
    if [[ "$has_docker" == "true" && "$has_git" == "true" ]]; then
        echo -e "  ${GREEN}→ Option A (Quick Start) or B (GitHub Setup)${RESET} — you have everything needed."
    elif [[ "$has_python" == "true" && "$has_node" == "true" ]]; then
        echo -e "  ${GREEN}→ Option C (Local Dev)${RESET} — Docker not found, but Python + Node are available."
    else
        echo -e "  ${YELLOW}→ Install Docker Desktop first:${RESET} https://www.docker.com/products/docker-desktop"
    fi
}

# ── Main menu ─────────────────────────────────────────────────────────────────

main() {
    print_header

    # Check tools and capture output
    local prereq_line
    prereq_line=$(check_prerequisites | tail -1)
    read -r has_docker has_git has_python has_node <<< "$prereq_line"

    recommend "$has_docker" "$has_git" "$has_python" "$has_node"

    echo ""
    echo -e "${BOLD}Choose a setup option:${RESET}"
    echo ""
    echo "  A)  Quick Start     — Docker only, 5–10 min"
    echo "  B)  GitHub Setup    — Push to GitHub + Docker, 10–15 min"
    echo "  C)  Local Dev       — Python + Node.js, 20–30 min"
    echo "  D)  Production      — Nginx + SSL + backups, 1–2 hours"
    echo "  Q)  Quit"
    echo ""
    echo -n "Enter choice [A/B/C/D/Q]: "
    read -r choice

    case "${choice^^}" in
        A) guide_quickstart ;;
        B) guide_github ;;
        C) guide_localdev ;;
        D) guide_production ;;
        Q) echo -e "\n${CYAN}Goodbye!${RESET}\n"; exit 0 ;;
        *)
            echo -e "\n${RED}Invalid choice. Please run the script again and enter A, B, C, D, or Q.${RESET}\n"
            exit 1
            ;;
    esac

    echo ""
    echo -e "${GREEN}${BOLD}Done! Good luck with your setup.${RESET}"
    echo ""
}

main
