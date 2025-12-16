import { useEffect, useCallback } from "react";
import { useWebSocket, WebSocketMessage } from "@/lib/websocket";
import { queryClient } from "@/lib/queryClient";

type EventHandler = (payload: unknown) => void;

export function useRealtime(eventHandlers?: Record<string, EventHandler>) {
  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    const handlers: Array<{ type: string; handler: EventHandler }> = [];

    // Default handlers for common events - invalidate relevant queries
    const defaultHandlers: Record<string, EventHandler> = {
      booking_created: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      },
      booking_updated: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      },
      booking_deleted: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      },
      customer_created: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      },
      customer_updated: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      },
      court_created: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      },
      court_updated: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      },
      court_deleted: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      },
      transaction_created: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      },
      waitlist_created: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      },
      waitlist_updated: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      },
      blocked_slot_created: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/blocked-slots"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      },
      blocked_slot_deleted: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/blocked-slots"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      },
      tournament_created: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      },
      tournament_updated: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      },
      tournament_team_created: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      },
    };

    // Register default handlers
    Object.entries(defaultHandlers).forEach(([type, handler]) => {
      handlers.push({ type, handler });
      subscribe(type, handler);
    });

    // Register custom handlers
    if (eventHandlers) {
      Object.entries(eventHandlers).forEach(([type, handler]) => {
        handlers.push({ type, handler });
        subscribe(type, handler);
      });
    }

    return () => {
      handlers.forEach(({ type, handler }) => {
        unsubscribe(type, handler);
      });
    };
  }, [subscribe, unsubscribe, eventHandlers]);

  return { isConnected };
}
