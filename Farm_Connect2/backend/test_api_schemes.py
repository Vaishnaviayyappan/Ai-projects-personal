import asyncio
import httpx
import sys
import os

# Fix for Windows Event Loop Policy
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test_schemes_api():
    url = "http://localhost:8000/api/v1/features/schemes"
    print(f"Testing API: {url}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Success! Found {len(data)} schemes.")
                for item in data:
                    print(f" - {item.get('title')}: {item.get('link')}")
            else:
                print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    asyncio.run(test_schemes_api())
