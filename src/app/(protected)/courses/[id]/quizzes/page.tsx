"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QuizService from "@/services/quiz/quiz";
import { CourseService } from "@/services/course";
import type { Quiz } from "@/services/quiz/type";
import type { Course } from "@/services/course/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  ArrowLeft,
  Clock,
  FileQuestion,
  Users,
  Play,
  Edit,
  Trash2,
  Calendar,
  Target,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trophy,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import moment from "moment";
import { toast } from "sonner";
import { useState } from "react";
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

export default function CourseQuizzesPage() {
  const params = useParams();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  
  const courseId = params.id as string;
  const quizService = new QuizService();
  const courseService = new CourseService();
  
  const canCreateQuiz = user?.role === "admin" || user?.role === "instructor";

  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseService.findOne(courseId),
    refetchOnWindowFocus: false,
  });

  // Fetch quizzes for the course
  const { data: quizzesData, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ["quizzes", courseId],
    queryFn: () => quizService.findAll({ courseId }),
    refetchOnWindowFocus: false,
    enabled: !!courseId,
  });

  // Alternative approach: Fetch attempts for each quiz individually
  // This gives us more specific control but requires more API calls
  const { data: userAttempts } = useQuery({
    queryKey: ["courseQuizAttempts", courseId, quizzesData?.quizzes?.map(q => q._id)],
    queryFn: async () => {
      if (!quizzesData?.quizzes) return { attempts: [] };
      
      console.log("Fetching attempts for quizzes:", quizzesData.quizzes.map(q => ({ id: q._id, title: q.title })));
      
      // Fetch attempts for each quiz in this course
      const attemptPromises = quizzesData.quizzes.map(quiz => {
        console.log(`Fetching attempts for quiz: ${quiz._id} (${quiz.title})`);
        return quizService.getUserAttempts({ quizId: quiz._id, limit: 10 })
          .then(data => {
            console.log(`✅ Successfully fetched attempts for quiz ${quiz._id}:`, data?.attempts?.length || 0, "attempts");
            return data?.attempts || [];
          })
          .catch(error => {
            console.error(`❌ Failed to fetch attempts for quiz ${quiz._id}:`, error.message);
            return []; // Handle errors gracefully
          });
      });
      
      const allAttempts = await Promise.all(attemptPromises);
      
      // Flatten all attempts into a single array
      const attempts = allAttempts.flat();
      
      console.log("Total attempts fetched:", attempts.length);
      return { attempts };
    },
    refetchOnWindowFocus: false,
    enabled: !!user && user.role === "student" && !!quizzesData?.quizzes?.length,
  });

  const { mutate: deleteQuiz, isPending: isDeleting } = useMutation({
    mutationFn: (quizId: string) => quizService.delete(quizId),
    onSuccess: () => {
      toast.success("Quiz deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["quizzes", courseId] });
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete quiz");
      setDeleteDialogOpen(false);
    },
  });

  const handleDeleteQuiz = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (quizToDelete) {
      deleteQuiz(quizToDelete._id);
    }
  };

  const getUserAttemptForQuiz = (quizId: string) => {
    return userAttempts?.attempts?.find(attempt => 
      typeof attempt.quiz === 'string' ? attempt.quiz === quizId : attempt.quiz._id === quizId
    );
  };

  const isUserCreator = (quiz: Quiz) => {
    if (!user) return false;
    const creator = quiz.creator;
    return typeof creator === 'string' ? creator === user._id : creator?._id === user._id;
  };

  if (isLoadingCourse || isLoadingQuizzes) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading quizzes...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quizzes = quizzesData?.quizzes || [];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href={routes.courseDetails(courseId)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course
                </Link>
              </Button>
            </div>
            {canCreateQuiz && (
              <Button asChild className="glass-button cursor-pointer">
                <Link href={routes.createQuiz(courseId)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quiz
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Course Info */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Course Quizzes</h1>
              <p className="text-white/70">{course?.title}</p>
            </div>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-white">
                Quizzes ({quizzes.length})
              </h2>
            </div>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-white/5 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileQuestion className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No quizzes yet
              </h3>
              <p className="text-white/70 mb-4">
                {canCreateQuiz 
                  ? "Create your first quiz to test student knowledge" 
                  : "No quizzes have been created for this course yet"
                }
              </p>
              {canCreateQuiz && (
                <Link href={routes.createQuiz(courseId)}>
                  <Button className="glass-button cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Quiz
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <QuizCard 
                  key={quiz._id}
                  quiz={quiz}
                  canEdit={isUserCreator(quiz)}
                  userAttempt={getUserAttemptForQuiz(quiz._id)}
                  onDelete={() => handleDeleteQuiz(quiz)}
                  courseId={courseId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{quizToDelete?.title}&quot;? This action cannot be undone and will permanently remove the quiz and all associated attempts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
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

function QuizCard({ 
  quiz, 
  canEdit, 
  userAttempt, 
  onDelete, 
  courseId 
}: { 
  quiz: Quiz; 
  canEdit: boolean; 
  userAttempt?: any; 
  onDelete: () => void; 
  courseId: string;
}) {
  const hasAttempted = !!userAttempt;
  const isCompleted = userAttempt?.isCompleted;
  const isOverdue = quiz.dueDate && new Date() > new Date(quiz.dueDate);
  
  // Determine if user can take/retake the quiz
  let canTake = false;
  
  if (!canEdit && quiz.isActive) {
    if (!hasAttempted) {
      // User hasn't attempted yet - can take if not overdue
      canTake = !isOverdue;
    } else if (!isCompleted) {
      // User has incomplete attempt - can continue
      canTake = true;
    } else if (isCompleted && quiz.allowMultipleAttempts) {
      // User completed but multiple attempts allowed - can retake
      canTake = true;
    }
    // If completed and no multiple attempts allowed - canTake remains false
  }

  return (
    <div className="glass-card rounded-xl p-6 hover:shadow-lg transition-all duration-200 group">
      {/* Quiz Status Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {!quiz.isActive && (
            <div className="px-2 py-1 rounded-full bg-gray-500/20 border border-gray-500/30">
              <span className="text-xs text-gray-400">Inactive</span>
            </div>
          )}
          {isOverdue && (
            <div className="px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="text-xs text-red-400">Overdue</span>
            </div>
          )}
          {hasAttempted && (
            <div className={cn(
              "px-2 py-1 rounded-full border",
              isCompleted 
                ? "bg-green-500/20 border-green-500/30" 
                : "bg-yellow-500/20 border-yellow-500/30"
            )}>
              <span className={cn(
                "text-xs",
                isCompleted ? "text-green-400" : "text-yellow-400"
              )}>
                {isCompleted ? "Completed" : "In Progress"}
              </span>
            </div>
          )}
        </div>
        
        {canEdit && (
          <div className="flex space-x-1">
            <Link href={routes.editQuiz(courseId, quiz._id)}>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Quiz Title & Description */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-200 transition-colors">
          {quiz.title}
        </h3>
        {quiz.description && (
          <p className="text-white/70 text-sm line-clamp-2">
            {quiz.description}
          </p>
        )}
      </div>

      {/* Quiz Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-white/60">
        <div className="flex items-center space-x-1">
          <FileQuestion className="w-4 h-4" />
          <span>{quiz.questions?.length || 0} questions</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{quiz.timeLimit} minutes</span>
        </div>
        <div className="flex items-center space-x-1">
          <Target className="w-4 h-4" />
          <span>{quiz.totalPoints} points</span>
        </div>
        {quiz.dueDate && (
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{moment(quiz.dueDate).format("MMM DD")}</span>
          </div>
        )}
      </div>

      {/* Quiz completion status for non-retakeable quizzes */}
      {!canEdit && hasAttempted && isCompleted && !quiz.allowMultipleAttempts && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 text-blue-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Quiz completed - Multiple attempts not allowed</span>
          </div>
        </div>
      )}

      {/* User Attempt Results */}
      {!canEdit && hasAttempted && isCompleted && (
        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Your Score:</span>
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">
                {userAttempt.score}/{userAttempt.totalPoints}
              </span>
              <span className="text-green-400">
                ({userAttempt.percentage}%)
              </span>
              {userAttempt.percentage >= 80 && (
                <Trophy className="w-4 h-4 text-yellow-400" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {canEdit ? (
          <Link href={routes.quizStatistics(courseId, quiz._id)}>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <Users className="w-4 h-4 mr-2" />
              Statistics
            </Button>
          </Link>
        ) : (
          <div />
        )}

        <div className="flex space-x-2">
          {!canEdit && hasAttempted && isCompleted && (
            <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              <Link href={routes.quizResults(courseId, quiz._id)}>
                <Eye className="w-4 h-4 mr-1" />
                View Results
              </Link>
            </Button>
          )}
          
          {canTake && (
            <Button asChild size="sm" className="glass-button cursor-pointer" disabled={!quiz.isActive}>
              <Link href={routes.takeQuiz(courseId, quiz._id)}>
                <Play className="w-4 h-4 mr-2" />
                {!hasAttempted 
                  ? "Take Quiz" 
                  : !isCompleted 
                    ? "Continue Quiz" 
                    : "Retake Quiz"
                }
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 