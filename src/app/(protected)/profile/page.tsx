"use client";
import useAppStore from "@/state";
import {
  CalendarIcon,
  Loader2Icon,
  LockIcon,
  User2Icon,
  MailIcon,
  UserIcon,
  Eye,
  EyeOff,
  SaveIcon,
  KeyIcon,
} from "lucide-react";
import {
  Form,
  FormMessage,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import UserService from "@/services/user/user";
import { User } from "@/services/user/type";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";

export default function ProfilePage() {
  const { user, setUser } = useAppStore((s) => s);
  const repo = new UserService();

  const formSchema = z.object({
    email: z.string({ required_error: "Email is required" }).email(),
    fullname: z.string({ required_error: "Fullname is required" }).min(2, {
      message: "Fullname must be at least 2 characters.",
    }),
    gender: z.enum(["male", "female"], {
      required_error: "Gender is required",
    }),
    dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      fullname: "",
      gender: undefined,
      dateOfBirth: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: (
      user: Partial<Pick<User, "email" | "fullname" | "gender" | "dateOfBirth">>
    ) => repo.update(user),
    onSuccess: (data) => {
      setUser(data);
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate({
      email: values.email,
      fullname: values.fullname,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
    });
  }

  useEffect(() => {
    if (!user) return;
    form.setValue("email", user?.email ?? "");
    form.setValue("fullname", user?.fullname ?? "");
    form.setValue("gender", user?.gender ?? "");
    form.setValue("dateOfBirth", new Date(user?.dateOfBirth) ?? "");
  }, [user]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold glass-text mb-2 cursor-default">
          Profile Settings
        </h1>
        <p className="glass-text-muted cursor-default">
          Manage your account information and preferences
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Profile Information Form */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center">
              <User2Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold glass-text cursor-default">
                Personal Information
              </h2>
              <p className="text-sm glass-text-muted cursor-default">
                Update your profile details
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium glass-text cursor-default">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3.5 h-4 w-4 glass-text-subtle pointer-events-none" />
                        <Input
                          {...field}
                          placeholder="Enter your full name"
                          className={`pl-10 h-12 glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 ${
                            mutation.isPending
                              ? "cursor-not-allowed"
                              : "cursor-text"
                          }`}
                          disabled={mutation.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="glass-text-muted cursor-default" />
                  </FormItem>
                )}
              />

              {/* Email */}
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
                        <MailIcon className="absolute left-3 top-3.5 h-4 w-4 glass-text-subtle pointer-events-none" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email address"
                          className={`pl-10 h-12 glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 ${
                            mutation.isPending
                              ? "cursor-not-allowed"
                              : "cursor-text"
                          }`}
                          disabled={mutation.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="glass-text-muted cursor-default" />
                  </FormItem>
                )}
              />

              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium glass-text cursor-default">
                      Gender
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={mutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={`w-full h-12 glass-input rounded-xl border-0 glass-text ${
                            mutation.isPending
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          <SelectValue
                            placeholder="Select gender"
                            className="glass-text-muted"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-select-content border-0">
                        <SelectItem
                          value="male"
                          className="glass-select-item cursor-pointer"
                        >
                          Male
                        </SelectItem>
                        <SelectItem
                          value="female"
                          className="glass-select-item cursor-pointer"
                        >
                          Female
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="glass-text-muted cursor-default" />
                  </FormItem>
                )}
              />

              {/* Date of Birth */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium glass-text cursor-default">
                      Date of Birth
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-12 glass-input rounded-xl border-0 glass-text text-left font-normal justify-start",
                              !field.value && "glass-text-muted",
                              mutation.isPending
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            )}
                            disabled={mutation.isPending}
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
                    <FormDescription className="text-sm glass-text-muted cursor-default">
                      Your date of birth is used to calculate your age.
                    </FormDescription>
                    <FormMessage className="glass-text-muted cursor-default" />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  className={`w-full glass-button h-12 rounded-xl text-white font-semibold transition-all duration-200 border-0 ${
                    mutation.isPending ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
                      Updating Profile...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="w-4 h-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Password Update Form */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl h-fit">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}

function UpdatePasswordForm() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const repo = new UserService();

  const formSchema = z
    .object({
      "new-password": z
        .string({ required_error: "New password is required" })
        .min(6, {
          message: "Password must be at least 6 characters.",
        }),
      "confirm-password": z.string({
        required_error: "Confirm password is required",
      }),
    })
    .superRefine((data, ctx) => {
      if (data["new-password"] !== data["confirm-password"]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
          path: ["new-password"],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
          path: ["confirm-password"],
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "new-password": "",
      "confirm-password": "",
    },
  });

  const mutation = useMutation({
    mutationFn: (password: string) => repo.updatePassword(password),
    onSuccess: (data) => {
      form.reset();
      toast.success("Password updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values["new-password"]);
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center">
          <LockIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold glass-text cursor-default">
            Password Security
          </h2>
          <p className="text-sm glass-text-muted cursor-default">
            Update your password
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* New Password */}
          <FormField
            control={form.control}
            name="new-password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium glass-text cursor-default">
                  New Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <KeyIcon className="absolute left-3 top-3.5 h-4 w-4 glass-text-subtle pointer-events-none" />
                    <Input
                      {...field}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className={`pl-10 pr-12 h-12 glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 ${
                        mutation.isPending
                          ? "cursor-not-allowed"
                          : "cursor-text"
                      }`}
                      disabled={mutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-3 top-3.5 glass-text-subtle hover:glass-text transition-colors ${
                        mutation.isPending
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      disabled={mutation.isPending}
                    >
                      {showNewPassword ? (
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

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirm-password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium glass-text cursor-default">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-3.5 h-4 w-4 glass-text-subtle pointer-events-none" />
                    <Input
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className={`pl-10 pr-12 h-12 glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 ${
                        mutation.isPending
                          ? "cursor-not-allowed"
                          : "cursor-text"
                      }`}
                      disabled={mutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className={`absolute right-3 top-3.5 glass-text-subtle hover:glass-text transition-colors ${
                        mutation.isPending
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      disabled={mutation.isPending}
                    >
                      {showConfirmPassword ? (
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
                mutation.isPending ? "cursor-not-allowed" : "cursor-pointer"
              }`}
              disabled={mutation.isPending || !form.formState.isValid}
            >
              {mutation.isPending ? (
                <>
                  <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
                  Updating Password...
                </>
              ) : (
                <>
                  <KeyIcon className="w-4 h-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
