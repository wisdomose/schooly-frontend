"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getFileIcon, formatFileSize } from "@/lib/utils";
import { CourseService } from "@/services/course";
import { RoomService } from "@/services/room";
import { MessageService } from "@/services/message";
import { FileService } from "@/services/file";
import { Room } from "@/services/room/type";
import { Message } from "@/services/message/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMessage } from "@/services/message/store";
import {
  ArrowLeft,
  Send,
  Users,
  MessageCircle,
  Loader2,
  User,
  Crown,
  Calendar,
  Hash,
  Wifi,
  WifiOff,
  Paperclip,
  File,
  Download,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import moment from "moment";

export default function CourseRoomPage() {
  const params = useParams();
  const { user } = useAppStore();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shouldFocus, setShouldFocus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const courseId = params.id as string;
  const courseService = new CourseService();
  const roomService = new RoomService();
  const messageService = new MessageService();
  const fileService = new FileService();
  
  // Message socket connection
  const { 
    socket, 
    isConnected, 
    messages: socketMessages, 
    typingUsers, 
    joinRoom, 
    leaveRoom, 
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
    clearMessages
  } = useMessage();

  // State for file upload
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
    }
  }, []);

  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseService.findOne(courseId),
    refetchOnWindowFocus: false,
  });

  // Fetch course room
  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: ["courseRoom", courseId],
    queryFn: () => roomService.findByCourse(courseId),
    refetchOnWindowFocus: false,
    enabled: !!courseId,
  });

  // Fetch initial messages (once)
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["roomMessages", room?._id],
    queryFn: () => messageService.getByRoom(room!._id),
    refetchOnWindowFocus: false,
    enabled: !!room?._id,
  });

  // Set initial messages
  useEffect(() => {
    console.log("MessagesData received:", messagesData);
    if (messagesData && Array.isArray(messagesData)) {
      console.log("Processing messages, count:", messagesData.length);
      // Reverse messages since API returns them in reverse order (newest first)
      const reversedMessages = [...messagesData].reverse();
      console.log("Reversed messages:", reversedMessages);
      setMessages(reversedMessages);
      
      // Check if there are more messages to load
      setHasMoreMessages(messagesData.length === 10); // Assuming limit of 10
    } else {
      console.log("No messages data or not an array:", messagesData);
    }
  }, [messagesData]);

  // Merge socket messages with local messages
  useEffect(() => {
    if (socketMessages.length > 0) {
      setMessages(prev => {
        const newMessages = [...prev];
        
        socketMessages.forEach(socketMessage => {
          const exists = newMessages.some(m => m._id === socketMessage._id);
          if (!exists) {
            newMessages.push(socketMessage);
          }
        });
        
        // Sort by creation time to maintain order
        return newMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    }
  }, [socketMessages]);

  // Join room when room is loaded
  useEffect(() => {
    if (room?._id && socket && isConnected) {
      joinRoom(room._id);
      
      return () => {
        leaveRoom();
      };
    }
  }, [room?._id, socket, isConnected, joinRoom, leaveRoom]);

  // Load older messages function
  const loadOlderMessages = useCallback(async () => {
    if (!room?._id || isLoadingOlder || !hasMoreMessages) return;

    setIsLoadingOlder(true);
    try {
      const oldestMessage = messages[0];
      const beforeId = oldestMessage?._id;
      
      const olderMessagesData = await messageService.getByRoom(room._id, {
        before: beforeId,
        limit: 10
      });
      
      if (olderMessagesData && Array.isArray(olderMessagesData) && olderMessagesData.length > 0) {
        const olderMessages = [...olderMessagesData].reverse();
        
        // Save current scroll position
        const container = messagesContainerRef.current;
        const scrollHeightBefore = container?.scrollHeight || 0;
        
        setMessages(prev => [...olderMessages, ...prev]);
        
        // Restore scroll position to prevent jumping
        if (container) {
          setTimeout(() => {
            const scrollHeightAfter = container.scrollHeight;
            container.scrollTop = scrollHeightAfter - scrollHeightBefore;
          }, 0);
        }
        
        // Check if there are more messages
        setHasMoreMessages(olderMessagesData.length === 10);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Failed to load older messages:", error);
      toast.error("Failed to load older messages");
    } finally {
      setIsLoadingOlder(false);
    }
  }, [room?._id, messages, isLoadingOlder, hasMoreMessages, messageService]);

  // Handle scroll to top for loading older messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0 && hasMoreMessages && !isLoadingOlder) {
      loadOlderMessages();
    }
  }, [hasMoreMessages, isLoadingOlder, loadOlderMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100); // Small delay to ensure DOM is updated
    
    return () => clearTimeout(timeoutId);
  }, [messages, scrollToBottom]);

  const handleTyping = useCallback(() => {
    if (!room?._id || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      startTyping(room._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(room._id);
    }, 2000);
  }, [room?._id, user, isTyping, startTyping, stopTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !room || isSending || !isConnected) return;
    
    // Clear typing state
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      setIsTyping(false);
      stopTyping(room._id);
    }
    
    setIsSending(true);
    
    // Send message via socket
    sendSocketMessage(room._id, newMessage.trim());
    setNewMessage("");
    
    // Reset textarea height
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.focus();
    }
    
    // Reset sending state and request focus
    setIsSending(false);
    setShouldFocus(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-grow textarea
    if (messageInputRef.current) {
      const textarea = messageInputRef.current;
      const maxHeight = 128; // 8rem = 128px (max-h-32)
      
      // Reset height to measure scroll height
      textarea.style.height = 'auto';
      
      // Calculate new height
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Enable/disable scrolling based on content height
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
    
    handleTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (!room || !isConnected) {
      toast.error("Cannot upload files while disconnected");
      return;
    }

    setIsUploadingFile(true);
    try {
      // Upload all files
      const uploadPromises = files.map(file => fileService.upload(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Create file objects array
      const fileObjects = uploadedFiles.map(uploadedFile => ({
        url: uploadedFile.url,
        name: uploadedFile.name,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size
      }));
      
      // Send single message with all files
      const filesText = files.length === 1 ? files[0].name : `${files.length} files`;
      sendSocketMessage(room._id, filesText, "FILE", fileObjects);
      
      toast.success(`${files.length} file(s) uploaded and shared successfully!`);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const isUserMember = room?.members.some(member => 
    typeof member === "string" ? member === user?._id : member._id === user?._id
  );

  const isCreator = course && user && (
    (typeof course.creator === "string" && course.creator === user._id) ||
    (typeof course.creator === "object" && course.creator._id === user._id)
  );

  // Auto-focus input when room loads and user is a member
  useEffect(() => {
    if (room && isUserMember && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [room, isUserMember]);

  // Refocus input when sending is complete (backup approach)
  useEffect(() => {
    if (!isSending && messageInputRef.current && newMessage === "") {
      const focusTimeout = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(focusTimeout);
    }
  }, [isSending, newMessage]);

  // Handle focus request
  useEffect(() => {
    if (shouldFocus && !isSending && isConnected && messageInputRef.current) {
      console.log("Focusing input due to shouldFocus flag");
      messageInputRef.current.focus();
      setShouldFocus(false);
    }
  }, [shouldFocus, isSending, isConnected]);

  // Initialize textarea height
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.overflowY = 'hidden';
    }
  }, []);

  if (isLoadingCourse || isLoadingRoom) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading course room...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course || !room) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-white/5 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Room not found
              </h3>
              <p className="text-white/70 mb-4">
                The course room doesn&apos;t exist or you don&apos;t have access to it.
              </p>
              <Link href={routes.courseDetails(courseId)}>
                <Button className="glass-button cursor-pointer">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="max-w-6xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={routes.courseDetails(courseId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/70">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className={`${isConnected ? "text-green-400" : "text-red-400"} hidden sm:inline`}>
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-white/70">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">{room.members.length} members</span>
                <span className="sm:hidden">{room.members.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="glass-card rounded-2xl p-6 flex flex-col h-full">
              {/* Room Header */}
              <div className="border-b border-white/10 pb-4 mb-4 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                    <Hash className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">{room.name}</h1>
                    <p className="text-white/70 text-sm">{room.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex flex-col flex-1 min-h-0">
                {/* Messages List */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto mb-4 space-y-4 glass-scrollbar"
                >
                  {/* Loading older messages indicator */}
                  {isLoadingOlder && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-white mr-2" />
                      <span className="text-white/70 text-sm">Loading older messages...</span>
                    </div>
                  )}
                  
                  {/* End of messages indicator */}
                  {!hasMoreMessages && messages.length > 0 && (
                    <div className="text-center py-4">
                      <div className="text-white/50 text-xs">You&apos;ve reached the beginning of the conversation</div>
                    </div>
                  )}
                  
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 rounded-full bg-white/5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-white/60" />
                      </div>
                      <p className="text-white/70">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <MessageBubble 
                          key={message._id} 
                          message={message} 
                          currentUserId={user?._id}
                          courseCreatorId={typeof course?.creator === "string" ? course.creator : course?.creator?._id}
                        />
                      ))}
                      
                      {/* Typing Indicator */}
                      {typingUsers.length > 0 && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 text-white max-w-xs lg:max-w-md px-4 py-2 rounded-2xl">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-xs text-white/60">
                                {typingUsers.length === 1 ? "Someone is typing..." : `${typingUsers.length} people are typing...`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex-shrink-0">
                  {isUserMember ? (
                    <div className="space-y-3">
                      {/* Hidden file input */}
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        className="hidden"
                        accept="*/*"
                      />
                      
                      <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                        <div className="flex-1 flex items-end space-x-2">
                          <Button
                            type="button"
                            onClick={handleFileButtonClick}
                            disabled={isUploadingFile || !isConnected}
                            className="glass-button cursor-pointer shrink-0 p-2.5"
                          >
                            {isUploadingFile ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Paperclip className="w-4 h-4" />
                            )}
                          </Button>
                          <textarea
                            value={newMessage}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            disabled={isSending || !isConnected}
                            className="glass-input flex-1 resize-none min-h-[2.5rem] max-h-32 overflow-y-auto px-4 py-3 rounded-xl"
                            ref={messageInputRef}
                            rows={1}
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={!newMessage.trim() || isSending || !isConnected}
                          className="glass-button cursor-pointer shrink-0"
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-white/70">You need to be a member to send messages.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4 flex-shrink-0">
                Members ({room.members.length})
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 glass-scrollbar">
                {room.members.map((member, index) => (
                  <MemberCard 
                    key={index} 
                    member={member} 
                    isCreator={typeof room.creator === "string" 
                      ? room.creator === (typeof member === "string" ? member : member._id)
                      : room.creator._id === (typeof member === "string" ? member : member._id)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  currentUserId,
  courseCreatorId
}: { 
  message: Message; 
  currentUserId?: string;
  courseCreatorId?: string;
}) {
  const isOwn = typeof message.from === "string" 
    ? message.from === currentUserId 
    : message.from._id === currentUserId;

  const userName = typeof message.from === "string" 
    ? "Unknown User" 
    : message.from.fullname || "Unknown User";

  // Check if message is from course creator
  const isFromCreator = typeof message.from === "string"
    ? message.from === courseCreatorId
    : message.from._id === courseCreatorId;

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMessageContent = () => {
    if (message.type === "FILE" && message.files && message.files.length > 0) {
      // Handle file message with multiple files
      return (
        <div className="space-y-2">
          {message.files.map((file, index) => {
            const fileName = file.name || "Unknown File";
            const fileUrl = file.url;
            const fileSize = file.size;
            const mimeType = file.mimeType;
            
            const IconComponent = getFileIcon(mimeType || "");
            
            return (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                <IconComponent className="w-6 h-6 text-white/70" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{fileName}</p>
                  {fileSize && (
                    <p className="text-xs text-white/60">{formatFileSize(fileSize)}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(fileUrl, "_blank")}
                    className="text-white/70 hover:text-white hover:bg-white/10 p-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDownload(fileUrl, fileName)}
                    className="text-white/70 hover:text-white hover:bg-white/10 p-1"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (message.type === "MEDIA" && message.media && message.media.length > 0) {
      // Handle media message (images, videos) with multiple files
      return (
        <div className="space-y-2">
          {message.media.map((mediaFile, index) => {
            const mediaUrl = mediaFile.url;
            const mediaType = mediaFile.mimeType;
            
            if (mediaType?.startsWith('image/')) {
              return (
                <img 
                  key={index}
                  src={mediaUrl} 
                  alt={mediaFile.name || "Shared image"}
                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(mediaUrl, "_blank")}
                />
              );
            } else if (mediaType?.startsWith('video/')) {
              return (
                <video 
                  key={index}
                  src={mediaUrl} 
                  controls
                  className="max-w-xs rounded-lg"
                />
              );
            }
            return null;
          })}
          {message.content && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );
    }
    
    // Default text message
    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
        isOwn 
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
          : "bg-white/10 text-white"
      )}>
        {!isOwn && (
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-xs font-medium opacity-80">{userName}</p>
            {isFromCreator && (
              <Crown className="w-3 h-3 text-yellow-400" />
            )}
          </div>
        )}
        {renderMessageContent()}
        <p className={cn(
          "text-xs mt-1 opacity-60",
          isOwn ? "text-blue-100" : "text-white/60"
        )}>
          {moment(message.createdAt).format("HH:mm")}
        </p>
      </div>
    </div>
  );
}

function MemberCard({ 
  member, 
  isCreator 
}: { 
  member: string | any; 
  isCreator: boolean;
}) {
  const memberName = typeof member === "string" ? "Unknown User" : member.fullname || "Unknown User";
  const memberRole = typeof member === "string" ? null : member.role;

  return (
    <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
      <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
        <User className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-white font-medium text-sm truncate">{memberName}</p>
          {isCreator && (
            <Crown className="w-3 h-3 text-yellow-400" />
          )}
        </div>
        {memberRole && (
          <p className="text-white/60 text-xs capitalize">{memberRole}</p>
        )}
      </div>
    </div>
  );
} 