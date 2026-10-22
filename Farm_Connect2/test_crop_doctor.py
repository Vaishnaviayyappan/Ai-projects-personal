
import requests
from io import BytesIO
from PIL import Image

# 1. Create a dummy image (green square representing a leaf)
img = Image.new('RGB', (100, 100), color = 'green')
img_byte_arr = BytesIO()
img.save(img_byte_arr, format='JPEG')
img_byte_arr.seek(0)

url = "http://localhost:8000/api/v1/features/analyze/crop"
files = {'file': ('test_leaf.jpg', img_byte_arr, 'image/jpeg')}

print(f"Sending dummy image to {url}...")

try:
    # 2. Upload
    response = requests.post(url, files=files, timeout=60) 
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Response JSON:")
        print(response.json())
    else:
        print(f"Error Content: {response.text}")

except Exception as e:
    print(f"Test Failed: {e}")
