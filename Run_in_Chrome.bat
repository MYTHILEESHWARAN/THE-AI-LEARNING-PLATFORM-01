@echo off
title AetherLearn AI Launcher
echo --------------------------------------------------
echo    ✨ AetherLearn AI — Full Stack Launcher
echo --------------------------------------------------
echo.

:: 1. Start the Backend
echo [1/2] Starting AI Backend Server...
cd backend
start "AI Backend" cmd /c "node server.js"
cd ..

timeout /t 2 /nobreak > nul

:: 2. Open Chrome
echo [2/2] Launching Chrome at http://localhost:3001...
start http://localhost:3001

echo.
echo --------------------------------------------------
echo Platform active at http://localhost:3001
echo Demo Student: student@demo.com / student123
echo Demo Admin:   admin@demo.com   / admin123
echo --------------------------------------------------
timeout /t 3
