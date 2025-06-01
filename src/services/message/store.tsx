"use client";
import { EVENTS } from "@/events";
import useAppStore from "@/state";
import { useContext } from "react";
import { createContext, useEffect, useState, useCallback } from "react";
import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";

import { Message } from "./type";

// Define the context type
interface MessageContextType {
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: string | null;
  messages: Message[];
  typingUsers: string[];
  loading: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (roomId: string, content: string, type?: "TEXT" | "MEDIA" | "FILE", files?: any[], media?: any[]) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  markAsRead: (messageId: string, roomId: string) => void;
  clearMessages: () => void;
}

// Create context with initial value
export const MessageContext = createContext<MessageContextType>({
  socket: null,
  isConnected: false,
  currentRoom: null,
  messages: [],
  typingUsers: [],
  loading: true,
  joinRoom: () => {},
  leaveRoom: () => {},
  sendMessage: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  markAsRead: () => {},
  clearMessages: () => {},
});

export default function MessageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessToken } = useAppStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      // Disconnect if no token
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setCurrentRoom(null);
        setMessages([]);
        setTypingUsers([]);
      }
      return;
    }

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
      transports: ["websocket", "polling"],
      agent: false,
      upgrade: false,
      rejectUnauthorized: false,
      auth: {
        token: accessToken,
      },
    };

    // Initialize socket connection to messages namespace
    const socketInstance = io(`${SOCKET_URL}/messages`, connConfig);

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Message socket connected:", socketInstance.id);
      setIsConnected(true);
      setLoading(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Message socket connection error:", err.message);
      setIsConnected(false);
      setLoading(false);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Message socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("error", (error: { message: string }) => {
      console.error("Message socket error:", error);
    });

    // Message event listeners
    socketInstance.on(EVENTS.MESSAGE.NEW_MESSAGE, (message: Message) => {
      console.log("Received new message:", message);
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const messageExists = prev.some(m => m._id === message._id);
        if (messageExists) return prev;
        return [...prev, message];
      });
    });

    socketInstance.on(EVENTS.MESSAGE.USER_TYPING, (userInfo: { id: string; fullname: string; role: string }) => {
      if (userInfo.id !== user?._id) {
        setTypingUsers(prev => {
          const filteredUsers = prev.filter(id => id !== userInfo.id);
          return [...filteredUsers, userInfo.id];
        });
      }
    });

    socketInstance.on(EVENTS.MESSAGE.USER_STOPPED_TYPING, (userInfo: { id: string; fullname: string; role: string }) => {
      setTypingUsers(prev => prev.filter(id => id !== userInfo.id));
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
        setCurrentRoom(null);
        setMessages([]);
        setTypingUsers([]);
      }
    };
  }, [accessToken, user?._id]);

  const joinRoom = useCallback((roomId: string) => {
    if (!socket || !isConnected) return;
    
    socket.emit(EVENTS.MESSAGE.JOIN_ROOM, roomId);
    setCurrentRoom(roomId);
    console.log("Joined room:", roomId);
  }, [socket, isConnected]);

  const leaveRoom = useCallback(() => {
    if (!socket || !isConnected || !currentRoom) return;
    
    socket.emit(EVENTS.MESSAGE.LEAVE_ROOM, currentRoom);
    setCurrentRoom(null);
    setMessages([]);
    setTypingUsers([]);
    console.log("Left room:", currentRoom);
  }, [socket, isConnected, currentRoom]);

  const sendMessage = useCallback((roomId: string, content: string, type: "TEXT" | "MEDIA" | "FILE" = "TEXT", files?: any[], media?: any[]) => {
    if (!socket || !isConnected || !user) return;

    const messageData = {
      room: roomId,
      content: content.trim(),
      type,
      files,
      media
    };
    
    console.log("Sending message data to socket:", messageData);
    socket.emit(EVENTS.MESSAGE.SEND_MESSAGE, messageData);
    console.log("Sent message to room:", roomId);
  }, [socket, isConnected, user]);

  const startTyping = useCallback((roomId: string) => {
    if (!socket || !isConnected || !user) return;
    
    socket.emit(EVENTS.MESSAGE.TYPING_START, roomId);
  }, [socket, isConnected, user]);

  const stopTyping = useCallback((roomId: string) => {
    if (!socket || !isConnected || !user) return;
    
    socket.emit(EVENTS.MESSAGE.TYPING_STOP, roomId);
  }, [socket, isConnected, user]);

  const markAsRead = useCallback((messageId: string, roomId: string) => {
    if (!socket || !isConnected) return;
    
    socket.emit(EVENTS.MESSAGE.MESSAGE_READ, { messageId, roomId });
  }, [socket, isConnected]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setTypingUsers([]);
  }, []);

  return (
    <MessageContext.Provider
      value={{
        socket,
        isConnected,
        currentRoom,
        messages,
        typingUsers,
        loading,
        joinRoom,
        leaveRoom,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        clearMessages,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

// Custom hook for using the message socket
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error("useMessage must be used within a MessageProvider");
  }
  return context;
}; 