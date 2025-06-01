"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Loader2Icon,
  UserIcon,
  MailIcon,
  LockIcon,
  GraduationCapIcon,
  CheckIcon,
  ArrowRightIcon,
  BookOpenIcon,
  UsersIcon,
  AwardIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { CreateUser } from "@/services/user/type";
import useAppStore from "@/state";
import { pages } from "@/data/pages";
import { useRouter } from "next/navigation";
import SplashScreen from "@/components/splashscreen";
import {
  Form,
  FormMessage,
  FormField,
  FormDescription,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserService from "@/services/user/user";
import { useMutation } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function SignupPage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const { accessToken } = useAppStore((s) => s);

  const userService = new UserService();

  const mutation = useMutation({
    mutationFn: (data: CreateUser) => userService.signup(data),
    onSuccess: (data) => {
      setRedirecting(true);
      toast.success("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push(pages.login.path);
      }, 1500);
    },
    onError: (error) => {
      toast.error(
        error.message || "Failed to create account. Please try again."
      );
    },
  });

  const formSchema = z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Please enter a valid email address"),
    fullname: z.string({ required_error: "Full name is required" }).min(2, {
      message: "Full name must be at least 2 characters.",
    }),
    role: z.enum(["student", "instructor", "admin"], {
      required_error: "Role is required",
    }),
    gender: z.enum(["male", "female"], {
      required_error: "Gender is required",
    }),
    dateOfBirth: z.date({ required_error: "Date of birth is required" }),
    password: z.string({ required_error: "Password is required" }).min(6, {
      message: "Password must be at least 6 characters.",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      fullname: "",
      role: "student",
      gender: undefined,
      dateOfBirth: undefined,
      password: "",
    },
  });

  // Calculate form completion progress
  useEffect(() => {
    const values = form.getValues();
    const totalFields = 6;
    const completedFields = Object.values(values).filter(
      (value) => value !== "" && value !== undefined
    ).length;
    setFormProgress((completedFields / totalFields) * 100);
  }, [form.watch()]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  // if logged in, redirect to dashboard page
  useEffect(() => {
    if (accessToken) {
      router.push(pages.profile.path);
    }
  }, [accessToken]);

  if (accessToken) return <SplashScreen />;

  const features = [
    {
      icon: BookOpenIcon,
      title: "Interactive Learning",
      description:
        "Engage with dynamic content and real-time collaboration tools",
    },
    {
      icon: UsersIcon,
      title: "Community Driven",
      description:
        "Connect with peers, instructors, and build lasting academic relationships",
    },
    {
      icon: AwardIcon,
      title: "Track Progress",
      description:
        "Monitor your academic journey with detailed analytics and achievements",
    },
  ];

  const roleDescriptions = {
    student:
      "Access courses, submit assignments, and track your academic progress",
    instructor:
      "Create and manage courses, grade assignments, and mentor students",
    admin:
      "Oversee the entire platform, manage users, and configure system settings",
  };

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
            <div className="mx-auto mb-4 flex items-center justify-center">
              <Image
                src="/aju.jpg"
                alt="Schooly"
                width={150}
                height={150}
                className="object-contain rounded-lg"
              />
            </div>
            <h1 className="text-3xl font-bold glass-text mb-2">
              Create Account
            </h1>
            <p className="glass-text-muted">
              Join us and start your educational journey today
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium glass-text">
                Account Setup Progress
              </span>
              <span className="text-sm glass-text-muted">
                {Math.round(formProgress)}% Complete
              </span>
            </div>
            <div className="w-full glass-input rounded-full h-2 overflow-hidden">
              <div
                className="h-full gradient-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${formProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold glass-text">
                      Personal Information
                    </h3>
                    <p className="text-sm glass-text-muted">
                      Tell us about yourself
                    </p>
                  </div>
                </div>

                {/* Full Name Input */}
                <FormField
                  control={form.control}
                  name="fullname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium glass-text">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3.5 h-4 w-4 glass-text-subtle" />
                          <Input
                            placeholder="Enter your full name"
                            className="pl-10 h-12 glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="glass-text-muted" />
                    </FormItem>
                  )}
                />

                {/* Email Input */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium glass-text">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MailIcon className="absolute left-3 top-3.5 h-4 w-4 glass-text-subtle" />
                          <Input
                            placeholder="Enter your email address"
                            className="pl-10 h-12 glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="glass-text-muted" />
                    </FormItem>
                  )}
                />

                {/* Gender Input */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium glass-text">
                        Gender
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-12 glass-input rounded-xl border-0 glass-text">
                            <SelectValue
                              placeholder="Select gender"
                              className="glass-text-muted"
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-select-content border-0">
                          <SelectItem
                            value="male"
                            className="glass-select-item"
                          >
                            Male
                          </SelectItem>
                          <SelectItem
                            value="female"
                            className="glass-select-item"
                          >
                            Female
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="glass-text-muted" />
                    </FormItem>
                  )}
                />

                {/* Date of Birth Input */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium glass-text">
                        Date of Birth
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full h-12  glass-input rounded-xl border-0 glass-text text-left font-normal",
                                !field.value && "glass-text-muted"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MMM dd, yyyy")
                              ) : (
                                <span className="glass-text-muted">
                                  Select date
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 glass-select-content border-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="glass-text-muted" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Account Setup Section */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold glass-text">Account Setup</h3>
                    <p className="text-sm glass-text-muted">
                      Choose your role and secure your account
                    </p>
                  </div>
                </div>

                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium glass-text">
                        Select Your Role
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-12 glass-input rounded-xl border-0 glass-text">
                            <SelectValue
                              placeholder="Choose your role"
                              className="glass-text-muted"
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-select-content border-0">
                          <SelectItem
                            value="student"
                            className="glass-select-item"
                          >
                            <div className="flex items-center gap-3 py-1">
                              <GraduationCapIcon className="h-4 w-4 text-blue-400" />
                              <div className="text-left">
                                <div className="font-medium">Student</div>
                                <div className="text-xs opacity-70">
                                  Learn and grow with courses
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="instructor"
                            className="glass-select-item"
                          >
                            <div className="flex items-center gap-3 py-1">
                              <BookOpenIcon className="h-4 w-4 text-green-400" />
                              <div className="text-left">
                                <div className="font-medium">Instructor</div>
                                <div className="text-xs opacity-70">
                                  Teach and mentor students
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="admin"
                            className="glass-select-item"
                          >
                            <div className="flex items-center gap-3 py-1">
                              <AwardIcon className="h-4 w-4 text-purple-400" />
                              <div className="text-left">
                                <div className="font-medium">Administrator</div>
                                <div className="text-xs opacity-70">
                                  Manage the platform
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <FormMessage className="glass-text-muted" />
                    </FormItem>
                  )}
                />

                {/* Password Input */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium glass-text">
                        Create Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockIcon className="absolute left-3 top-3.5 h-4 w-4 glass-text-subtle" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a secure password"
                            className="pl-10 pr-12 h-12 glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 glass-text-subtle hover:glass-text transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm glass-text-muted">
                        Must be at least 6 characters long
                      </FormDescription>
                      <FormMessage className="glass-text-muted" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full glass-button h-12 rounded-xl text-white font-semibold transition-all duration-200 border-0"
                  disabled={mutation.isPending || redirecting}
                >
                  {mutation.isPending || redirecting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      {mutation.isPending
                        ? "Creating Account..."
                        : "Redirecting..."}
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="glass-text-muted">
                  Already have an account?{" "}
                  <Button
                    variant="link"
                    asChild
                    className="p-0 h-auto font-medium text-purple-400 hover:text-purple-300"
                  >
                    <Link href={pages.login.path}>Sign in here</Link>
                  </Button>
                </p>
              </div>
            </form>
          </Form>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs glass-text-muted">
            <div className="flex items-center gap-1.5">
              <CheckIcon className="h-3 w-3 text-green-400" />
              Secure & Private
            </div>
            <div className="flex items-center gap-1.5">
              <CheckIcon className="h-3 w-3 text-green-400" />
              GDPR Compliant
            </div>
          </div>
        </div>

        {/* Floating elements for extra visual appeal */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-purple-500/20 rounded-full blur-sm"></div>
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-pink-500/20 rounded-full blur-sm"></div>
      </div>
    </div>
  );
}
