@echo off
title AetherLearn AI - Full Stack Launcher
echo ==================================================
echo    🚀 Starting AetherLearn AI Platform (Full Stack)
echo ==================================================
echo.

:: 1. Start the Backend
echo [1/2] Launching Backend Server on port 3001...
cd backend
start "AI Backend Server" cmd /c "node server.js || (echo ERROR: Node.js not found! Please install it from nodejs.org && pause)"
cd ..

:: Wait 2 seconds for server startup
timeout /t 2 /nobreak > nul

:: 2. Open the Platform in Chrome / Default Browser
echo [2/2] Opening http://localhost:3001 in browser...
start http://localhost:3001

echo.
echo ==================================================
echo    ✨ Platform Ready at http://localhost:3001
echo    👤 Student: student@demo.com / student123
echo    👑 Admin:   admin@demo.com   / admin123
echo ==================================================
timeout /t 5
