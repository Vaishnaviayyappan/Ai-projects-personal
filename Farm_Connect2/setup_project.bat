@echo off
echo Setting up Farm Connect...

echo [1/4] Installing Backend Dependencies...
cd backend
pip install -r requirements.txt

echo [2/4] Initializing Database...
python -m app.initial_data

echo [3/4] Installing Frontend Dependencies...
cd ..\frontend
call npm install

echo Setup Complete! Run 'start.bat' to launch.
pause
