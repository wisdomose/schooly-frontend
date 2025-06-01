"use client";
import { Button } from "@/components/ui/button";
import { EVENTS } from "@/events";
import { cn } from "@/lib/utils";
import NotificationService from "@/services/notification/notification";
import { useNotification } from "@/services/notification/store";
import { Notification, NotificationType } from "@/services/notification/type";
import useAppStore from "@/state";
import { Pagination } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Bell,
  CheckCheck,
  ArrowUp,
  LogIn,
  UserPlus,
  KeyRound,
  BookOpen,
  GraduationCap,
  ClipboardList,
  FileText,
  Calendar,
  CheckCircle,
  Award,
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "sonner";

export default function NotificationPage() {
  const { socket } = useNotification();
  const { user } = useAppStore();
  const [pagination, setPagination] = useState<Pagination | undefined>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const limit = 10;
  const [isReading, setIsReading] = useState(false);

  const service = new NotificationService();

  const { data, isLoading, error } = useQuery({
    queryKey: ["find-all-notifications"],
    queryFn: () => service.findAll({ page: 1, limit }),
    refetchOnWindowFocus: false,
  });

  const { mutate: fetchMore, isPending: isFetchingMore } = useMutation({
    mutationFn: () =>
      service.findAll({
        page: pagination ? pagination.page + 1 : 1,
        limit: pagination?.limit ?? limit,
      }),
    onSuccess: (data) => {
      setNotifications((s) => [...s, ...data.notifications]);
      setPagination(data.pagination);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function scrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  function markAllAsReadHandler() {
    if (!socket || !user) return;
    setIsReading(true);
    socket.emit(EVENTS.NOTIFICATION.READ_ALL);
    setNotifications((s) => [
      ...s.map((s) => {
        s.isRead = true;
        return s;
      }),
    ]);
    setIsReading(false);
  }

  useEffect(() => {
    if (!socket) return;

    socket.on(EVENTS.NOTIFICATION.UPDATE, (notification: Notification) => {
      setNotifications((s) => [notification, ...s]);
    });
  }, [socket]);

  useEffect(() => {
    if (!data) return;
    setNotifications(data.notifications);
    setPagination(data.pagination);
  }, [data]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                <p className="text-white/70">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${
                        unreadCount > 1 ? "s" : ""
                      }`
                    : "All caught up!"}
                </p>
              </div>
            </div>

            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                onClick={markAllAsReadHandler}
                disabled={!socket || !user || isReading}
                className="glass-button curosr-pointer"
              >
                {isReading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCheck className="w-4 h-4 mr-2" />
                )}
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading notifications...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-white/5 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Bell className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-white/70">
                When you have notifications, they&apos;ll appear here.
              </p>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={notifications.length}
              next={fetchMore}
              hasMore={notifications.length < (pagination?.total || 0)}
              loader={
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              }
              endMessage={
                notifications.length > 5 && (
                  <div className="flex items-center justify-center py-6">
                    <Button
                      variant="ghost"
                      onClick={scrollToTop}
                      className="text-white hover:bg-white/10"
                    >
                      <ArrowUp className="w-4 h-4 mr-2" />
                      Back to top
                    </Button>
                  </div>
                )
              }
              className="space-y-3"
            >
              {notifications.map((notification, index) => (
                <NotificationComponent
                  key={notification._id}
                  notification={notification}
                  isFirst={index === 0}
                />
              ))}
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  );
}

const titleMap: Record<NotificationType, string> = {
  [NotificationType.LOGIN]: "Login",
  [NotificationType.SIGNUP]: "Signup",
  [NotificationType.PASSWORD_UPDATED]: "Password updated",
  [NotificationType.NEW_COURSE]: "New course",
  [NotificationType.COURSE_UPDATED]: "Course updated",
  [NotificationType.COURSE_REGISTRATION]: "Course registration",
  [NotificationType.COURSE_COMPLETION]: "Course completion",
  [NotificationType.QUIZ_SUBMISSION]: "Quiz submission",
  [NotificationType.NEW_ASSIGNMENT]: "New assignment",
  [NotificationType.ASSIGNMENT_UPDATED]: "Assignment updated",
  [NotificationType.ASSIGNMENT_DUE_REMINDER]: "Assignment due reminder",
  [NotificationType.SUBMISSION_RECEIVED]: "Submission received",
  [NotificationType.SUBMISSION_GRADED]: "Submission graded",
};

const iconMap: Record<NotificationType, any> = {
  [NotificationType.LOGIN]: LogIn,
  [NotificationType.SIGNUP]: UserPlus,
  [NotificationType.PASSWORD_UPDATED]: KeyRound,
  [NotificationType.NEW_COURSE]: BookOpen,
  [NotificationType.COURSE_UPDATED]: BookOpen,
  [NotificationType.COURSE_REGISTRATION]: GraduationCap,
  [NotificationType.COURSE_COMPLETION]: Award,
  [NotificationType.QUIZ_SUBMISSION]: ClipboardList,
  [NotificationType.NEW_ASSIGNMENT]: FileText,
  [NotificationType.ASSIGNMENT_UPDATED]: FileText,
  [NotificationType.ASSIGNMENT_DUE_REMINDER]: Calendar,
  [NotificationType.SUBMISSION_RECEIVED]: CheckCircle,
  [NotificationType.SUBMISSION_GRADED]: Award,
};

const colorMap: Record<NotificationType, string> = {
  [NotificationType.LOGIN]: "from-blue-500 to-blue-600",
  [NotificationType.SIGNUP]: "from-green-500 to-green-600",
  [NotificationType.PASSWORD_UPDATED]: "from-orange-500 to-orange-600",
  [NotificationType.NEW_COURSE]: "from-purple-500 to-purple-600",
  [NotificationType.COURSE_UPDATED]: "from-purple-500 to-purple-600",
  [NotificationType.COURSE_REGISTRATION]: "from-indigo-500 to-indigo-600",
  [NotificationType.COURSE_COMPLETION]: "from-emerald-500 to-emerald-600",
  [NotificationType.QUIZ_SUBMISSION]: "from-cyan-500 to-cyan-600",
  [NotificationType.NEW_ASSIGNMENT]: "from-rose-500 to-rose-600",
  [NotificationType.ASSIGNMENT_UPDATED]: "from-rose-500 to-rose-600",
  [NotificationType.ASSIGNMENT_DUE_REMINDER]: "from-amber-500 to-amber-600",
  [NotificationType.SUBMISSION_RECEIVED]: "from-teal-500 to-teal-600",
  [NotificationType.SUBMISSION_GRADED]: "from-emerald-500 to-emerald-600",
};

function NotificationComponent({
  notification,
  isFirst,
}: {
  notification: Notification;
  isFirst?: boolean;
}) {
  const message = notification.msg;
  const read = useMemo(() => notification.isRead, [notification.isRead]);
  const Icon = iconMap[notification.type];
  const colorClass = colorMap[notification.type];

  return (
    <div
      className={cn(
        "relative group transition-all duration-200",
        isFirst && !read && "animate-pulse"
      )}
    >
      <div
        className="glass-card rounded-xl p-4 border-l-4 transition-all duration-200 cursor-pointer hover:bg-white/15 hover:shadow-lg"
        style={{
          borderLeftColor: read ? 'rgba(255, 255, 255, 0.2)' : 'rgb(168, 85, 247)'
        }}
      >
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div
            className={cn(
              "p-2 rounded-lg bg-gradient-to-r flex-shrink-0",
              colorClass
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4
                className={cn(
                  "font-semibold text-sm  text-white"
                )}
              >
                {titleMap[notification.type]}
              </h4>
              {!read && (
                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
              )}
            </div>

            <p
              className={cn(
                "text-sm leading-relaxed mb-2  text-white"
              )}
            >
              {message}
            </p>

            <p className="text-xs text-white/80">
              {moment(notification.createdAt).fromNow()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
