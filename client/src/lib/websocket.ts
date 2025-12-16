import { useEffect, useRef, useCallback, useState } from "react";

export type WebSocketMessage = {
  type: string;
  payload: unknown;
};

type EventHandler = (payload: unknown) => void;

const eventHandlers = new Map<string, Set<EventHandler>>();
let globalSocket: WebSocket | null = null;
let connectionPromise: Promise<void> | null = null;

function getOrCreateSocket(): Promise<void> {
  if (globalSocket?.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }
  
  if (connectionPromise) {
    return connectionPromise;
  }
  
  connectionPromise = new Promise((resolve) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log("WebSocket connected");
        globalSocket = socket;
        connectionPromise = null;
        resolve();
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          const handlers = eventHandlers.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message.payload));
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };
      
      socket.onclose = () => {
        console.log("WebSocket disconnected");
        globalSocket = null;
        connectionPromise = null;
        
        setTimeout(() => {
          if (eventHandlers.size > 0) {
            getOrCreateSocket();
          }
        }, 3000);
      };
      
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        connectionPromise = null;
        setTimeout(() => {
          if (eventHandlers.size > 0) {
            getOrCreateSocket();
          }
        }, 3000);
        resolve();
      };
    } catch (error) {
      connectionPromise = null;
      setTimeout(() => {
        if (eventHandlers.size > 0) {
          getOrCreateSocket();
        }
      }, 3000);
      resolve();
    }
  });
  
  return connectionPromise;
}

function subscribeToEvent(type: string, handler: EventHandler): void {
  if (!eventHandlers.has(type)) {
    eventHandlers.set(type, new Set());
  }
  eventHandlers.get(type)!.add(handler);
  
  getOrCreateSocket();
}

function unsubscribeFromEvent(type: string, handler: EventHandler): void {
  const handlers = eventHandlers.get(type);
  if (handlers) {
    handlers.delete(handler);
    if (handlers.size === 0) {
      eventHandlers.delete(type);
    }
  }
}

function sendWebSocketMessage(type: string, payload: unknown): void {
  if (globalSocket?.readyState === WebSocket.OPEN) {
    globalSocket.send(JSON.stringify({ type, payload }));
  }
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(
    globalSocket?.readyState === WebSocket.OPEN
  );
  
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(globalSocket?.readyState === WebSocket.OPEN);
    };
    
    const interval = setInterval(checkConnection, 1000);
    
    getOrCreateSocket().then(() => setIsConnected(true)).catch(() => setIsConnected(false));
    
    return () => clearInterval(interval);
  }, []);
  
  const subscribe = useCallback((type: string, handler: EventHandler) => {
    subscribeToEvent(type, handler);
  }, []);
  
  const unsubscribe = useCallback((type: string, handler: EventHandler) => {
    unsubscribeFromEvent(type, handler);
  }, []);
  
  const sendMessage = useCallback((type: string, payload: unknown) => {
    sendWebSocketMessage(type, payload);
  }, []);
  
  const reconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.close();
      globalSocket = null;
    }
    return getOrCreateSocket();
  }, []);
  
  return {
    isConnected,
    subscribe,
    unsubscribe,
    sendMessage,
    reconnect,
  };
}
