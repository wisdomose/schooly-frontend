"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn, getFileIcon, formatFileSize } from "@/lib/utils";
import { AssignmentService } from "@/services/assignment";
import { SubmissionService } from "@/services/submission";
import { FileService } from "@/services/file";
import UserService from "@/services/user/user";
import type { Assignment } from "@/services/assignment/type";
import type { Submission, CreateSubmission } from "@/services/submission/type";
import type { User as UserType } from "@/services/user/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  Edit,
  Upload,
  X,
  ClipboardList,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Send,
  File,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import moment from "moment";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

export default function AssignmentDetailsPage() {
  const params = useParams();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;
  
  const assignmentService = new AssignmentService();
  const submissionService = new SubmissionService();
  const fileService = new FileService();
  const userService = new UserService();

  // State for submission form
  const [submissionContent, setSubmissionContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  
  // Group project state
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch assignment details
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => assignmentService.findOne(assignmentId),
    refetchOnWindowFocus: false,
  });

  // Fetch student's submission (if any)
  const { data: submission, isLoading: isLoadingSubmission } = useQuery({
    queryKey: ["submission", assignmentId, user?._id],
    queryFn: () => assignmentService.getStudentSubmission(assignmentId),
    refetchOnWindowFocus: false,
    enabled: !!assignmentId && !!user && user.role === "student",
  });

  // Debug logging to understand the submission structure
  useEffect(() => {
    if (submission) {
      console.log("Submission data:", submission);
      console.log("Assignment is group project:", assignment?.isGroupProject);
      console.log("User ID:", user?._id);
      console.log("Submitted By (type):", typeof submission.submittedBy, submission.submittedBy);
      console.log("Group Members (type):", typeof submission.groupMembers, submission.groupMembers);
    }
  }, [submission, assignment, user]);

  const isInstructor = user?.role === "instructor" || user?.role === "admin";
  
  // Improved hasSubmitted logic for group projects
  const hasSubmitted = useMemo(() => {
    if (!submission) return false;
    
    // For individual assignments, just check if submission exists
    if (!assignment?.isGroupProject) {
      return true;
    }
    
    // For group projects, check if user is either submitter or group member
    const submittedById = typeof submission.submittedBy === 'object' 
      ? submission.submittedBy._id 
      : submission.submittedBy;
    
    // Check if current user is the submitter
    if (submittedById === user?._id) {
      return true;
    }
    
    // Check if current user is in group members
    if (Array.isArray(submission.groupMembers)) {
      return submission.groupMembers.some((member: any) => {
        const memberId = typeof member === 'object' ? member._id : member;
        return memberId === user?._id;
      });
    }
    
    return false;
  }, [submission, assignment?.isGroupProject, user?._id]);

  const now = moment();
  const dueDate = moment(assignment?.dueDate);
  const isOverdue = now.isAfter(dueDate);
  const canSubmit = !hasSubmitted && !isOverdue && assignment?.status === "published" && user?.role === "student";

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Search for students for group projects
  const searchStudents = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log("Searching for students with query:", query);
      const results = await userService.searchStudents(query, courseId);
      console.log("Search results:", results);
      
      // Filter out current user and already selected members
      const filteredResults = results?.filter(
        (u: UserType) => 
          u._id !== user?._id && 
          !selectedGroupMembers.some(member => member._id === u._id)
      ) || [];
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Failed to search students:", error);
      setSearchResults([]);
      toast.error("Failed to search students. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with improved debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout
    const newTimeout = setTimeout(() => {
      searchStudents(value);
    }, 500);
    
    setSearchTimeout(newTimeout);
  };

  const addGroupMember = (student: UserType) => {
    if (selectedGroupMembers.length >= (assignment?.maxGroupSize || 1) - 1) {
      toast.error(`Maximum group size is ${assignment?.maxGroupSize || 1} members`);
      return;
    }
    setSelectedGroupMembers(prev => [...prev, student]);
    setSearchResults([]);
    setSearchQuery("");
  };

  const removeGroupMember = (studentId: string) => {
    setSelectedGroupMembers(prev => prev.filter(member => member._id !== studentId));
  };

  const { mutate: submitAssignment, isPending: isSubmitting } = useMutation({
    mutationFn: (data: CreateSubmission) => submissionService.create(data),
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["submission", assignmentId, user?._id] });
      setSubmitDialogOpen(false);
      setSubmissionContent("");
      setUploadedFiles([]);
      setSelectedGroupMembers([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit assignment");
      setSubmitDialogOpen(false);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map((file) => fileService.upload(file));
      const uploadedFileObjects = await Promise.all(uploadPromises);
      
      const newFiles = uploadedFileObjects.map((fileObj) => ({
        _id: fileObj!.id,
        name: fileObj!.name,
        url: fileObj!.url,
        mimeType: fileObj!.mimeType,
        size: fileObj!.size,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${files.length} file(s) uploaded successfully!`);
    } catch (error) {
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f._id !== fileId));
  };

  const handleSubmit = () => {
    if (!submissionContent.trim() && uploadedFiles.length === 0) {
      toast.error("Please provide content or upload files for your submission");
      return;
    }

    // Validate group project requirements
    if (assignment?.isGroupProject && selectedGroupMembers.length === 0) {
      toast.error("Please add at least one group member for group projects");
      return;
    }

    const submissionData: CreateSubmission = {
      assignment: assignmentId,
      content: submissionContent.trim() || undefined,
      attachments: uploadedFiles.map(f => ({
        url: f.url,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
      })),
      groupMembers: assignment?.isGroupProject ? selectedGroupMembers.map(member => member._id) : undefined,
    };

    submitAssignment(submissionData);
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

  if (isLoadingAssignment || isLoadingSubmission) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading assignment details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Assignment Not Found</h3>
              <p className="text-white/70 mb-4">
                The assignment you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </p>
              <Link href={routes.courseAssignments(courseId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (hasSubmitted) {
      if (submission?.status === "graded") {
        return { text: "Graded", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      }
      return { text: "Submitted", color: "bg-green-500/20 text-green-400 border-green-500/30" };
    }
    if (assignment.status === 'draft') {
      return { text: "Draft", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
    }
    if (assignment.status === 'closed') {
      return { text: "Closed", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    if (isOverdue) {
      if (assignment.isGroupProject) {
        return { text: "Group Overdue", color: "bg-red-500/20 text-red-400 border-red-500/30" };
      }
      return { text: "Overdue", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    
    // For active assignments that haven't been submitted
    if (assignment.isGroupProject) {
      return { text: "Awaiting Group Submission", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    }
    return { text: "Not Submitted", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
  };

  const badge = getStatusBadge();

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={routes.courseAssignments(courseId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              {isInstructor && (
                <>
                  <Link href={routes.editAssignment(courseId, assignmentId)}>
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Assignment
                    </Button>
                  </Link>
                  <Link href={routes.assignmentSubmissions(courseId, assignmentId)}>
                    <Button className="glass-button cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      View Submissions
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-3">{assignment.title}</h1>
              <p className="text-white/70 text-lg mb-4">{assignment.description}</p>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium border ml-4 flex-shrink-0",
              badge.color
            )}>
              {badge.text}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center space-x-3 text-white/70">
              <Calendar className="w-5 h-5" />
              <div>
                <div className="text-sm">Due Date</div>
                <div className="text-white font-medium">
                  {moment(assignment.dueDate).format("MMM DD, YYYY [at] HH:mm")}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-white/70">
              <Clock className="w-5 h-5" />
              <div>
                <div className="text-sm">Time Remaining</div>
                <div className="text-white font-medium">
                  {isOverdue ? "Overdue" : dueDate.fromNow()}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-white/70">
              <Users className="w-5 h-5" />
              <div>
                <div className="text-sm">Type</div>
                <div className="text-white font-medium">
                  {assignment.isGroupProject ? `Group (${assignment.maxGroupSize} max)` : "Individual"}
                </div>
              </div>
            </div>
          </div>

          {assignment.instructions && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/80 whitespace-pre-wrap">{assignment.instructions}</p>
              </div>
            </div>
          )}

          {/* Assignment Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Attachments</h3>
              <div className="space-y-2">
                {assignment.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 glass-card rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                        <File className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-white/60 text-sm">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Student Submission Section */}
        {user?.role === "student" && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Your Submission</h2>
            
            {hasSubmitted ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-green-400 font-medium">Assignment Submitted</p>
                      <p className="text-white/70 text-sm">
                        Submitted on {moment(submission?.submittedAt).format("MMM DD, YYYY [at] HH:mm")}
                      </p>
                    </div>
                  </div>
                  {submission?.status === "graded" && (
                    <div className="text-right">
                      <p className="text-white font-medium">Grade: {submission.grade || "N/A"}</p>
                      {submission.feedback && (
                        <p className="text-white/70 text-sm">Feedback available</p>
                      )}
                    </div>
                  )}
                </div>

                {submission?.content && (
                  <div>
                    <h4 className="text-white font-medium mb-2">Submission Content</h4>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/80 whitespace-pre-wrap">{submission.content}</p>
                    </div>
                  </div>
                )}

                {/* Display Group Members for Group Projects */}
                {assignment?.isGroupProject && submission?.groupMembers && Array.isArray(submission.groupMembers) && submission.groupMembers.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-2">Group Members</h4>
                    <div className="space-y-2">
                      {/* Show current user as group leader */}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {typeof submission.submittedBy === 'object' 
                                ? submission.submittedBy.fullname 
                                : user?.fullname}
                            </p>
                            <p className="text-white/60 text-sm">
                              {typeof submission.submittedBy === 'object' 
                                ? submission.submittedBy.email 
                                : user?.email} • Group Leader
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Show other group members */}
                      {submission.groupMembers.map((member: any, index: number) => {
                        const memberData = typeof member === 'object' ? member : null;
                        if (!memberData) return null;
                        
                        return (
                          <div key={memberData._id || index} className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <User className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{memberData.fullname}</p>
                                <p className="text-white/60 text-sm">{memberData.email}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {submission?.attachments && Array.isArray(submission.attachments) && submission.attachments.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-2">Submitted Files</h4>
                    <div className="space-y-2">
                      {submission.attachments.map((file: any, index: number) => {
                        const IconComponent = getFileIcon(file.mimeType);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <IconComponent className="w-4 h-4 text-white/70" />
                              <span className="text-white text-sm">{file.name}</span>
                              <span className="text-white/50 text-xs">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(file.url, "_blank")}
                                className="text-white/70 hover:bg-white/10"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileDownload(file.url, file.name)}
                                className="text-white/70 hover:bg-white/10"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {submission?.feedback && (
                  <div>
                    <h4 className="text-white font-medium mb-2">Instructor Feedback</h4>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-white/80 whitespace-pre-wrap">{submission.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : canSubmit ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content" className="text-white mb-2 block">
                    Submission Content
                  </Label>
                  <Textarea
                    id="content"
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="Enter your submission content here..."
                    rows={6}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                {/* Group Members Selection for Group Projects */}
                {assignment?.isGroupProject && (
                  <div>
                    <Label className="text-white mb-2 block">
                      Group Members ({selectedGroupMembers.length + 1}/{assignment.maxGroupSize})
                    </Label>
                    <p className="text-white/70 text-sm mb-3">
                      You are automatically included as the group leader. Add other group members below.
                    </p>
                    
                    {/* Current User (Group Leader) */}
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{user?.fullname}</p>
                          <p className="text-white/60 text-sm">{user?.email} • Group Leader</p>
                        </div>
                      </div>
                    </div>

                    {/* Selected Group Members */}
                    {selectedGroupMembers.map((member) => (
                      <div key={member._id} className="bg-white/5 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{member.fullname}</p>
                              <p className="text-white/60 text-sm">{member.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGroupMember(member._id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add Group Member Search */}
                    {selectedGroupMembers.length < (assignment.maxGroupSize - 1) && (
                      <div className="relative">
                        <Input
                          placeholder="Search students by name or email..."
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                        
                        {/* Search Results */}
                        {searchQuery && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {isSearching ? (
                              <div className="p-3 text-center">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm">Searching students...</p>
                              </div>
                            ) : searchResults.length > 0 ? (
                              searchResults.map((student) => (
                                <div
                                  key={student._id}
                                  onClick={() => addGroupMember(student)}
                                  className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                      <User className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="text-gray-900 font-medium">{student.fullname}</p>
                                      <p className="text-gray-600 text-sm">{student.email}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center">
                                <p className="text-gray-600 text-sm">No students found</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedGroupMembers.length >= (assignment.maxGroupSize - 1) && (
                      <p className="text-yellow-400 text-sm mt-2">
                        Maximum group size reached ({assignment.maxGroupSize} members)
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-white mb-2 block">Attachments</Label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="submission-upload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="submission-upload"
                      className={cn(
                        "cursor-pointer inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors",
                        isUploading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{isUploading ? "Uploading..." : "Upload Files"}</span>
                    </label>
                    <p className="text-white/60 text-sm mt-2">
                      Upload your assignment files (documents, images, etc.)
                    </p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file._id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <File className="w-4 h-4 text-white/70" />
                            <span className="text-white text-sm">{file.name}</span>
                            <span className="text-white/50 text-xs">
                              ({(file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file._id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={(!submissionContent.trim() && uploadedFiles.length === 0) || isSubmitting}
                        className="glass-button cursor-pointer"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Assignment
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit Assignment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to submit this assignment? Once submitted, you won&apos;t be able to make changes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Submit
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-white/5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  {isOverdue ? (
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  ) : (
                    <ClipboardList className="w-8 h-8 text-white/60" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {isOverdue ? "Assignment Overdue" : "Submission Not Available"}
                </h3>
                <p className="text-white/70">
                  {isOverdue 
                    ? "The deadline for this assignment has passed."
                    : assignment.status === "draft" 
                      ? "This assignment is still in draft mode."
                      : "This assignment is not available for submission."
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 