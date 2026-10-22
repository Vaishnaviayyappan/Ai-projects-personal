import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/stores/authStore';

interface EventStreamOptions {
  onMessage?: (data: any) => void;
}

export function useWebSocket(url: string | null, options: EventStreamOptions = {}) {
  const { token } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!token || !url) return;

    // Convert ws:// to http:// if needed, or just use the provided API base
    const streamUrl = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;
    
    console.log(`[SSE_CLIENT] Attempting connection to ${url}`);
    
    if (eventSourceRef.current) {
        eventSourceRef.current.close();
    }

    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('[SSE_CLIENT] Stream stabilized. Listening for neural pulses.');
      setIsActive(true);
      setError(null);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (options.onMessage) options.onMessage(data);
      } catch (err) {
        console.warn('[SSE_CLIENT] Malformed frame received:', event.data);
      }
    };

    es.onerror = (e) => {
      console.error('[SSE_CLIENT] Stream interruption detected.', e);
      setIsActive(false);
      // EventSource automatically reconnects, we just update state
      if (es.readyState === EventSource.CLOSED) {
        setError('Connection closed permanently.');
      } else {
        setError('Reconnecting...');
      }
    };
  }, [url, token, options]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected: isActive, error }; // Keep isConnected name for backwards compatibility with components
}
