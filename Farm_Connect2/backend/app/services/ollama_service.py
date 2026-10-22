import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def query_ollama(model: str, prompt: str, system_prompt: str = None, images: list = None, timeout: float = 120.0, options: dict = None):
    """
    Generic function to query local Ollama instance with speed optimizations.
    """
    # Force 127.0.0.1 if localhost to be safe, though config should handle it
    base_url = settings.OLLAMA_BASE_URL.replace("localhost", "127.0.0.1")
    url = f"{base_url}/api/generate"
    
    # Default options for speed
    gen_options = {
        "num_predict": 512, # Prevent rambling
        "temperature": 0.7,
        "top_k": 40,
        "top_p": 0.9
    }
    if options:
        gen_options.update(options)

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": gen_options
    }

    if images:
        payload["images"] = images

    if system_prompt:
        payload["system"] = system_prompt
        
    try:
        logger.info(f"Querying Ollama: {model} (Timeout: {timeout}s) at {url}")
        print(f"DEBUG: Sending to Ollama {model} at {url}...") 
        async with httpx.AsyncClient() as client:
            # Extended timeout for initial model load
            response = await client.post(url, json=payload, timeout=timeout)
            if response.status_code != 200:
                error_msg = response.text
                logger.error(f"Ollama API Error ({response.status_code}): {error_msg}")
                return f"AI Error ({response.status_code}): {error_msg}"
            
            data = response.json()
            print("DEBUG: Ollama responded.")
            return data.get("response", "")

    except httpx.ReadTimeout:
        logger.error("Ollama timed out.")
        return "I'm still thinking... (My AI brain is warming up!). Please ask again in 30 seconds."
    except Exception as e:
        logger.error(f"Ollama connection error: {type(e).__name__}: {e}")
        # Graceful fallback for demo purposes if AI is down
        return "I am currently unable to access my AI brain (Ollama is offline). Please ensure the local AI server is running."

