# ============================================
# CYBERSHIELD - KHOI DONG TOAN BO HE THONG
# ============================================
# Usage: .\run_all.ps1
#   -SkipDocker   : Bo qua khoi dong Docker
#   -SkipAI       : Bo qua AI Microservice
#   -SkipBackend  : Bo qua Spring Boot Backend
#   -SkipFrontend : Bo qua React Frontend

param(
    [switch]$SkipDocker,
    [switch]$SkipAI,
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

$ROOT = $PSScriptRoot
$ErrorActionPreference = "Continue"

function Write-Header($msg) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor White
    Write-Host "============================================" -ForegroundColor Cyan
}

function Write-Step($step, $msg) {
    Write-Host "[$step] $msg" -ForegroundColor Yellow
}

function Write-OK($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Err($msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

# ============================================
Write-Header "CYBERSHIELD SYSTEM STARTUP"
# ============================================

# --- 1. DOCKER ---
if (-not $SkipDocker) {
    Write-Step "1/4" "Khoi dong Docker containers (DB, Redis, Ollama, ELK)..."

    # Check Docker is running
    $dockerStatus = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Docker Desktop chua chay! Hay mo Docker Desktop truoc."
        Write-Host "  -> Mo Docker Desktop, doi 30s roi chay lai script." -ForegroundColor Gray
        exit 1
    }

    docker-compose -f "$ROOT\docker-compose.yml" up -d
    if ($LASTEXITCODE -eq 0) {
        Write-OK "Docker containers da khoi dong."
    }
    else {
        Write-Err "Docker-compose that bai. Kiem tra docker-compose.yml"
        exit 1
    }

    # Wait for DB healthy
    Write-Step "..." "Doi PostgreSQL san sang..."
    $retries = 0
    $maxRetries = 30
    while ($retries -lt $maxRetries) {
        $health = docker inspect --format='{{.State.Health.Status}}' myweb-db 2>$null
        if ($health -eq "healthy") {
            Write-OK "PostgreSQL da san sang."
            break
        }
        Start-Sleep -Seconds 2
        $retries++
    }
    if ($retries -ge $maxRetries) {
        Write-Err "PostgreSQL khong san sang sau ${maxRetries} lan thu."
    }

    # Wait for Redis healthy
    $retries = 0
    while ($retries -lt 15) {
        $health = docker inspect --format='{{.State.Health.Status}}' myweb-redis 2>$null
        if ($health -eq "healthy") {
            Write-OK "Redis da san sang."
            break
        }
        Start-Sleep -Seconds 2
        $retries++
    }
}
else {
    Write-Step "1/4" "Bo qua Docker (flag -SkipDocker)."
}

# --- 2. AI MICROSERVICE ---
if (-not $SkipAI) {
    Write-Step "2/4" "Khoi dong AI Microservice (FastAPI - port 8000)..."

    $aiDir = "$ROOT\ai-service"

    # Activate venv & start in new window
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "Set-Location '$aiDir'; & '$ROOT\.venv\Scripts\Activate.ps1'; pip install -r requirements.txt -q; Write-Host 'AI Service starting on port 8000...' -ForegroundColor Green; uvicorn main:app --reload --port 8000"
    )
    Write-OK "AI Microservice dang khoi dong trong cua so moi."
}
else {
    Write-Step "2/4" "Bo qua AI Service (flag -SkipAI)."
}

# --- 3. SPRING BOOT BACKEND ---
if (-not $SkipBackend) {
    Write-Step "3/4" "Khoi dong Spring Boot Backend (port 8443)..."

    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "Set-Location '$ROOT'; Write-Host 'Spring Boot Backend starting...' -ForegroundColor Green; mvn spring-boot:run '-Dspring-boot.run.jvmArguments=-Xmx512m'"
    )
    Write-OK "Backend dang khoi dong trong cua so moi."
}
else {
    Write-Step "3/4" "Bo qua Backend (flag -SkipBackend)."
}

# --- 4. REACT FRONTEND ---
if (-not $SkipFrontend) {
    Write-Step "4/4" "Khoi dong React Frontend (Vite - port 5173)..."

    $frontendDir = "$ROOT\frontend"

    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "Set-Location '$frontendDir'; Write-Host 'Frontend starting...' -ForegroundColor Green; npm run dev"
    )
    Write-OK "Frontend dang khoi dong trong cua so moi."
}
else {
    Write-Step "4/4" "Bo qua Frontend (flag -SkipFrontend)."
}

# --- SUMMARY ---
Write-Header "KHOI DONG HOAN TAT"
Write-Host ""
Write-Host "  Service            Port     URL" -ForegroundColor White
Write-Host "  -------            ----     ---" -ForegroundColor Gray
Write-Host "  PostgreSQL         5432     localhost:5432"
Write-Host "  Redis              6379     localhost:6379"
Write-Host "  Ollama (AI LLM)    11434    http://localhost:11434"
Write-Host "  AI Microservice    8000     http://localhost:8000"
Write-Host "  Backend (Spring)   8443     https://localhost:8443"
Write-Host "  Frontend (React)   5173     http://localhost:5173"
Write-Host "  pgAdmin            8080     http://localhost:8080"
Write-Host "  Kibana             5601     http://localhost:5601"
Write-Host ""
Write-Host "  Moi service chay trong cua so PowerShell rieng." -ForegroundColor Gray
Write-Host "  Dong cua so = tat service tuong ung." -ForegroundColor Gray
Write-Host ""
