import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface TasksMutatedPayload {
  event: string;
  data?: {
    action?: string;
    id?: string;
  };
}

export function useTasksWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws";
    let socket: WebSocket | null = null;
    let delay = 1000;
    let timeoutId: any = null;

    function connect() {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        delay = 1000; // Reset delay on successful connection
        console.log("Tasks Realtime WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as TasksMutatedPayload;
          if (payload.event === "tasks_mutated") {
            const { action, id } = payload.data || {};

            if (action && action.startsWith("project_")) {
              queryClient.invalidateQueries({ queryKey: ["task-projects"] });
            } else {
              // Task mutated
              queryClient.invalidateQueries({
                queryKey: ["tasks"],
                predicate: (query) => {
                  const key = query.queryKey;
                  // If it is a task detail query:
                  if (key[0] === "tasks" && key[1] === "detail") {
                    return id ? key[2] === id : true;
                  }
                  // Otherwise, invalidate lists/boards (e.g. general lists or infinite queries)
                  return true;
                },
              });
              // Also invalidate task projects to sync project statistics
              queryClient.invalidateQueries({ queryKey: ["task-projects"] });
            }
          }
        } catch (err) {
          console.error("Failed to parse Tasks WebSocket message:", err);
        }
      };

      socket.onclose = () => {
        socket = null;
        // Reconnect with exponential backoff capped at 30 seconds
        timeoutId = setTimeout(() => {
          delay = Math.min(delay * 1.5, 30000);
          connect();
        }, delay);
      };

      socket.onerror = () => {
        if (socket) socket.close();
      };
    }

    connect();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (socket) {
        socket.onclose = null; // Prevent reconnect on cleanup
        socket.close();
      }
    };
  }, [queryClient]);
}
