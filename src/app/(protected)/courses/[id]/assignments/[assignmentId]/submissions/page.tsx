"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  Users,
  FileText,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Loader2,
  User,
  GraduationCap,
  Star,
  File,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import moment from "moment";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const { user } = useAppStore();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;
  
  const assignmentService = new AssignmentService();
  const submissionService = new SubmissionService();

  // Fetch assignment details
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => assignmentService.findOne(assignmentId),
    refetchOnWindowFocus: false,
  });

  // Fetch submissions for this assignment
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["assignmentSubmissions", assignmentId],
    queryFn: () => assignmentService.getSubmissions(assignmentId),
    refetchOnWindowFocus: false,
    enabled: !!assignmentId,
  });

  const isInstructor = user?.role === "instructor" || user?.role === "admin";
  const submissions = submissionsData?.submissions || [];

  // Check if user can view submissions
  if (!isInstructor) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
              <p className="text-white/70 mb-4">
                You don&apos;t have permission to view assignment submissions.
              </p>
              <Link href={routes.assignmentDetails(courseId, assignmentId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingAssignment || isLoadingSubmissions) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading submissions...</p>
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
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Assignment Not Found</h3>
              <p className="text-white/70 mb-4">
                The assignment you&apos;re looking for doesn&apos;t exist.
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

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter(s => s.status === "graded").length;
  const pendingSubmissions = submissions.filter(s => s.status === "submitted").length;
  const averageGrade = gradedSubmissions > 0 
    ? submissions
        .filter(s => s.status === "graded" && s.grade !== undefined)
        .reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions
    : 0;

  // Calculate due date and time remaining
  const currentDate = moment();
  const dueDate = moment(assignment.dueDate);
  const isOverdue = currentDate.isAfter(dueDate);
  const timeRemaining = dueDate.from(currentDate, true);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={routes.assignmentDetails(courseId, assignmentId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Assignment Info */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Assignment Submissions</h1>
              <p className="text-white/70 mt-1">{assignment.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-white">{totalSubmissions}</div>
              <div className="text-white/70 text-sm">Total Submissions</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{gradedSubmissions}</div>
              <div className="text-white/70 text-sm">Graded</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{pendingSubmissions}</div>
              <div className="text-white/70 text-sm">Pending Review</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {averageGrade > 0 ? averageGrade.toFixed(1) : "N/A"}
              </div>
              <div className="text-white/70 text-sm">Average Grade</div>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-2">{assignment.title}</h2>
              <p className="text-white/70 mb-4">{assignment.description}</p>
              
              {assignment.instructions && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Instructions</h3>
                  <div className="text-white/80 whitespace-pre-wrap">{assignment.instructions}</div>
                </div>
              )}

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
              <div className={cn(
                "text-sm mt-1",
                isOverdue ? "text-red-400" : "text-green-400"
              )}>
                {isOverdue ? "Overdue" : timeRemaining}
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Student Submissions ({totalSubmissions})
          </h2>
          
          {totalSubmissions === 0 ? (
            <div className="text-center py-12">
              <div className="p-6 rounded-full bg-white/5 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <ClipboardList className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">No Submissions Yet</h3>
              <p className="text-white/70 text-lg max-w-md mx-auto">
                No students have submitted this assignment yet. Submissions will appear here once students start submitting their work.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/80">Student</TableHead>
                    <TableHead className="text-white/80">Submitted</TableHead>
                    <TableHead className="text-white/80">Status</TableHead>
                    <TableHead className="text-white/80">Grade</TableHead>
                    <TableHead className="text-white/80">Attachments</TableHead>
                    <TableHead className="text-white/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <SubmissionRow
                      key={submission._id}
                      submission={submission}
                      courseId={courseId}
                      assignmentId={assignmentId}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionRow({ 
  submission, 
  courseId, 
  assignmentId 
}: { 
  submission: Submission; 
  courseId: string; 
  assignmentId: string;
}) {
  const user = typeof submission.submittedBy === 'object' ? submission.submittedBy : null;
  
  const getStatusBadge = () => {
    switch (submission.status) {
      case "graded":
        return { text: "Graded", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      case "returned":
        return { text: "Returned", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
      default:
        return { text: "Submitted", color: "bg-green-500/20 text-green-400 border-green-500/30" };
    }
  };

  const badge = getStatusBadge();

  return (
    <TableRow className="border-white/10 hover:bg-white/5">
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-white font-medium">
              {user?.fullname || "Unknown Student"}
            </div>
            <div className="text-white/60 text-sm">
              {user?.email || ""}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-white/70">
          {submission.submittedAt 
            ? moment(submission.submittedAt).format("MMM DD, HH:mm")
            : "—"
          }
        </div>
      </TableCell>
      <TableCell>
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium border",
          badge.color
        )}>
          {badge.text}
        </span>
      </TableCell>
      <TableCell>
        <div className="text-white font-medium">
          {submission.grade !== undefined ? (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>{submission.grade}</span>
            </div>
          ) : (
            <span className="text-white/50">Not graded</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-white/70">
          {Array.isArray(submission.attachments) ? submission.attachments.length : 0} files
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Link href={routes.submissionDetails(courseId, assignmentId, submission._id)}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          </Link>
          {submission.status !== "graded" && (
            <Link href={routes.gradeSubmission(courseId, assignmentId, submission._id)}>
              <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                <GraduationCap className="w-4 h-4 mr-1" />
                Grade
              </Button>
            </Link>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
} 