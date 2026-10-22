
import requests
import json

url = "http://localhost:8000/api/v1/agents/chat"
headers = {"Content-Type": "application/json"}
payload = {
    "message": "Hello expert",
    "expert_id": 1
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload, timeout=20)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
