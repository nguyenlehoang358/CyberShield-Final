# AGENTS.md - CyberShield Project Guidelines

## 🎯 1. Project Context
CyberShield is a Full-stack SOC (Security Operations Center) system. Its core mission is system log analysis, proactive defense (Brute Force, Port Scan protection), and blocked IP management using AI.

## 🧰 2. Tech Stack
- **Frontend:** React, Vite.
- **Backend:** Java, Spring Boot, Spring Security.
- **Database:** PostgreSQL.
- **AI Core:** `qwen2.5:3b` model running locally via Ollama.
- **Networking:** Port exposure and tunneling via Ngrok, Pinggy, or Localhost.run.

## 🛑 3. CRITICAL RULES (READ CAREFULLY TO OPTIMIZE SPEED)
1. **Speed First:** DO NOT scan the entire project workspace unless explicitly requested. Only focus on reading and modifying files directly related to the user's current prompt.
2. **Be Concise:** When writing code, ONLY output the specific lines that need to be modified or added. DO NOT output the entire file content if the majority of the code remains unchanged. Avoid lengthy theoretical explanations.
3. **No Unprompted Refactoring:** Absolutely DO NOT change directory structures, rename variables, or refactor stable code unless explicitly requested by the user.
4. **Config Protection:** STRICTLY FORBIDDEN to delete or overwrite existing network configurations in `vite.config.js` (especially the `allowedHosts` array) and `.env` files (which contain Ngrok/Pinggy URLs).

## 💻 4. Frontend Guidelines
- Strictly use Functional Components and React Hooks.
- When calling APIs via Axios/Fetch, always remember the system runs through a network tunnel. You must handle CORS properly and include the `ngrok-skip-browser-warning: true` (or equivalent) header if necessary.

## ⚙️ 5. Backend Guidelines
- Strictly adhere to the layered architecture: Controller -> Service -> Repository -> Entity.
- Pay close attention to database schemas. Timestamp column names in PostgreSQL are usually `created_at` or `timestamp`. Check the exact schema constraints (e.g., the `login_attempts` table uses a boolean `success` column, not a string) before writing Native Queries or generating Mock Data.