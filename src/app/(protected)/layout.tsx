"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import SplashScreen from "@/components/splashscreen";
import ProtectedNavbar from "./components/protected-navbar";
import NotificationProvider from "@/services/notification/store";
import MessageProvider from "@/services/message/store";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { accessToken, user } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!accessToken || !user) {
      // Redirect to login if not authenticated
      router.push(routes.login());
      return;
    }
    
    // User is authenticated, stop loading
    setIsLoading(false);
  }, [accessToken, user, router]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <SplashScreen />;
  }

  // If no access token, don't render anything (will redirect)
  if (!accessToken || !user) {
    return null;
  }

  return (
    <NotificationProvider>
      <MessageProvider>
        <div className="min-h-screen glass-background">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div
              className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
              style={{ animationDelay: "1000ms" }}
            ></div>
            <div className="blur-orb-1"></div>
          </div>

          <ProtectedNavbar />
          <main className="pt-16 relative z-10">
            {children}
          </main>
        </div>
      </MessageProvider>
    </NotificationProvider>
  );
} 