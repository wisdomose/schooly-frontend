"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { QuestionService } from "@/services/question";
import type { Question } from "@/services/question/type";
import { routes } from "@/data/routes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Search,
  FileQuestion,
  Target,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const queryClient = useQueryClient();
  
  const questionService = new QuestionService();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  // Fetch questions for the course
  const { data: questionsData, isLoading, error } = useQuery({
    queryKey: ["questions", courseId],
    queryFn: () => questionService.findAll({ course: courseId }),
    refetchOnWindowFocus: false,
  });

  // Delete question mutation
  const { mutate: deleteQuestion, isPending: isDeleting } = useMutation({
    mutationFn: (questionId: string) => questionService.delete(questionId),
    onSuccess: () => {
      toast.success("Question deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["questions", courseId] });
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete question");
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    },
  });

  const questions = questionsData?.questions || [];
  
  // Filter questions based on search term
  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (questionToDelete) {
      deleteQuestion(questionToDelete._id);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-white/70">Failed to load questions</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href={routes.courseDetails(courseId)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course
                </Link>
              </Button>
            </div>
            <Button asChild className="glass-button">
              <Link href={routes.createQuestion(courseId)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Question
              </Link>
            </Button>
          </div>
        </div>

        {/* Page Title */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <FileQuestion className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Question Bank</h1>
                <p className="text-white/70">Manage questions for this course</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{questions.length}</p>
              <p className="text-white/60 text-sm">Total Questions</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-10"
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="glass-card rounded-2xl p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <span className="ml-3 text-white/70">Loading questions...</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <FileQuestion className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? "No questions found" : "No questions yet"}
              </h3>
              <p className="text-white/60 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Create your first question to get started"
                }
              </p>
              {!searchTerm && (
                <Button asChild className="glass-button">
                  <Link href={routes.createQuestion(courseId)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Question
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  {searchTerm ? `Search Results (${filteredQuestions.length})` : `All Questions (${filteredQuestions.length})`}
                </h2>
              </div>

              {filteredQuestions.map((question) => (
                <div
                  key={question._id}
                  className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-3 text-lg">
                        {question.question}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        {question.options?.map((option, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center space-x-2 p-2 rounded-lg text-sm",
                              option.isCorrect 
                                ? "bg-green-500/20 text-green-300" 
                                : "bg-white/5 text-white/70"
                            )}
                          >
                            {option.isCorrect ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-white/40" />
                            )}
                            <span>{option.option}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-white/60">
                        <span className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {question.points || 1} points
                        </span>
                        <span className="capitalize">{question.type || 'multiple-choice'}</span>
                        <span>{question.options?.length || 0} options</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button asChild variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/20">
                        <Link href={routes.editQuestion(courseId, question._id)}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question)}
                        disabled={isDeleting}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone and will permanently remove the question from the course.
              {questionToDelete && (
                <span className="block text-white/80 mt-2 font-medium">
                  &quot;{questionToDelete.question.length > 60 
                    ? `${questionToDelete.question.substring(0, 60)}...` 
                    : questionToDelete.question}&quot;
                </span>
              )}
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