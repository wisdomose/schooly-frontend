"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import UserService from "@/services/user/user";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { LoginUser } from "@/services/user/type";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { setAccessToken, setUser } = useAppStore();
  const userService = new UserService();
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: LoginUser) => userService.login(data),
    onSuccess: (response) => {
      if (response) {
        // Update auth state
        setAccessToken(response.accessToken);
        setUser(response.user);
        
        // Show success toast
        toast.success("Login successful!", {
          description: `Welcome back, ${response.user.fullname}!`,
        });
        
        // Redirect to profile page
        router.push(routes.profile());
      }
    },
    onError: (error) => {
      // Show error toast
      toast.error("Login failed", {
        description: error.message || "Please check your credentials and try again.",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    const loginData: LoginUser = {
      email: data.email,
      password: data.password,
    };
    
    mutation.mutate(loginData);
  };

  const isLoading = mutation.isPending;

  return (
    <div className="min-h-screen glass-background flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
          style={{ animationDelay: "1000ms" }}
        ></div>
        <div className="blur-orb-1"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Glassmorphism card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex items-center justify-center cursor-default">
              <Image
                src="/aju.jpg"
                alt="Schooly"
                width={150}
                height={150}
                className="object-contain rounded-lg"
              />
            </div>
            <h1 className="text-3xl font-bold glass-text mb-2 cursor-default">
              Welcome Back
            </h1>
            <p className="glass-text-muted cursor-default">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Input */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium glass-text cursor-default">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 glass-text-subtle pointer-events-none" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email address"
                          className={`pl-10 h-12 glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 ${
                            isLoading ? 'cursor-not-allowed' : 'cursor-text'
                          }`}
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="glass-text-muted cursor-default" />
                  </FormItem>
                )}
              />
              
              {/* Password Input */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium glass-text cursor-default">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 glass-text-subtle pointer-events-none" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className={`pl-10 pr-12 h-12 glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 ${
                            isLoading ? 'cursor-not-allowed' : 'cursor-text'
                          }`}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-3 top-3.5 glass-text-subtle hover:glass-text transition-colors ${
                            isLoading ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="glass-text-muted cursor-default" />
                  </FormItem>
                )}
              />
              
              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  className={`w-full glass-button h-12 rounded-xl text-white font-semibold transition-all duration-200 border-0 ${
                    isLoading ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Signup Link */}
              <div className="text-center pt-4">
                <p className="glass-text-muted cursor-default">
                  Don&apos;t have an account?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-purple-400 hover:text-purple-300 cursor-pointer"
                    onClick={() => router.push(routes.signup())}
                  >
                    Sign up here
                  </Button>
                </p>
              </div>
            </form>
          </Form>
        </div>

        {/* Floating elements for extra visual appeal */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-purple-500/20 rounded-full blur-sm pointer-events-none"></div>
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-pink-500/20 rounded-full blur-sm pointer-events-none"></div>
      </div>
    </div>
  );
} 