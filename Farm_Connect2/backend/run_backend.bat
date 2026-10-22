@echo off
cd /d "%~dp0"
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Starting Backend Server...
uvicorn app.main:app --reload
pause
