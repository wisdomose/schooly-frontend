"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QuizService from "@/services/quiz/quiz";
import type { Quiz, QuizAttempt, SubmitQuizAttempt } from "@/services/quiz/type";
import type { Question, Option } from "@/services/question/type";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  AlertTriangle,
  Send,
  Loader2,
  FileQuestion,
  Target,
  Timer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useAppStore from "@/state";
import { routes } from "@/data/routes";

interface QuizAnswer {
  questionId: string;
  selectedOption: string;
}

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;
  
  const quizService = new QuizService();

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [canStartQuiz, setCanStartQuiz] = useState<boolean | null>(null);

  // Fetch quiz details
  const { data: quiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => quizService.findOne(quizId),
    refetchOnWindowFocus: false,
  });

  // Fetch user's attempts for this quiz
  const { data: userAttemptsData, isLoading: isLoadingAttempts } = useQuery({
    queryKey: ["userQuizAttempts", quizId],
    queryFn: () => quizService.getUserAttempts({ quizId }),
    refetchOnWindowFocus: false,
    enabled: !!quiz,
  });

  // Check if user can start/continue quiz
  useEffect(() => {
    if (!quiz || !userAttemptsData) return;

    const completedAttempts = userAttemptsData.attempts?.filter(a => a.isCompleted) || [];
    const incompleteAttempts = userAttemptsData.attempts?.filter(a => !a.isCompleted) || [];

    // If there's an incomplete attempt, use it
    if (incompleteAttempts.length > 0) {
      const incompleteAttempt = incompleteAttempts[0];
      console.log("Loading incomplete attempt:", incompleteAttempt); // Debug log
      
      // Validate that the attempt has a valid _id
      if (!incompleteAttempt._id) {
        console.error("Incomplete attempt missing _id:", incompleteAttempt);
        // Start a new attempt instead
        setCanStartQuiz(true);
        return;
      }
      
      setAttempt(incompleteAttempt);
      setCanStartQuiz(true);
      
      // Load existing answers from the incomplete attempt
      if (incompleteAttempt.answers && incompleteAttempt.answers.length > 0) {
        const existingAnswers = incompleteAttempt.answers.map((answer: any) => ({
          questionId: typeof answer.question === 'string' ? answer.question : answer.question._id,
          selectedOption: answer.selectedOption,
        }));
        setAnswers(existingAnswers);
        toast.info("Resuming your previous attempt...");
      }
      
      if (quiz.timeLimit) {
        // Calculate remaining time for incomplete attempt
        const elapsed = Math.floor((Date.now() - new Date(incompleteAttempt.startedAt).getTime()) / 1000);
        const totalTime = quiz.timeLimit * 60;
        const remaining = Math.max(0, totalTime - elapsed);
        setTimeRemaining(remaining);
        
        // If time has expired, auto-submit
        if (remaining === 0) {
          setIsTimeUp(true);
        }
      }
      return;
    }

    // Check if user has completed the quiz and multiple attempts are not allowed
    if (completedAttempts.length > 0 && !quiz.allowMultipleAttempts) {
      setCanStartQuiz(false);
      // Redirect to results page
      router.push(routes.quizResults(courseId, quizId));
      return;
    }

    // User can start a new attempt
    setCanStartQuiz(true);
  }, [quiz, userAttemptsData, courseId, quizId, router]);

  // Start quiz attempt
  const { mutate: startAttempt, isPending: isStarting } = useMutation({
    mutationFn: () => quizService.startAttempt(quizId),
    onSuccess: (newAttempt) => {
      console.log("New attempt started:", newAttempt); // Debug log
      
      // Validate that the new attempt has a valid _id
      if (!newAttempt._id) {
        console.error("New attempt missing _id:", newAttempt);
        toast.error("Failed to start quiz - invalid attempt ID");
        router.push(`/courses/${courseId}/quizzes`);
        return;
      }
      
      setAttempt(newAttempt);
      if (quiz) {
        setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
      }
      toast.success("Quiz started! Good luck!");
    },
    onError: (error: any) => {
      console.error("Failed to start attempt:", error.message); // Debug log
      toast.error(error.message || "Failed to start quiz");
      router.push(`/courses/${courseId}/quizzes`);
    },
  });

  // Submit quiz attempt
  const { mutate: submitAttempt, isPending: isSubmitting } = useMutation({
    mutationFn: (data: SubmitQuizAttempt) => {
      if (!attempt) throw new Error("No active attempt");
      if (!attempt._id) throw new Error("Invalid attempt ID");
      console.log("Submitting quiz for attempt:", attempt._id); // Debug log
      return quizService.submitAttempt(attempt._id, data);
    },
    onSuccess: (result) => {
      toast.success("Quiz submitted successfully!");
      router.push(routes.quizResults(courseId, quizId));
    },
    onError: (error: any) => {
      console.error("Failed to submit quiz:", error.message);
      console.error("Attempt object:", attempt); // Debug log
      toast.error(error.message || "Failed to submit quiz");
      router.push(routes.courseQuizzes(courseId));
    },
  });

  // Auto-save progress mutation
  const { mutate: saveProgress, isPending: isSaving } = useMutation({
    mutationFn: (data: SubmitQuizAttempt) => {
      if (!attempt) throw new Error("No active attempt");
      if (!attempt._id) throw new Error("Invalid attempt ID");
      if (attempt.isCompleted) throw new Error("Cannot save progress on completed attempt");
      console.log("Saving progress for attempt:", attempt._id); // Debug log
      return quizService.saveProgress(attempt._id, data);
    },
    onError: (error: any) => {
      // Don't show error toast for completed attempts to avoid spam
      if (error.message !== "Cannot save progress on completed attempt") {
        console.error("Failed to save progress:", error.message);
        console.error("Attempt object:", attempt); // Debug log
      }
    },
  });

  // Auto-save when answers change (debounced)
  useEffect(() => {
    console.log("Auto-save (debounced) effect triggered:", { 
      hasAttempt: !!attempt, 
      attemptId: attempt?._id, 
      isCompleted: attempt?.isCompleted,
      answersLength: answers.length 
    });
    
    if (!attempt || !attempt._id || attempt.isCompleted || answers.length === 0) return;

    const timeoutId = setTimeout(() => {
      console.log("Executing debounced auto-save for attempt:", attempt._id);
      const saveData: SubmitQuizAttempt = {
        answers: answers.map(answer => ({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
        })),
      };
      saveProgress(saveData);
    }, 5000); // Save 5 seconds after user stops typing/selecting (reduced frequency)

    return () => clearTimeout(timeoutId);
  }, [answers, attempt, saveProgress]);

  // Periodic auto-save every 60 seconds
  useEffect(() => {
    console.log("Auto-save (periodic) effect triggered:", { 
      hasAttempt: !!attempt, 
      attemptId: attempt?._id, 
      isCompleted: attempt?.isCompleted,
      answersLength: answers.length 
    });
    
    if (!attempt || !attempt._id || attempt.isCompleted || answers.length === 0) return;

    const intervalId = setInterval(() => {
      console.log("Executing periodic auto-save for attempt:", attempt._id);
      const saveData: SubmitQuizAttempt = {
        answers: answers.map(answer => ({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
        })),
      };
      saveProgress(saveData);
    }, 60000); // Save every 60 seconds (reduced frequency)

    return () => clearInterval(intervalId);
  }, [answers, attempt, saveProgress]);

  // Timer countdown
  useEffect(() => {
    if (!attempt || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, timeRemaining]);

  // Auto-submit when time is up
  useEffect(() => {
    if (isTimeUp && attempt && !isSubmitting) {
      handleSubmit(true);
    }
  }, [isTimeUp, attempt, isSubmitting]);

  const confirmStartQuiz = () => {
    setShowStartDialog(false);
    startAttempt();
  };

  const handleAnswerChange = (questionId: string, selectedOption: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing && existing.selectedOption === selectedOption) {
        // No change, avoid unnecessary state update
        return prev;
      }
      
      if (existing) {
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, selectedOption }
            : a
        );
      }
      return [...prev, { questionId, selectedOption }];
    });
  };

  const getCurrentAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.selectedOption || "";
  };

  const isQuestionAnswered = (questionId: string) => {
    return answers.some(a => a.questionId === questionId);
  };

  const handleSubmit = (autoSubmit = false) => {
    if (!autoSubmit) {
      setShowSubmitDialog(true);
      return;
    }

    const submitData: SubmitQuizAttempt = {
      answers: answers.map(answer => ({
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
      })),
    };

    submitAttempt(submitData);
  };

  const confirmSubmit = () => {
    setShowSubmitDialog(false);
    handleSubmit(true);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return "text-red-400"; // Last 5 minutes
    if (timeRemaining <= 600) return "text-yellow-400"; // Last 10 minutes
    return "text-white";
  };

  if (isLoadingQuiz || isLoadingAttempts || canStartQuiz === null || isStarting) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">
                  {isStarting ? "Starting quiz..." : canStartQuiz === null ? "Checking quiz access..." : "Loading quiz..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (canStartQuiz === false) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Quiz Already Completed</h2>
              <p className="text-white/70 mb-4">
                You have already completed this quiz. Multiple attempts are not allowed for this quiz.
              </p>
              <div className="space-y-3">
                <Link href={routes.quizResults(courseId, quizId)}>
                  <Button className="glass-button cursor-pointer mr-3">
                    View Results
                  </Button>
                </Link>
                <Link href={routes.courseQuizzes(courseId)}>
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Back to Quizzes
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || (!attempt && canStartQuiz !== true)) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Unable to Start Quiz</h2>
              <p className="text-white/70 mb-4">
                There was a problem starting the quiz. Please try again.
              </p>
              <Link href={routes.courseQuizzes(courseId)}>
                <Button className="glass-button cursor-pointer">
                  Back to Quizzes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show start screen if we can start but don't have an attempt yet
  if (quiz && !attempt && canStartQuiz === true) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <FileQuestion className="w-8 h-8 text-purple-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Ready to Start Quiz</h2>
              <p className="text-white/70 mb-4">
                Click the button below to begin &quot;{quiz.title}&quot;
              </p>
              <Button 
                onClick={() => setShowStartDialog(true)}
                className="glass-button cursor-pointer"
                disabled={isStarting}
              >
                {isStarting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <FileQuestion className="w-4 h-4 mr-2" />
                )}
                {isStarting ? "Starting..." : "Start Quiz"}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Start Quiz Confirmation Dialog */}
        <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Quiz</AlertDialogTitle>
              <AlertDialogDescription>
                Are you ready to start &quot;{quiz?.title}&quot;?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-3 space-y-2 text-sm text-white/70">
              <div className="flex justify-between">
                <span>Questions:</span>
                <span>{quiz?.questions?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Limit:</span>
                <span>{quiz?.timeLimit} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Total Points:</span>
                <span>
                  {quiz?.questions?.reduce((sum: number, question: any) => {
                    return sum + (question.points || 1);
                  }, 0) || 0}
                </span>
              </div>
              {quiz?.allowMultipleAttempts === false && (
                <div className="text-amber-600 mt-2">
                  ⚠️ You can only take this quiz once
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmStartQuiz}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Start Quiz
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  const questions = quiz.questions as Question[];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter(q => isQuestionAnswered(q._id)).length;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Timer */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <FileQuestion className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{quiz.title}</h1>
                <p className="text-white/70 text-sm">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={cn("flex items-center space-x-2", getTimeColor())}>
                <Timer className="w-5 h-5" />
                <span className="font-mono text-lg font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-white/70 text-sm">
                {answeredCount}/{questions.length} answered
              </div>
              {/* Auto-save indicator */}
              {isSaving && (
                <div className="flex items-center space-x-1 text-blue-400 text-sm">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Progress</span>
            <span className="text-white/70 text-sm">
              {Math.round((answeredCount / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Navigation */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {questions.map((q, index) => (
                <button
                  key={q._id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={cn(
                    "w-8 h-8 rounded-full text-sm font-medium transition-all duration-200",
                    index === currentQuestionIndex
                      ? "bg-purple-500 text-white"
                      : isQuestionAnswered(q._id)
                      ? "bg-green-500/30 text-green-400 border border-green-500/50"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="text-white hover:bg-white/10"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Current Question */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Question {currentQuestionIndex + 1}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-white/70">
                <Target className="w-4 h-4" />
                <span>Question {currentQuestionIndex + 1}</span>
              </div>
            </div>
            <p className="text-white text-lg mb-6">{currentQuestion.question}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options?.map((optionObj, index) => (
              <label
                key={index}
                className={cn(
                  "flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                  getCurrentAnswer(currentQuestion._id) === optionObj.option
                    ? "bg-purple-500/20 border-purple-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <div className="mt-1">
                  {getCurrentAnswer(currentQuestion._id) === optionObj.option ? (
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/40" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-white">{optionObj.option}</span>
                </div>
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={optionObj.option}
                  checked={getCurrentAnswer(currentQuestion._id) === optionObj.option}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Submit Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="text-white/70">
              <p className="text-sm">
                {answeredCount} of {questions.length} questions answered
              </p>
              {answeredCount < questions.length && (
                <p className="text-yellow-400 text-sm mt-1">
                  {questions.length - answeredCount} questions remaining
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Link href={routes.courseQuizzes(courseId)}>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10"
                  disabled={isSubmitting}
                >
                  Exit Quiz
                </Button>
              </Link>
              <Button
                onClick={() => handleSubmit()}
                disabled={isSubmitting || answers.length === 0}
                className="glass-button cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your quiz? You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block text-yellow-600 mt-2">
                  Warning: You have {questions.length - answeredCount} unanswered questions.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSubmit}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 