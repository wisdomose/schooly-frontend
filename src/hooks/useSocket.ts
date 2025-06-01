import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import useAppStore from "@/state";

export const useSocket = () => {
  const { accessToken } = useAppStore();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      // Disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!SOCKET_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return;
    }

    // Create socket connection
    const socket = io(SOCKET_URL, {
      auth: {
        token: accessToken,
      },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
        setIsConnected(false);
      }
    };
  }, [accessToken]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}; 