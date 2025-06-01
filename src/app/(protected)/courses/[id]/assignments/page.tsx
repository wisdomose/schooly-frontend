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
  Plus,
  Calendar,
  Clock,
  Users,
  FileText,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Loader2,
  User,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import moment from "moment";

export default function CourseAssignmentsPage() {
  const params = useParams();
  const { user } = useAppStore();
  const courseId = params.id as string;
  
  const assignmentService = new AssignmentService();
  const submissionService = new SubmissionService();

  // Fetch assignments for this course
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ["assignments", courseId],
    queryFn: () => assignmentService.findAll({ course: courseId }),
    refetchOnWindowFocus: false,
  });

  // Fetch student's submissions for this course (only for students)
  const { data: submissionsData } = useQuery({
    queryKey: ["my-submissions", courseId],
    queryFn: () => submissionService.findMySubmissions({ course: courseId }),
    enabled: user?.role === "student",
    refetchOnWindowFocus: false,
  });

  const assignments = assignmentsData?.assignments || [];
  const submissions = submissionsData?.submissions || [];
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  // Create a map of assignment ID to submission for quick lookup
  const submissionMap = submissions.reduce((map, submission) => {
    const assignmentId = typeof submission.assignment === 'string' 
      ? submission.assignment 
      : submission.assignment._id;
    map[assignmentId] = submission;
    return map;
  }, {} as Record<string, Submission>);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading assignments...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={routes.courseDetails(courseId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              {isInstructor && (
                <Link href={routes.createAssignment(courseId)}>
                  <Button className="glass-button cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Course Assignments</h1>
              <p className="text-white/70 mt-1">
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        {assignments.length === 0 ? (
          <div className="glass-card rounded-2xl p-12">
            <div className="text-center">
              <div className="p-6 rounded-full bg-white/5 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <ClipboardList className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">No Assignments Yet</h3>
              <p className="text-white/70 text-lg max-w-md mx-auto mb-6">
                {isInstructor 
                  ? "You haven&apos;t created any assignments for this course yet. Create your first assignment to get started."
                  : "No assignments have been created for this course yet."
                }
              </p>
              {isInstructor && (
                <Link href={routes.createAssignment(courseId)}>
                  <Button className="glass-button cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Assignment
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment._id}
                assignment={assignment}
                courseId={courseId}
                isInstructor={isInstructor}
                submission={submissionMap[assignment._id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssignmentCard({ 
  assignment, 
  courseId, 
  isInstructor,
  submission
}: { 
  assignment: Assignment; 
  courseId: string; 
  isInstructor: boolean;
  submission?: Submission;
}) {
  const now = moment();
  const dueDate = moment(assignment.dueDate);
  const isOverdue = now.isAfter(dueDate);
  const isDueSoon = dueDate.diff(now, 'days') <= 2 && !isOverdue;

  const getStatusBadge = () => {
    if (assignment.status === 'draft') {
      return { text: "Draft", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
    }
    if (assignment.status === 'closed') {
      return { text: "Closed", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    if (isOverdue) {
      return { text: "Overdue", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    if (isDueSoon) {
      return { text: "Due Soon", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    }
    return { text: "Active", color: "bg-green-500/20 text-green-400 border-green-500/30" };
  };

  const getSubmissionStatusBadge = () => {
    if (!submission) return null;
    
    switch (submission.status) {
      case 'submitted':
        return { 
          text: "Submitted", 
          color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          icon: CheckCircle2
        };
      case 'graded':
        return { 
          text: `Graded (${submission.grade}%)`, 
          color: "bg-green-500/20 text-green-400 border-green-500/30",
          icon: CheckCircle2
        };
      case 'returned':
        return { 
          text: "Returned", 
          color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          icon: AlertCircle
        };
      default:
        return null;
    }
  };

  const badge = getStatusBadge();
  const submissionBadge = getSubmissionStatusBadge();

  return (
    <div className="glass-card rounded-xl p-6 hover:bg-white/5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2 hover:text-white/80 transition-colors">
                <Link href={routes.assignmentDetails(courseId, assignment._id)}>
                  {assignment.title}
                </Link>
              </h3>
              <p className="text-white/70 mb-3 line-clamp-2">{assignment.description}</p>
            </div>
            <div className="flex flex-col gap-2 ml-4 flex-shrink-0 items-center">
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium border",
                badge.color
              )}>
                {badge.text}
              </span>
              
              {/* Show submission status for students */}
              {!isInstructor && submissionBadge && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1.5",
                  submissionBadge.color
                )}>
                  <submissionBadge.icon className="w-3.5 h-3.5" />
                  {submissionBadge.text}
                </span>
              )}
              
              {/* Show "Not Submitted" for students who haven't submitted */}
              {!isInstructor && !submission && assignment.status === 'published' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium border bg-gray-500/20 text-gray-400 border-gray-500/30 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Not Submitted
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-white/70">
              <Calendar className="w-4 h-4" />
              <div>
                <div className="text-xs">Due Date</div>
                <div className="text-sm font-medium text-white">
                  {moment(assignment.dueDate).format("MMM DD, YYYY")}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-white/70">
              <Clock className="w-4 h-4" />
              <div>
                <div className="text-xs">Time Left</div>
                <div className="text-sm font-medium text-white">
                  {isOverdue ? "Overdue" : dueDate.fromNow()}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-white/70">
              <Users className="w-4 h-4" />
              <div>
                <div className="text-xs">Type</div>
                <div className="text-sm font-medium text-white">
                  {assignment.isGroupProject ? `Group (${assignment.maxGroupSize} max)` : "Individual"}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-white/70">
              <FileText className="w-4 h-4" />
              <div>
                <div className="text-xs">Attachments</div>
                <div className="text-sm font-medium text-white">
                  {Array.isArray(assignment.attachments) ? assignment.attachments.length : 0} files
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={routes.assignmentDetails(courseId, assignment._id)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </Link>
              
              {isInstructor && (
                <>
                  <Link href={routes.editAssignment(courseId, assignment._id)}>
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={routes.assignmentSubmissions(courseId, assignment._id)}>
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      <User className="w-4 h-4 mr-2" />
                      Submissions
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="text-right text-sm text-white/60">
              Created {moment(assignment.createdAt).format("MMM DD, YYYY")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 