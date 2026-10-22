import requests
import json
import time

url = "http://127.0.0.1:8000/api/v1/agents/chat"
payload = {"message": "How is the weather in Punjab?"}
headers = {"Content-Type": "application/json"}

print(f"Sending request to {url}...")
start_time = time.time()
try:
    # 2 minute timeout for local LLM
    response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=120)
    end_time = time.time()
    print(f"Status Code: {response.status_code}")
    print(f"Response Time: {end_time - start_time:.2f} seconds")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
