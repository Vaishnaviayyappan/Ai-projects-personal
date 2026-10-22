import asyncio
import logging
import time
from functools import wraps

logger = logging.getLogger("Observability")

def retry(retries: int = 3, backoff: float = 0.5):
    """
    PHASE 10: Production Hardening.
    Implements exponential backoff for a resilient agentic infrastructure.
    """
    def decorator(f):
        @wraps(f)
        async def wrapper(*args, **kwargs):
            last_err = None
            for i in range(retries):
                try:
                    return await f(*args, **kwargs)
                except Exception as e:
                    last_err = e
                    wait = backoff * (2 ** i)
                    logger.warning(f"Retry {i+1}/{retries} for {f.__name__} after {wait}s...")
                    await asyncio.sleep(wait)
            raise last_err
        return wrapper
    return decorator

class PerfTracer:
    """
    Tracing utility for measuring Agent reasoning latency.
    """
    def __init__(self, trace_name: str):
        self.trace_name = trace_name
        self.start = 0

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, type, value, traceback):
        elapsed = (time.perf_counter() - self.start) * 1000
        logger.info(f"PERF [{self.trace_name}] Elapsed: {elapsed:.2f}ms")
