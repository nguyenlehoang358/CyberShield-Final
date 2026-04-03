@echo off
echo ==========================================
echo KHOI DONG HE THONG CYBERSHIELD
echo ==========================================

echo 1. Dang bat Docker (DB, Redis, ELK, Ollama)...
docker-compose up -d

echo 2. Dang bat AI Microservice (Python)...
start cmd /k "cd ai-service && uvicorn main:app --reload --port 8000"

echo 3. Dang bat Spring Boot Backend...
start cmd /k "mvn spring-boot:run"

echo 4. Dang bat React Frontend...
start cmd /k "cd frontend && npm run dev"

echo ==========================================
echo HOAN TAT! Moi thu dang duoc khoi dong o cac cua so moi.
echo ==========================================
pause