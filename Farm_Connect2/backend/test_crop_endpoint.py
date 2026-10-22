
import requests
import base64
import io

# Create a small valid 1x1 red PNG image
# Signature: \x89PNG\r\n\x1a\n ...
# This is a minimal base64 for a red dot png
pk = b'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
img_data = base64.b64decode(pk)

url = "http://localhost:8000/api/v1/features/analyze/crop"
files = {'file': ('test.png', img_data, 'image/png')}

try:
    print(f"Sending POST request to {url}...")
    res = requests.post(url, files=files)
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(f"Request failed: {e}")
