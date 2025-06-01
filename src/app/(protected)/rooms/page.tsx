"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RoomService } from "@/services/room";
import { Room } from "@/services/room/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  MessageCircle,
  Users,
  Clock,
  Hash,
  BookOpen,
  FileText,
  Loader2,
  Calendar,
  User,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import moment from "moment";

export default function RoomsPage() {
  const { user } = useAppStore();
  const [selectedType, setSelectedType] = useState<string>("all");
  
  const roomService = new RoomService();

  // Fetch user's rooms
  const { data: roomsData, isLoading } = useQuery({
    queryKey: ["userRooms", user?._id],
    queryFn: () => roomService.getUserRooms(),
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  // Backend returns Room[] directly as data
  const rooms = roomsData || [];

  // Track filter changes for debugging
  useEffect(() => {
    console.log("Filter changed to:", selectedType);
  }, [selectedType]);

  // Filter rooms based on type only
  const filteredRooms = rooms.filter((room) => {
    // Handle case where room or roomType might be undefined
    if (!room || !room.roomType) {
      return selectedType === "all";
    }
    
    const matchesType = selectedType === "all" || room.roomType === selectedType;
    return matchesType;
  });

  // Debug logging
  console.log(`Total rooms: ${rooms.length}, Selected: ${selectedType}, Filtered: ${filteredRooms.length}`);
  if (rooms.length > 0) {
    console.log("Sample room:", rooms[0]);
  }

  const roomTypes = [
    { value: "all", label: "All Rooms", icon: MessageCircle },
    { value: "course", label: "Course Rooms", icon: BookOpen },
    { value: "assignment", label: "Assignment Rooms", icon: FileText },
    { value: "study_group", label: "Study Groups", icon: Users },
    { value: "general", label: "General", icon: Hash },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading your rooms...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Chat Rooms</h1>
              <p className="text-white/70">
                Manage your chat rooms and create new ones to collaborate with others.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Room Type Filter */}
              <div className="min-w-[200px]">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Link href={routes.createRoom()}>
                <Button className="glass-button cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length === 0 ? (
          <div className="glass-card rounded-2xl p-12">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {selectedType !== "all" ? "No rooms found" : "No rooms yet"}
              </h3>
              <p className="text-white/70 mb-6">
                {selectedType !== "all" 
                  ? "Try adjusting your filters"
                  : "Create your first room to start chatting with others."
                }
              </p>
              {selectedType === "all" && (
                <Link href={routes.createRoom()}>
                  <Button className="glass-button cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Room
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room._id} room={room} currentUserId={user?._id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RoomCard({ room, currentUserId }: { room: Room; currentUserId?: string }) {
  const getRoomTypeIcon = () => {
    switch (room.roomType) {
      case "course":
        return BookOpen;
      case "assignment":
        return FileText;
      case "study_group":
        return Users;
      default:
        return Hash;
    }
  };

  const getRoomTypeColor = () => {
    switch (room.roomType) {
      case "course":
        return "from-blue-500 to-blue-600";
      case "assignment":
        return "from-purple-500 to-purple-600";
      case "study_group":
        return "from-green-500 to-green-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const isCreator = typeof room.creator === "string" 
    ? room.creator === currentUserId 
    : room.creator._id === currentUserId;

  const IconComponent = getRoomTypeIcon();
  const colorClass = getRoomTypeColor();

  const roomUrl = room.course 
    ? routes.courseRoom(typeof room.course === "string" ? room.course : room.course._id)
    : routes.roomDetails(room._id);

  return (
    <Link href={roomUrl}>
      <div className="glass-card rounded-2xl p-6 hover:bg-white/10 transition-all duration-200 cursor-pointer group h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-3 rounded-xl bg-gradient-to-r", colorClass)}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              {isCreator && (
                <Crown className="w-4 h-4 text-yellow-400" />
              )}
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                room.isActive 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              )}>
                {room.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
              {room.name}
            </h3>
            <p className="text-white/70 text-sm line-clamp-2 mb-4">
              {room.purpose}
            </p>

            {/* Related Course/Assignment */}
            {room.course && (
              <div className="flex items-center space-x-2 text-blue-400 text-sm mb-3">
                <BookOpen className="w-4 h-4" />
                <span>
                  {typeof room.course === "string" ? "Course" : room.course.title || "Course"}
                </span>
              </div>
            )}

            {room.assignment && (
              <div className="flex items-center space-x-2 text-purple-400 text-sm mb-3">
                <FileText className="w-4 h-4" />
                <span>
                  {typeof room.assignment === "string" ? "Assignment" : room.assignment.title || "Assignment"}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-4 text-white/60 text-sm">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{room.members.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{moment(room.updatedAt).fromNow()}</span>
              </div>
            </div>
            <span className="text-xs text-white/50 capitalize">
              {room.roomType.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 