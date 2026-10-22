import sys
print(f"Python Executable: {sys.executable}")
print(f"Python Options: {sys.flags}")

try:
    import PIL
    print(f"PIL Version: {PIL.__version__}")
    print(f"PIL File: {PIL.__file__}")
    from PIL import Image
    print("from PIL import Image successful")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Error: {e}")

import pip
print("Pip is available")
