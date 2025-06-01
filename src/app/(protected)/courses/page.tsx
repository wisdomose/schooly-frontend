"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CourseService } from "@/services/course";
import { RegisteredCourseService } from "@/services/registered-course";
import { Course } from "@/services/course/type";
import { RegisteredCourse } from "@/services/registered-course/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Calendar,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Filter,
  Users,
  User,
  Globe,
  Crown,
  CheckCircle,
  Search,
  SortAsc,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import moment from "moment";
import { useState, useMemo, useCallback } from "react";

// Custom hooks for better code organization
const useCourseServices = () => {
  return useMemo(() => ({
    courseService: new CourseService(),
    registeredCourseService: new RegisteredCourseService(),
  }), []);
};

const useCourseStatus = (user: any) => {
  const registeredCourseService = useMemo(() => new RegisteredCourseService(), []);
  
  const { data: allRegisteredCoursesData } = useQuery({
    queryKey: ["all-registered-courses", user?._id],
    queryFn: async () => {
      if (!user?._id) return [];
      const response = await registeredCourseService.findAll({ 
        user: user._id 
      });
      return Array.isArray(response) ? response : (response?.registeredCourses || []);
    },
    enabled: !!user?._id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isUserRegisteredToCourse = useCallback((courseId: string): boolean => {
    return (allRegisteredCoursesData || []).some((rc: RegisteredCourse) => {
      const course = rc.course;
      return typeof course === 'string' ? course === courseId : course?._id === courseId;
    });
  }, [allRegisteredCoursesData]);

  const isUserCreatorOfCourse = useCallback((course: Course): boolean => {
    if (!user) return false;
    const creator = course.creator;
    return typeof creator === 'string' ? creator === user._id : creator?._id === user._id;
  }, [user]);

  return {
    allRegisteredCoursesData,
    isUserRegisteredToCourse,
    isUserCreatorOfCourse,
  };
};

const useCourseData = (user: any, showAllCourses: boolean) => {
  const { courseService, registeredCourseService } = useCourseServices();
  const canCreateCourse = user?.role === "admin" || user?.role === "instructor";
  const isStudent = user?.role === "student";

  // Combined query for better performance
  const { data: courseCounts, isLoading: isCountsLoading } = useQuery({
    queryKey: ["course-counts", user?._id, user?.role],
    queryFn: async () => {
      try {
        const [allCoursesResponse, myCoursesResponse] = await Promise.all([
          courseService.findAll({ page: 1, limit: 100 }),
          isStudent 
            ? registeredCourseService.findAll({ user: user?._id, page: 1, limit: 100 })
            : courseService.findAll({ creator: user?._id, page: 1, limit: 100 })
        ]);

        const totalCourses = allCoursesResponse?.courses?.length || 0;
        let myCourses = 0;

        if (isStudent) {
          const registeredCourses = Array.isArray(myCoursesResponse) 
            ? myCoursesResponse 
            : ((myCoursesResponse as any)?.registeredCourses || []);
          myCourses = registeredCourses.length;
        } else {
          // Type guard for instructor/admin response
          const coursesResponse = myCoursesResponse as { courses?: Course[]; pagination?: any };
          myCourses = coursesResponse?.courses?.length || 0;
        }

        return { total: totalCourses, my: myCourses };
      } catch (error) {
        console.error('Error fetching course counts:', error);
        return { total: 0, my: 0 };
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // Main courses query
  const { data, isLoading, error } = useQuery({
    queryKey: ["courses", user?.role, user?._id, showAllCourses],
    queryFn: async () => {
      try {
        if (isStudent && !showAllCourses) {
          const registeredData = await registeredCourseService.findAll({ 
            page: 1, 
            limit: 20,
            user: user?._id 
          });
          
          const registeredCourses = Array.isArray(registeredData) 
            ? registeredData 
            : ((registeredData as any)?.registeredCourses || []);
          
          const courses = registeredCourses
            .map((rc: RegisteredCourse) => rc.course)
            .filter((course: string | Course | null): course is Course => 
              course !== null && typeof course === 'object' && '_id' in course
            );
          
          return {
            courses,
            pagination: { total: courses.length }
          };
        } else if ((canCreateCourse && !showAllCourses)) {
          return courseService.findAll({ 
            page: 1, 
            limit: 20,
            creator: user?._id
          });
        } else {
          return courseService.findAll({ 
            page: 1, 
            limit: 20
          });
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!user,
    retry: 2,
  });

  return {
    courses: data?.courses || [],
    isLoading,
    error,
    courseCounts: courseCounts || { total: 0, my: 0 },
    isCountsLoading,
  };
};

// Loading skeleton component
const LoadingSkeleton = ({ className, inline = false }: { className?: string; inline?: boolean }) => {
  const Component = inline ? 'span' : 'div';
  return <Component className={cn("animate-pulse bg-white/10 rounded", className)} />;
};

// Filter button component for better reusability
const FilterButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  title, 
  description, 
  count,
  isLoading,
  'aria-label': ariaLabel 
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  title: string;
  description: string;
  count: number;
  isLoading: boolean;
  'aria-label': string;
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    aria-label={ariaLabel}
    className={cn(
      "flex-1 p-4 rounded-xl border glass-border transition-all duration-200 cursor-pointer",
      "hover:bg-white/5 group focus:ring-2 focus:ring-purple-500/50 focus:outline-none",
      active 
        ? "bg-white/10 border-purple-500/50 shadow-lg" 
        : "bg-white/5 border-white/10"
    )}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          active 
            ? "bg-purple-500/20 text-purple-300" 
            : "bg-white/10 text-white/60 group-hover:text-white/80"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className={cn(
            "font-medium transition-colors",
            active ? "text-white" : "text-white/80 group-hover:text-white"
          )}>
            {isLoading ? (
              <LoadingSkeleton className="h-4 w-24" inline />
            ) : (
              `${title} (${count})`
            )}
          </p>
          <p className={cn(
            "text-sm transition-colors",
            active ? "text-white/70" : "text-white/50 group-hover:text-white/70"
          )}>
            {description}
          </p>
        </div>
      </div>
      {active && (
        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
      )}
    </div>
  </button>
);

export default function CoursesPage() {
  const { user } = useAppStore();
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const canCreateCourse = user?.role === "admin" || user?.role === "instructor";
  const isStudent = user?.role === "student";

  const { courses, isLoading, error, courseCounts, isCountsLoading } = useCourseData(user, showAllCourses);
  const { isUserRegisteredToCourse, isUserCreatorOfCourse } = useCourseStatus(user);

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    const searchLower = searchTerm.toLowerCase();
    return courses.filter((course: Course) => 
      course.title.toLowerCase().includes(searchLower) ||
      course.desc.toLowerCase().includes(searchLower)
    );
  }, [courses, searchTerm]);

  const getFilterLabels = useCallback(() => {
    if (isStudent) {
      return {
        my: "My Courses",
        all: "All Courses",
        myDesc: "Courses you're enrolled in",
        allDesc: "Browse all available courses"
      };
    } else {
      return {
        my: "My Courses",
        all: "All Courses", 
        myDesc: "Courses you've created",
        allDesc: "All courses in the system"
      };
    }
  }, [isStudent]);

  const filterLabels = getFilterLabels();

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-red-400 mb-4">
              <BookOpen className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Error Loading Courses</h2>
              <p className="text-white/70 mt-2">Please try refreshing the page</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Courses</h1>
                <p className="text-white/70">
                  Manage and explore your learning journey
                </p>
              </div>
            </div>
            {canCreateCourse && (
              <Button asChild className="glass-button cursor-pointer focus:ring-2 focus:ring-purple-500/50">
                <Link href={routes.createCourse()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Link>
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors"
                aria-label="Search courses"
              />
            </div>
          </div>

          {/* Filter Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-white/70">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">View</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <FilterButton
                active={!showAllCourses}
                onClick={() => setShowAllCourses(false)}
                icon={User}
                title={filterLabels.my}
                description={filterLabels.myDesc}
                count={courseCounts.my}
                isLoading={isCountsLoading}
                aria-label={`Filter to show ${filterLabels.my}`}
              />

              <FilterButton
                active={showAllCourses}
                onClick={() => setShowAllCourses(true)}
                icon={Globe}
                title={filterLabels.all}
                description={filterLabels.allDesc}
                count={courseCounts.total}
                isLoading={isCountsLoading}
                aria-label={`Filter to show ${filterLabels.all}`}
              />
            </div>

            {/* Active Filter Indicator */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-white/60">
                <span>Showing:</span>
                {isCountsLoading ? (
                  <LoadingSkeleton className="h-4 w-20" />
                ) : (
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    showAllCourses 
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  )}>
                    {showAllCourses 
                      ? `${filterLabels.all} (${courseCounts.total})`
                      : `${filterLabels.my} (${courseCounts.my})`
                    }
                  </span>
                )}
              </div>
              <div className="text-white/40">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl p-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-card rounded-xl p-6 space-y-4">
                    <LoadingSkeleton className="h-40 w-full rounded-lg" />
                    <LoadingSkeleton className="h-6 w-3/4" />
                    <LoadingSkeleton className="h-4 w-full" />
                    <LoadingSkeleton className="h-4 w-2/3" />
                    <div className="flex justify-between">
                      <LoadingSkeleton className="h-8 w-16" />
                      <LoadingSkeleton className="h-8 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <EmptyState 
              showAllCourses={showAllCourses}
              isStudent={isStudent}
              canCreateCourse={canCreateCourse}
              searchTerm={searchTerm}
              onClearSearch={() => setSearchTerm("")}
              onShowAllCourses={() => setShowAllCourses(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course: Course) => (
                <CourseCard 
                  key={course._id} 
                  course={course} 
                  canEdit={canCreateCourse}
                  isFiltered={!showAllCourses}
                  isUserCreator={isUserCreatorOfCourse(course)}
                  isUserRegistered={isUserRegisteredToCourse(course._id)}
                  showStatusIndicators={showAllCourses}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ 
  showAllCourses, 
  isStudent, 
  canCreateCourse, 
  searchTerm,
  onClearSearch,
  onShowAllCourses
}: {
  showAllCourses: boolean;
  isStudent: boolean;
  canCreateCourse: boolean;
  searchTerm: string;
  onClearSearch: () => void;
  onShowAllCourses: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="p-4 rounded-full bg-white/5 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-white/60" />
      </div>
      
      {searchTerm ? (
        <>
          <h3 className="text-lg font-semibold text-white mb-2">
            No courses found for &quot;{searchTerm}&quot;
          </h3>
          <p className="text-white/70 mb-4">
            Try adjusting your search terms or browse all courses
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onClearSearch}
              variant="ghost"
              className="glass-button cursor-pointer"
            >
              Clear Search
            </Button>
            {!showAllCourses && (
              <Button
                onClick={onShowAllCourses}
                variant="ghost"
                className="glass-button cursor-pointer"
              >
                <Globe className="w-4 h-4 mr-2" />
                Browse All Courses
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-white mb-2">
            {showAllCourses ? "No courses available" : "No courses yet"}
          </h3>
          <p className="text-white/70 mb-4">
            {isStudent 
              ? (showAllCourses 
                  ? "No courses are available at the moment" 
                  : "You haven&apos;t registered for any courses yet"
                )
              : (showAllCourses 
                  ? "No courses have been created yet" 
                  : "Get started by creating your first course"
                )
            }
          </p>
          {!showAllCourses && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canCreateCourse && (
                <Button asChild className="glass-button cursor-pointer">
                  <Link href={routes.createCourse()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Course
                  </Link>
                </Button>
              )}
              <Button
                onClick={onShowAllCourses}
                variant="ghost"
                className="glass-button cursor-pointer"
              >
                <Globe className="w-4 h-4 mr-2" />
                {isStudent ? "Browse Available Courses" : "View All Courses"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CourseCard({ 
  course, 
  canEdit,
  isFiltered,
  isUserCreator,
  isUserRegistered,
  showStatusIndicators
}: { 
  course: Course; 
  canEdit: boolean;
  isFiltered: boolean;
  isUserCreator: boolean;
  isUserRegistered: boolean;
  showStatusIndicators: boolean;
}) {
  const { user } = useAppStore();
  
  // Check if current user is the creator of this specific course
  const isCreator = user && (
    (typeof course.creator === "string" && course.creator === user._id) ||
    (typeof course.creator === "object" && course.creator._id === user._id)
  );

  return (
    <div className="glass-card rounded-xl p-6 hover:shadow-lg transition-all duration-200 group relative focus-within:ring-2 focus-within:ring-purple-500/50">
      {/* Status Indicators */}
      {showStatusIndicators && (
        <div className="absolute top-3 right-3 flex space-x-2 z-10">
          {isUserCreator && (
            <div 
              className="flex items-center space-x-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-sm"
              aria-label="You created this course"
            >
              <Crown className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-300 font-medium">Creator</span>
            </div>
          )}
          {isUserRegistered && !isUserCreator && (
            <div 
              className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm"
              aria-label="You are enrolled in this course"
            >
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-300 font-medium">Enrolled</span>
            </div>
          )}
        </div>
      )}

      {/* Course Cover */}
      {course.cover && (
        <div className="relative mb-4 rounded-lg overflow-hidden">
          <Image
            src={course.cover.url}
            alt={course.title}
            width={400}
            height={160}
            className="w-full h-40 object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Course Info */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white line-clamp-2 pr-20 group-hover:text-purple-200 transition-colors">
          {course.title}
        </h3>
        
        <p className="text-white/70 text-sm line-clamp-3">
          {course.desc}
        </p>

        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{moment(course.createdAt).format("MMM DD, YYYY")}</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.files?.length || 0} files</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 focus:ring-2 focus:ring-purple-500/50">
            <Link href={routes.courseDetails(course._id)}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </Link>
          </Button>
          
          {isCreator && (
            <div className="flex space-x-2">
              <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 focus:ring-2 focus:ring-purple-500/50" aria-label={`Edit ${course.title}`}>
                <Link href={routes.courseEdit(course._id)}>
                  <Edit className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:ring-2 focus:ring-red-500/50"
                aria-label={`Delete ${course.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 