#!/bin/bash
# verify-setup.sh — Verify all components of the AI Classroom Attendance system

set -uo pipefail

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

PASS=0
FAIL=0

# ── Helpers ───────────────────────────────────────────────────────────────────

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${RESET}"
    echo -e "${CYAN}${BOLD}   AI Classroom Attendance — Verify Setup          ${RESET}"
    echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${RESET}"
    echo ""
}

pass() {
    echo -e "  ${GREEN}[PASS]${RESET}  $1"
    PASS=$((PASS + 1))
}

fail() {
    echo -e "  ${RED}[FAIL]${RESET}  $1"
    if [[ -n "${2:-}" ]]; then
        echo -e "         ${YELLOW}Hint: $2${RESET}"
    fi
    FAIL=$((FAIL + 1))
}

info() {
    echo -e "  ${CYAN}[INFO]${RESET}  $1"
}

section() {
    echo ""
    echo -e "${BOLD}$1${RESET}"
}

# ── Checks ────────────────────────────────────────────────────────────────────

check_docker_running() {
    section "Docker"
    if ! command -v docker &>/dev/null; then
        fail "Docker not installed" "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
        return
    fi
    pass "Docker binary found"

    if docker info &>/dev/null 2>&1; then
        pass "Docker daemon is running"
    else
        fail "Docker daemon is running" "Start Docker Desktop and try again"
    fi
}

check_containers() {
    section "Docker Containers"
    if ! command -v docker &>/dev/null || ! docker info &>/dev/null 2>&1; then
        fail "Cannot check containers — Docker not running"
        return
    fi

    local backend_status frontend_status
    backend_status=$(docker compose ps --format json 2>/dev/null | grep -o '"Service":"backend",".*?"Status":"[^"]*"' | grep -o '"Status":"[^"]*"' | cut -d'"' -f4 || true)
    frontend_status=$(docker compose ps --format json 2>/dev/null | grep -o '"Service":"frontend",".*?"Status":"[^"]*"' | grep -o '"Status":"[^"]*"' | cut -d'"' -f4 || true)

    # Fallback: use plain docker-compose ps output
    if [[ -z "$backend_status" ]]; then
        if docker compose ps 2>/dev/null | grep -q "backend.*Up\|backend.*running"; then
            backend_status="running"
        fi
    fi
    if [[ -z "$frontend_status" ]]; then
        if docker compose ps 2>/dev/null | grep -q "frontend.*Up\|frontend.*running"; then
            frontend_status="running"
        fi
    fi

    if [[ "$backend_status" == *"running"* ]] || [[ "$backend_status" == *"Up"* ]]; then
        pass "Backend container is running"
    else
        fail "Backend container is running" "Run: docker-compose up -d"
    fi

    if [[ "$frontend_status" == *"running"* ]] || [[ "$frontend_status" == *"Up"* ]]; then
        pass "Frontend container is running"
    else
        fail "Frontend container is running" "Run: docker-compose up -d"
    fi
}

check_backend_health() {
    section "Backend API"
    local url="http://localhost:8000"
    local health_url="${url}/health"

    # Health endpoint
    if curl -sf --max-time 5 "$health_url" &>/dev/null; then
        pass "Backend health check (GET /health)"
    else
        # Try root endpoint as fallback
        if curl -sf --max-time 5 "$url" &>/dev/null; then
            pass "Backend is reachable (GET /)"
            info "No /health endpoint found — consider adding one"
        else
            fail "Backend is reachable at ${url}" "Check logs: docker-compose logs backend"
        fi
    fi

    # Docs endpoint
    if curl -sf --max-time 5 "${url}/docs" &>/dev/null; then
        pass "API docs available (GET /docs)"
    else
        fail "API docs available at ${url}/docs" "Check logs: docker-compose logs backend"
    fi

    # Students endpoint
    local http_code
    http_code=$(curl -so /dev/null -w "%{http_code}" --max-time 5 "${url}/students/" 2>/dev/null || echo "000")
    if [[ "$http_code" == "200" ]]; then
        pass "Students endpoint responds (GET /students/)"
    else
        fail "Students endpoint responds — got HTTP ${http_code}" "Backend may still be starting up"
    fi
}

check_frontend_accessible() {
    section "Frontend"
    local url="http://localhost:3000"

    if curl -sf --max-time 10 "$url" &>/dev/null; then
        pass "Frontend is accessible at ${url}"
    else
        fail "Frontend is accessible at ${url}" "Check logs: docker-compose logs frontend  (may need 30s after start)"
    fi
}

check_database() {
    section "Database"

    # Check inside container if Docker is running
    if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
        if docker compose ps 2>/dev/null | grep -q "backend.*Up\|backend.*running"; then
            if docker compose exec -T backend test -f attendance.db &>/dev/null 2>&1 || \
               docker compose exec -T backend test -f ./attendance.db &>/dev/null 2>&1; then
                pass "Database file (attendance.db) exists in backend container"
            else
                fail "Database file found" "It may be created on first request — try visiting http://localhost:8000/students/"
            fi
        else
            info "Backend container not running — skipping database check"
        fi
    else
        # Local dev: check in backend directory
        if [[ -f "backend/attendance.db" ]]; then
            pass "Database file (backend/attendance.db) exists locally"
        else
            info "Database file not found locally — may be inside Docker volume"
        fi
    fi
}

check_uploads_dir() {
    section "Uploads Directory"
    if [[ -d "backend/uploads" ]]; then
        pass "backend/uploads/ directory exists"
        if [[ -f "backend/uploads/.gitkeep" ]]; then
            pass "backend/uploads/.gitkeep present"
        fi
    else
        fail "backend/uploads/ directory exists" "Run: mkdir -p backend/uploads"
    fi
}

check_config_files() {
    section "Configuration Files"
    local files=("docker-compose.yml" "backend/requirements.txt" "backend/Dockerfile" ".gitignore" "README.md")
    for f in "${files[@]}"; do
        if [[ -f "$f" ]]; then
            pass "$f found"
        else
            fail "$f not found"
        fi
    done
}

# ── Summary ───────────────────────────────────────────────────────────────────

print_summary() {
    local total=$((PASS + FAIL))
    echo ""
    echo -e "${BOLD}══════════════════════════════════════${RESET}"
    echo -e "${BOLD}  Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${total} total${RESET}"
    echo -e "${BOLD}══════════════════════════════════════${RESET}"
    echo ""
    if [[ $FAIL -eq 0 ]]; then
        echo -e "  ${GREEN}${BOLD}All checks passed! The system is healthy.${RESET}"
        echo ""
    else
        echo -e "  ${YELLOW}Some checks failed. Review the hints above and re-run this script.${RESET}"
        echo ""
    fi
}

# ── Main ──────────────────────────────────────────────────────────────────────

main() {
    print_header
    check_config_files
    check_uploads_dir
    check_docker_running
    check_containers
    check_backend_health
    check_frontend_accessible
    check_database
    print_summary

    if [[ $FAIL -gt 0 ]]; then
        exit 1
    fi
}

main
