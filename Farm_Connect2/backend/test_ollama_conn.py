
import httpx
import asyncio

async def test_ollama():
    url = "http://localhost:11434/api/tags"
    print(f"Testing connection to {url}")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5.0)
            print(f"Status: {resp.status_code}")
            
            data = resp.json()
            models = [m['name'] for m in data.get('models', [])]
            print(f"Available Models: {models}")
            
            if "moondream:latest" in models or "moondream" in models:
                print("SUCCESS: 'moondream' model found!")
                
                # Test Generation
                gen_url = "http://localhost:11434/api/generate"
                payload = {
                    "model": "moondream",
                    "prompt": "What comes after A, B, C?",
                    "stream": False
                }
                print("Testing simple generation with moondream...")
                resp_gen = await client.post(gen_url, json=payload, timeout=30.0)
                if resp_gen.status_code == 200:
                    print(f"Gen Response: {resp_gen.json().get('response', '')}")
                    print("SUCCESS: Generation working.")
                else:
                    print(f"Generation Failed: {resp_gen.status_code} - {resp_gen.text}")
                    
            else:
                print("WARNING: 'moondream' model NOT found in list. (It might still be pulling)")
                
    except Exception as e:
        print(f"Connection failed to localhost: {e}")

if __name__ == "__main__":
    asyncio.run(test_ollama())
