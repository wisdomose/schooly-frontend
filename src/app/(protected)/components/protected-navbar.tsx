"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Home,
  BookOpen,
  Users,
  Calendar,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import useAppStore from "@/state";
import { routes, getNavigationItems } from "@/data/routes";
import { useNotification } from "@/services/notification/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProtectedNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAppStore();
  const { unread } = useNotification();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push(routes.login());
  };

  // Get navigation items based on user role
  const navigationItems = useMemo(() => {
    if (!user?.role) return [];
    
    const navItems = getNavigationItems(user.role);
    
    // Filter out dashboard and schedule items
    const filteredItems = navItems.filter(item => 
      item.key !== 'dashboard' && item.key !== 'schedule'
    );
    
    // Map navigation items to include icons
    return filteredItems.map(item => {
      let icon;
      switch (item.key) {
        case 'courses':
          icon = BookOpen;
          break;
        case 'students':
          icon = Users;
          break;
        default:
          icon = Home;
      }
      
      return {
        name: item.page.name,
        href: item.page.path,
        icon: icon,
      };
    });
  }, [user?.role]);

  // Add rooms navigation item for all users
  const allNavigationItems = useMemo(() => {
    const items = [...navigationItems];
    
    // Add rooms for all authenticated users
    if (user) {
      items.push({
        name: "Rooms",
        href: routes.rooms(),
        icon: MessageCircle,
      });
    }
    
    return items;
  }, [navigationItems, user]);

  const getUserInitials = (fullname: string) => {
    return fullname
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "instructor":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "student":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-0 border-b glass-border backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center cursor-pointer" onClick={() => router.push(routes.profile())}>
            <div className="flex-shrink-0 flex items-center gap-3">
              {/* <Image
                src="/aju.jpg"
                alt="Schooly"
                width={150}
                height={40}
                className="object-contain rounded-lg"
              /> */}
              <div className="">
                <h1 className="text-lg font-bold text-white sm:hidden">AJU</h1>
                <h1 className="text-lg font-bold text-white hidden sm:block">Arthur Jarvis University</h1>
                <p className="text-xs text-white/70">Student Portal</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              {allNavigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="text-white/90 hover:text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/10 cursor-pointer"
                    onClick={() => router.push(item.href)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white/90 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer relative"
              onClick={() => router.push(routes.notification())}
            >
              <Bell className="w-5 h-5" />
              {unread && unread > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </span>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 text-white/90 hover:text-white rounded-xl p-0 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                >
                  <Avatar className="w-8 h-8 border-2 border-white/20">
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
                      {user?.fullname ? getUserInitials(user.fullname) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  {/* <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">
                      {user?.fullname || "User"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 ${getRoleColor(user?.role || "student")}`}
                      >
                        {user?.role || "Student"}
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/70" /> */}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 glass-select-content border-0 shadow-2xl rounded-xl backdrop-blur-xl"
                align="end"
              >
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 border-2 border-white/20">
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold">
                        {user?.fullname ? getUserInitials(user.fullname) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium glass-text truncate">{user?.fullname}</p>
                      <p className="text-sm glass-text-muted truncate">{user?.email}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs mt-1 ${getRoleColor(user?.role || "student")}`}
                      >
                        {user?.role || "Student"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                <DropdownMenuItem
                    className="cursor-pointer !text-red-400 hover:!text-red-400 focus:bg-white/5 rounded-lg px-3 py-2 transition-all duration-200 group"
                  onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4 mr-3 !text-red-400 hover:!text-red-400 transition-colors duration-200" />
                  Sign Out
                </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/90 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t glass-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {allNavigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="w-full justify-start text-white/90 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      router.push(item.href);
                      setIsMenuOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Button>
                );
              })}
            </div>
            <div className="border-t glass-border px-2 py-3">
              <div className="flex items-center space-x-3 px-3 py-2">
                <Avatar className="w-10 h-10 border-2 glass-border">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold">
                    {user?.fullname ? getUserInitials(user.fullname) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {user?.fullname || "User"}
                  </p>
                  <p className="text-xs text-white/70">{user?.email}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs mt-1 ${getRoleColor(user?.role || "student")}`}
                  >
                    {user?.role || "Student"}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-3 text-red-400" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 