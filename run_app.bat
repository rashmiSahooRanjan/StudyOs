@echo off
title StudyOS - Learning & Competitive Exam Intelligence
echo ========================================================
echo   Starting StudyOS (Local-First Learning Management)
echo ========================================================
echo.

start "StudyOS Backend Server" cmd /k "cd /d %~dp0backend && python run.py"
timeout /t 2 /nobreak > nul

start "StudyOS Frontend Web" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo Application is launching!
echo Backend API : http://localhost:5000
echo Frontend UI : http://localhost:5173
echo.
echo Opening browser...
start http://localhost:5173
pause
