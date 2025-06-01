"use client";

import useAppStore from "@/state";
import { useEffect } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setAccessToken, setUser } = useAppStore();

  useEffect(() => {
    // Get auth data from localStorage
    const authData = localStorage.getItem("auth");
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state.accessToken) {
          setAccessToken(state.accessToken);
        }
        if (state.user) {
          setUser(state.user);
        }
      } catch (error) {
        console.error("Error parsing auth data:", error);
      }
    }
  }, [setAccessToken, setUser]);

  return <>{children}</>;
} 