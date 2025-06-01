"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getFileIcon, formatFileSize } from "@/lib/utils";
import { CourseService } from "@/services/course";
import { Course } from "@/services/course/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Calendar,
  User,
  FileText,
  Loader2,
  ExternalLink,
  MessageCircle,
  UserPlus,
  CheckCircle,
  FileQuestion,
  MoreHorizontal,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import moment from "moment";
import { toast } from "sonner";
import { useState } from "react";

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const courseService = new CourseService();
  
  // State for dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  
  // Get the course ID from params
  const id = params.id as string;

  const { data: course, isLoading, error } = useQuery({
    queryKey: ["course", id],
    queryFn: () => courseService.findOne(id),
    refetchOnWindowFocus: false,
  });

  // Check registration status for students
  const { data: registrationStatus, isLoading: isCheckingRegistration } = useQuery({
    queryKey: ["courseRegistration", id],
    queryFn: () => courseService.checkRegistrationStatus(id),
    refetchOnWindowFocus: false,
    enabled: !!id && user?.role === "student",
  });

  const { mutate: registerForCourse, isPending: isRegistering } = useMutation({
    mutationFn: () => courseService.register(id),
    onSuccess: () => {
      toast.success("Successfully registered for course!");
      queryClient.invalidateQueries({ queryKey: ["courseRegistration", id] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setRegisterDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to register for course");
      setRegisterDialogOpen(false);
    },
  });

  const { mutate: deleteCourse, isPending: isDeleting } = useMutation({
    mutationFn: () => courseService.delete(id),
    onSuccess: () => {
      toast.success("Course deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.push(routes.courses());
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete course");
      setDeleteDialogOpen(false);
    },
  });

  // Check if current user is the creator of the course
  const canEdit = course && user && (
    (typeof course.creator === "string" && course.creator === user._id) ||
    (typeof course.creator === "object" && course.creator._id === user._id)
  );

  // Check if user can register for the course
  const canRegister = user?.role === "student" && !canEdit && !registrationStatus;
  const isRegistered = !!registrationStatus;
  
  // Check if user can access course content (room and materials)
  const canAccessCourse = canEdit || isRegistered;

  const handleDeleteCourse = () => {
    deleteCourse();
  };

  const handleRegisterForCourse = () => {
    registerForCourse();
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading course details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-white/5 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Course not found
              </h3>
              <p className="text-white/70 mb-4">
                The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </p>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href={routes.courses()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Courses
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href={routes.courses()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Courses
                </Link>
              </Button>
            </div>
            
            {/* Mobile: Dropdown Menu (only for instructors/admins with many options) */}
            {user?.role !== "student" && (
              <div className="flex items-center space-x-2 lg:hidden">
                {/* Actions Dropdown */}
                {(canAccessCourse || canEdit) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm bg-white/5"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-52 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl"
                    >
                      {canAccessCourse && (
                        <>
                          <DropdownMenuItem 
                            className="text-white hover:bg-white/15 cursor-pointer rounded-lg mx-1 my-1 focus:bg-white/15"
                            onClick={() => router.push(routes.courseRoom(id))}
                          >
                            <MessageCircle className="w-4 h-4 mr-3 text-purple-400" />
                            <span className="font-medium text-white">Course Room</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-white hover:bg-white/15 cursor-pointer rounded-lg mx-1 my-1 focus:bg-white/15"
                            onClick={() => router.push(routes.courseQuizzes(id))}
                          >
                            <FileQuestion className="w-4 h-4 mr-3 text-pink-400" />
                            <span className="font-medium text-white">Quizzes</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-white hover:bg-white/15 cursor-pointer rounded-lg mx-1 my-1 focus:bg-white/15"
                            onClick={() => router.push(routes.courseAssignments(id))}
                          >
                            <ClipboardList className="w-4 h-4 mr-3 text-blue-400" />
                            <span className="font-medium text-white">Assignments</span>
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem 
                              className="text-white hover:bg-white/15 cursor-pointer rounded-lg mx-1 my-1 focus:bg-white/15"
                              onClick={() => router.push(routes.courseQuestions(id))}
                            >
                              <FileQuestion className="w-4 h-4 mr-3 text-orange-400" />
                              <span className="font-medium text-white">Questions</span>
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      
                      {canEdit && (
                        <>
                          {canAccessCourse && <DropdownMenuSeparator className="bg-white/20 my-2" />}
                          <DropdownMenuItem 
                            className="text-white hover:bg-white/15 cursor-pointer rounded-lg mx-1 my-1 focus:bg-white/15"
                            onClick={() => router.push(routes.courseEdit(id))}
                          >
                            <Edit className="w-4 h-4 mr-3 text-blue-400" />
                            <span className="font-medium text-white">Edit Course</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-white hover:bg-white/15 cursor-pointer rounded-lg mx-1 my-1 focus:bg-white/15"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-3 text-red-400" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-3 text-red-400" />
                            )}
                            <span className="font-medium text-white">Delete Course</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}

            {/* Mobile: Simple layout for students */}
            {user?.role === "student" && (
              <div className="flex items-center space-x-2 lg:hidden">
                {/* Registration status */}
                {isRegistered && (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Registered</span>
                  </div>
                )}

                {/* Registration button */}
                {canRegister && (
                  <AlertDialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={isRegistering || isCheckingRegistration}
                        size="sm"
                        className="glass-button cursor-pointer"
                      >
                        {isRegistering ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        Register
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Register for Course</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to register for this course? You will gain access to course materials and the course room.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegisterForCourse} disabled={isRegistering}>
                          {isRegistering ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Register
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Course navigation dropdown for registered students */}
                {canAccessCourse && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm bg-white/5"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-52 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl"
                    >
                      <DropdownMenuItem 
                        className="text-white hover:bg-white/15 cursor-pointer rounded-lg mx-1 my-1 focus:bg-white/15"
                        onClick={() => router.push(routes.courseRoom(id))}
                      >
                        <MessageCircle className="w-4 h-4 mr-3 text-purple-400" />
                        <span className="font-medium text-white">Course Room</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-white hover:bg-white/15 cursor-pointer rounded-lg mx-1 my-1 focus:bg-white/15"
                        onClick={() => router.push(routes.courseQuizzes(id))}
                      >
                        <FileQuestion className="w-4 h-4 mr-3 text-pink-400" />
                        <span className="font-medium text-white">Quizzes</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-white hover:bg-white/15 cursor-pointer rounded-lg mx-1 my-1 focus:bg-white/15"
                        onClick={() => router.push(routes.courseAssignments(id))}
                      >
                        <ClipboardList className="w-4 h-4 mr-3 text-blue-400" />
                        <span className="font-medium text-white">Assignments</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}

            {/* Desktop: Horizontal layout (lg and above) */}
            <div className="hidden lg:flex lg:space-x-2">
              {/* Registration button for students */}
              {canRegister && (
                <AlertDialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isRegistering || isCheckingRegistration}
                      className="glass-button cursor-pointer"
                    >
                      {isRegistering ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Register for Course
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Register for Course</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to register for this course? You will gain access to course materials and the course room.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegisterForCourse} disabled={isRegistering}>
                        {isRegistering ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Register
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Registration status for students */}
              {isRegistered && user?.role === "student" && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Registered</span>
                </div>
              )}

              {/* Course Room - only for registered users or course owners */}
              {canAccessCourse && (
                <>
                  <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                    <Link href={routes.courseRoom(id)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Course Room
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                    <Link href={routes.courseQuizzes(id)}>
                      <FileQuestion className="w-4 h-4 mr-2" />
                      Quizzes
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                    <Link href={routes.courseAssignments(id)}>
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Assignments
                    </Link>
                  </Button>
                  {canEdit && (
                    <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                      <Link href={routes.courseQuestions(id)}>
                        <FileQuestion className="w-4 h-4 mr-2" />
                        Questions
                      </Link>
                    </Button>
                  )}
                </>
              )}

              {canEdit && (
                <>
                  <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                    <Link href={routes.courseEdit(id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Course
                    </Link>
                  </Button>
                  <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={isDeleting}
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Delete Course
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Course</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this course? This action cannot be undone and will permanently remove all course data, materials, and associated room discussions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCourse} disabled={isDeleting}>
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Course Cover */}
        {course?.cover && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={course.cover.url}
                alt={course.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
              </div>
            </div>
          </div>
        )}

        {/* Course Information */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          {!course?.cover && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">{course?.title}</h1>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Created</h3>
                <div className="flex items-center space-x-2 text-white">
                  <Calendar className="w-4 h-4" />
                  <span>{course?.createdAt ? moment(course.createdAt).format("MMMM DD, YYYY") : "Unknown"}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Last Updated</h3>
                <div className="flex items-center space-x-2 text-white">
                  <Calendar className="w-4 h-4" />
                  <span>{course?.updatedAt ? moment(course.updatedAt).format("MMMM DD, YYYY") : "Unknown"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Creator</h3>
                <div className="flex items-center space-x-2 text-white">
                  <User className="w-4 h-4" />
                  <span>
                    {typeof course?.creator === "string" 
                      ? "Unknown" 
                      : course?.creator?.fullname || "Unknown"}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Materials</h3>
                <div className="flex items-center space-x-2 text-white">
                  <FileText className="w-4 h-4" />
                  <span>{course?.files?.length || 0} files</span>
                </div>
              </div>

              {/* Registration Status for Students */}
              {user?.role === "student" && (
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-1">Registration Status</h3>
                  <div className="flex items-center space-x-2 text-white">
                    {isCheckingRegistration ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Checking...</span>
                      </>
                    ) : isRegistered ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Registered</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400">Not registered</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
            <p className="text-white/70 leading-relaxed">{course?.desc}</p>
          </div>
        </div>

        {/* Course Materials - only for registered users or course owners */}
        {canAccessCourse ? (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Course Materials ({course?.files?.length || 0})
            </h2>
            
            {!course?.files?.length ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-white/5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white/60" />
                </div>
                <p className="text-white/70">No course materials available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.files.map((file, index) => {
                  const IconComponent = getFileIcon(file.mimeType);
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-200 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-900 font-medium truncate">{file.name}</p>
                            <p className="text-gray-500 text-sm">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, "_blank")}
                            className="text-gray-700 hover:bg-gray-100"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDownload(file.url, file.name)}
                            className="text-gray-700 hover:bg-gray-100"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-white/5 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Course Materials Restricted
              </h3>
              <p className="text-white/70 mb-4">
                You need to register for this course to access the materials.
              </p>
              {canRegister && (
                <AlertDialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isRegistering || isCheckingRegistration}
                      className="glass-button cursor-pointer"
                    >
                      {isRegistering ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Register for Course
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Register for Course</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to register for this course? You will gain access to course materials and the course room.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegisterForCourse} disabled={isRegistering}>
                        {isRegistering ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Register
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone and will permanently remove all course data, materials, and associated room discussions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 