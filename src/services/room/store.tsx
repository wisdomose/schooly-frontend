"use client";
import { EVENTS } from "@/events";
import useAppStore from "@/state";
import { useContext } from "react";
import { createContext, useEffect, useState } from "react";
import { Room } from "./type";

// Define the context type
interface RoomContextType {
  socket: any | null;
  rooms: Room[];
  loading: boolean;
  createRoom: (room: { name: string; purpose: string; members: string[]; roomType?: string }) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
}

// Create context with initial value
export const RoomContext = createContext<RoomContextType>({
  socket: null,
  rooms: [],
  loading: true,
  createRoom: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  updateRoom: () => {},
  deleteRoom: () => {},
});

export default function RoomProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessToken } = useAppStore();
  const [socket, setSocket] = useState<any | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    // Check if the URL is defined
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!SOCKET_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return;
    }

    // For now, we'll use a placeholder for socket connection
    // This will be implemented when socket.io-client is available
    const socketInstance = {
      on: (event: string, callback: (...args: any[]) => void) => {},
      emit: (event: string, data?: any) => {},
      disconnect: () => {},
    };

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Room socket connected");
      setLoading(false);
    });

    socketInstance.on("connect_error", (err: Error) => {
      console.error("Room socket connection error:", err.message);
      setLoading(false);
    });

    socketInstance.on("disconnect", (reason: string) => {
      console.log("Room socket disconnected:", reason);
    });

    // Room events
    socketInstance.on(EVENTS.ROOM.ROOM_CREATED, (room: Room) => {
      setRooms((prev) => [...prev, room]);
    });

    socketInstance.on(EVENTS.ROOM.ROOM_UPDATED, (updatedRoom: Room) => {
      setRooms((prev) =>
        prev.map((room) => (room._id === updatedRoom._id ? updatedRoom : room))
      );
    });

    socketInstance.on(EVENTS.ROOM.ROOM_DELETED, (roomId: string) => {
      setRooms((prev) => prev.filter((room) => room._id !== roomId));
    });

    socketInstance.on(EVENTS.ROOM.USER_JOINED, (data: { roomId: string; user: any }) => {
      setRooms((prev) =>
        prev.map((room) =>
          room._id === data.roomId
            ? { ...room, members: [...room.members, data.user] as any }
            : room
        )
      );
    });

    socketInstance.on(EVENTS.ROOM.USER_LEFT, (data: { roomId: string; userId: string }) => {
      setRooms((prev) =>
        prev.map((room) =>
          room._id === data.roomId
            ? { 
                ...room, 
                members: room.members.filter((member) => 
                  typeof member === 'string' ? member !== data.userId : member._id !== data.userId
                ) as any
              }
            : room
        )
      );
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      setRooms([]);
    };
  }, [accessToken]);

  const createRoom = (room: { name: string; purpose: string; members: string[]; roomType?: string }) => {
    if (socket) {
      socket.emit(EVENTS.ROOM.ROOM_CREATED, room);
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit(EVENTS.ROOM.USER_JOINED, { roomId });
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket) {
      socket.emit(EVENTS.ROOM.USER_LEFT, { roomId });
    }
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    if (socket) {
      socket.emit(EVENTS.ROOM.ROOM_UPDATED, { roomId, updates });
    }
  };

  const deleteRoom = (roomId: string) => {
    if (socket) {
      socket.emit(EVENTS.ROOM.ROOM_DELETED, { roomId });
    }
  };

  return (
    <RoomContext.Provider
      value={{
        socket,
        rooms,
        loading,
        createRoom,
        joinRoom,
        leaveRoom,
        updateRoom,
        deleteRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

// Custom hook for using the room socket
export const useRoom = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}; 