"use client";

import { Button } from "@/components/ui/button";
import { cn, getFileIcon, formatFileSize } from "@/lib/utils";
import { AssignmentService } from "@/services/assignment";
import { SubmissionService } from "@/services/submission";
import type { Assignment } from "@/services/assignment/type";
import type { Submission } from "@/services/submission/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  ClipboardList,
  Loader2,
  User,
  GraduationCap,
  Star,
  CheckCircle,
  File,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import moment from "moment";

export default function SubmissionDetailsPage() {
  const params = useParams();
  const { user } = useAppStore();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const submissionId = params.submissionId as string;
  
  const assignmentService = new AssignmentService();
  const submissionService = new SubmissionService();

  // Fetch assignment details
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => assignmentService.findOne(assignmentId),
    refetchOnWindowFocus: false,
  });

  // Fetch submission details
  const { data: submission, isLoading: isLoadingSubmission } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => submissionService.findOne(submissionId),
    refetchOnWindowFocus: false,
  });

  const isInstructor = user?.role === "instructor" || user?.role === "admin";

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
                <p className="text-white/70">Loading submission details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment || !submission) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Submission Not Found</h3>
              <p className="text-white/70 mb-4">
                The submission you&apos;re looking for doesn&apos;t exist.
              </p>
              <Link href={routes.assignmentSubmissions(courseId, assignmentId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Submissions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const student = typeof submission?.submittedBy === 'object' ? submission.submittedBy : null;
  const isGraded = submission?.status === "graded";

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={routes.assignmentSubmissions(courseId, assignmentId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Submissions
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              {isInstructor && submission?.status !== "graded" && (
                <Link href={routes.gradeSubmission(courseId, assignmentId, submissionId)}>
                  <Button className="glass-button cursor-pointer">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Grade Submission
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Submission Info */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Submission Details</h1>
              <p className="text-white/70 mt-1">{assignment.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Student</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {student?.fullname || "Unknown Student"}
                    </div>
                    <div className="text-white/60 text-sm">
                      {student?.email || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Submitted</h3>
                <div className="flex items-center space-x-2 text-white">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {submission?.submittedAt 
                      ? moment(submission.submittedAt).format("MMM DD, YYYY [at] HH:mm")
                      : "Unknown"
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Status</h3>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border",
                  isGraded 
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-green-500/20 text-green-400 border-green-500/30"
                )}>
                  {isGraded ? "Graded" : "Submitted"}
                </span>
              </div>

              {isGraded && submission?.grade !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-1">Grade</h3>
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-medium text-lg">{submission.grade}/100</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submission Content */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6">Submission Content</h2>
          
          {submission?.content ? (
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3">Written Response</h4>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/80 whitespace-pre-wrap">{submission.content}</p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-white/60">No written content provided</p>
              </div>
            </div>
          )}

          {/* Submission Attachments */}
          {Array.isArray(submission?.attachments) && submission.attachments.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-3">Submitted Files ({submission.attachments.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {submission.attachments.map((file: any, index: number) => {
                  const IconComponent = getFileIcon(file.mimeType);
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-200 border border-gray-200"
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
            </div>
          )}
        </div>

        {/* Assignment Info */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-2">{assignment.title}</h2>
              <p className="text-white/70 mb-4">{assignment.description}</p>
              
              {assignment.attachments && assignment.attachments.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Assignment Materials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            
            <div className="text-right ml-6">
              <div className="text-sm text-white/60 mb-1">Due Date</div>
              <div className="text-white font-medium">
                {moment(assignment.dueDate).format("MMM DD, YYYY [at] h:mm A")}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        {isGraded && submission?.feedback && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Instructor Feedback</h2>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-white/80 whitespace-pre-wrap">{submission.feedback}</p>
            </div>
            {submission?.gradedAt && (
              <p className="text-white/60 text-sm mt-3">
                Graded on {moment(submission.gradedAt).format("MMM DD, YYYY [at] HH:mm")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 