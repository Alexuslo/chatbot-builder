@echo off
echo ChatBot Builder - Restart
echo ========================
echo.

echo [1/4] Stopping existing services...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/4] Cleaning ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

echo [3/4] Starting Backend (port 3001)...
start "Backend" cmd /k "cd /d %~dp0backend && npx nodemon server.js"

timeout /t 3 /nobreak >nul

echo [4/4] Starting Frontend (port 5173)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:5173

echo.
echo Done! Services running on:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
