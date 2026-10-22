import subprocess
import os
import time

# Kill existing uvicorn
os.system("taskkill /F /IM python.exe")

cur_dir = os.getcwd()
backend_dir = os.path.join(cur_dir, "backend")

# Use full path to python in venv
python_path = os.path.join(backend_dir, "venv", "Scripts", "python.exe")

print(f"Starting backend with {python_path}...")
with open("backend_log.txt", "w") as f:
    process = subprocess.Popen(
        [python_path, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=backend_dir,
        stdout=f,
        stderr=subprocess.STDOUT
    )
    print(f"Backend started with PID {process.pid}. Logging to backend_log.txt")
