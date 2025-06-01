"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RoomService } from "@/services/room";
import UserService from "@/services/user/user";
import { CreateRoom } from "@/services/room/type";
import type { User as UserType } from "@/services/user/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Hash,
  BookOpen,
  FileText,
  Search,
  Loader2,
  X,
  User,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function CreateRoomPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const roomService = new RoomService();
  const userService = new UserService();

  // Form state
  const [formData, setFormData] = useState<CreateRoom>({
    name: "",
    purpose: "",
    members: [],
    roomType: "general",
    isGroup: true,
  });

  // Member search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Create room mutation
  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: (data: CreateRoom) => roomService.create(data),
    onSuccess: (room) => {
      toast.success("Room created successfully!");
      queryClient.invalidateQueries({ queryKey: ["userRooms", user?._id] });
      router.push(routes.roomDetails(room!._id));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create room");
    },
  });

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Search for users
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await userService.searchStudents(query);
      
      // Filter out current user and already selected members
      const filteredResults = results?.filter(
        (u: UserType) => 
          u._id !== user?._id && 
          !selectedMembers.some(member => member._id === u._id)
      ) || [];
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Failed to search users:", error);
      setSearchResults([]);
      toast.error("Failed to search users. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout
    const newTimeout = setTimeout(() => {
      searchUsers(value);
    }, 500);
    
    setSearchTimeout(newTimeout);
  };

  const addMember = (selectedUser: UserType) => {
    setSelectedMembers(prev => [...prev, selectedUser]);
    setSearchResults([]);
    setSearchQuery("");
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(member => member._id !== userId));
  };

  const handleInputChange = (field: keyof CreateRoom, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Room name is required");
      return;
    }
    
    if (!formData.purpose.trim()) {
      toast.error("Room purpose is required");
      return;
    }

    const roomData: CreateRoom = {
      ...formData,
      members: selectedMembers.map(member => member._id),
    };

    createRoom(roomData);
  };

  const roomTypes = [
    { value: "general", label: "General Chat", icon: Hash, description: "A general discussion room" },
    { value: "study_group", label: "Study Group", icon: Users, description: "A room for group study sessions" },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-3">
            <Link href={routes.rooms()}>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rooms
              </Button>
            </Link>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Room Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white mb-2 block">
                  Room Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter room name..."
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <Label htmlFor="purpose" className="text-white mb-2 block">
                  Room Purpose *
                </Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange("purpose", e.target.value)}
                  placeholder="Describe the purpose of this room..."
                  rows={3}
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Room Type</Label>
                <Select
                  value={formData.roomType}
                  onValueChange={(value) => handleInputChange("roomType", value)}
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Room Members</h2>
            
            <div className="space-y-4">
              {/* Current User (Creator) */}
              <div>
                <Label className="text-white mb-2 block">Room Creator (You)</Label>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{user?.fullname}</p>
                      <p className="text-white/60 text-sm">{user?.email} • Room Creator</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div>
                  <Label className="text-white mb-2 block">
                    Selected Members ({selectedMembers.length})
                  </Label>
                  <div className="space-y-2">
                    {selectedMembers.map((member) => (
                      <div key={member._id} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{member.fullname}</p>
                              <p className="text-white/60 text-sm">{member.email}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member._id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Members Search */}
              <div>
                <Label className="text-white mb-2 block">Add Members</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 glass-input"
                  />
                  
                  {/* Search Results */}
                  {searchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-3 text-center">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">Searching users...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((foundUser) => (
                          <div
                            key={foundUser._id}
                            onClick={() => addMember(foundUser)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-gray-900 font-medium">{foundUser.fullname}</p>
                                <p className="text-gray-600 text-sm">{foundUser.email}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center">
                          <p className="text-gray-600 text-sm">No users found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-white/60 text-sm mt-2">
                  Search and add members to your room. You can also add members later.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-end space-x-4">
              <Link href={routes.rooms()}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isPending || !formData.name.trim() || !formData.purpose.trim()}
                className="glass-button cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Room
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 