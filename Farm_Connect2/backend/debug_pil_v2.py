import sys
import os
print(f"Executable: {sys.executable}")
print("Sys Path:")
for p in sys.path:
    print(f" - {p}")

try:
    import PIL
    print("PIL imported")
except ImportError:
    print("PIL NOT FOUND")

# Try to install it if missing (hacky but useful for debugging)
import subprocess
subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
