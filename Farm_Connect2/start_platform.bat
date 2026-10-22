@echo off
echo Killing any stale processes...
taskkill /F /IM node.exe /IM python.exe /IM uvicorn.exe /IM react-native-bundler.exe >nul 2>&1

echo Starting Farm Connect Platform...

:: Start Backend in a new window using the VENV
echo Starting Backend (FastAPI)...
start "Farm Connect Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Start Frontend in a new window to keep logs clean
echo Starting Frontend (Expo Web/Mobile)...
start "Farm Connect Frontend" cmd /k "cd frontend && npx expo start --clear"

echo Platform Launched! Check the new windows.
pause
