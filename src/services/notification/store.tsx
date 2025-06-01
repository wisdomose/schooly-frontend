"use client";
import { EVENTS } from "@/events";
import useAppStore from "@/state";
import { useContext } from "react";
import { createContext, useEffect, useState } from "react";
import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";

// Define the context type
interface NotificationContextType {
  socket: Socket | null;
  notification: Notification | null;
  loading: boolean;
  unread: number | null;
}

// Create context with initial value
export const NotificationContext = createContext<NotificationContextType>({
  socket: null,
  notification: null,
  unread: null,
  loading: true,
});

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessToken } = useAppStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    // Check if the URL is defined
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!SOCKET_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return;
    }

    const connConfig: Partial<ManagerOptions & SocketOptions> = {
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
      // transports: ["websocket"],
      agent: false,
      upgrade: false,
      rejectUnauthorized: false,
      auth: {
        token: accessToken,
      },
    };


    // Initialize socket connection
    const socketInstance = io(`${SOCKET_URL}/notification`, connConfig);

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected");
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socketInstance.on(EVENTS.NOTIFICATION.UNREAD_COUNT, (count: number) => {
      setUnread(count);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      setNotification(null);
      setUnread(null);
    };
  }, [accessToken]); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    if (socket && user) {
    }
  }, [socket, user]);

  return (
    <NotificationContext.Provider
      value={{ socket, notification, loading, unread }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook for using the socket
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
