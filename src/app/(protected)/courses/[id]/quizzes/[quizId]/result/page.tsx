"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QuizService from "@/services/quiz/quiz";
import type { Quiz, QuizAttempt } from "@/services/quiz/type";
import type { Question, Option } from "@/services/question/type";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Target,
  Clock,
  Trophy,
  Medal,
  Award,
  Star,
  FileQuestion,
  RotateCcw,
  Home,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import moment from "moment";
import useAppStore from "@/state";
import { routes } from "@/data/routes";

export default function QuizResultPage() {
  const params = useParams();
  const courseId = params.id as string;
  const quizId = params.quizId as string;
  
  const quizService = new QuizService();

  // Fetch quiz details
  const { data: quiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => quizService.findOne(quizId),
    refetchOnWindowFocus: false,
  });

  // Fetch user's latest attempt for this quiz
  const { data: attemptsData, isLoading: isLoadingAttempts, error: attemptsError } = useQuery({
    queryKey: ["userQuizAttempts", quizId],
    queryFn: () => quizService.getUserAttempts({ quizId }),
    refetchOnWindowFocus: false,
  });

  if (isLoadingQuiz || isLoadingAttempts) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading results...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter for completed attempts only
  const completedAttempts = attemptsData?.attempts?.filter(attempt => attempt.isCompleted) || [];
  const attempt = completedAttempts[0]; // Latest completed attempt

  // Enhanced error checking and debugging
  if (!quiz) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Quiz Not Found</h2>
              <p className="text-white/70 mb-4">
                The quiz you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </p>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href={routes.courseQuizzes(courseId)}>
                  Back to Quizzes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!attempt) {
    // More detailed error message
    const hasAnyAttempts = (attemptsData?.attempts?.length || 0) > 0;
    const hasIncompleteAttempts = attemptsData?.attempts?.some(a => !a.isCompleted) || false;

    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No Results Found</h2>
              
              {!hasAnyAttempts ? (
                <div>
                  <p className="text-white/70 mb-4">
                    You haven&apos;t taken this quiz yet.
                  </p>
                  <Button asChild className="glass-button cursor-pointer mr-3">
                    <Link href={routes.takeQuiz(courseId, quizId)}>
                      Take Quiz
                    </Link>
                  </Button>
                </div>
              ) : hasIncompleteAttempts ? (
                <div>
                  <p className="text-white/70 mb-4">
                    You have started this quiz but haven&apos;t submitted it yet. Complete and submit your attempt to see results.
                  </p>
                  <Button asChild className="glass-button cursor-pointer mr-3">
                    <Link href={routes.takeQuiz(courseId, quizId)}>
                      Continue Quiz
                    </Link>
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-white/70 mb-4">
                    No completed quiz attempts found. Please try taking the quiz again.
                  </p>
                  <Button asChild className="glass-button cursor-pointer mr-3">
                    <Link href={routes.takeQuiz(courseId, quizId)}>
                      Take Quiz
                    </Link>
                  </Button>
                </div>
              )}
              
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href={routes.courseQuizzes(courseId)}>
                  Back to Quizzes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questions = quiz.questions as Question[];
  const score = attempt.score || 0;
  const totalPoints = attempt.totalPoints || quiz.totalPoints || 0;
  const percentage = attempt.percentage || 0;
  const timeSpent = attempt.timeSpent || 0;

  const getPerformanceColor = () => {
    if (percentage >= 90) return "text-green-400";
    if (percentage >= 80) return "text-yellow-400";
    if (percentage >= 70) return "text-orange-400";
    return "text-red-400";
  };

  const getPerformanceIcon = () => {
    if (percentage >= 90) return <Trophy className="w-8 h-8 text-green-400" />;
    if (percentage >= 80) return <Medal className="w-8 h-8 text-yellow-400" />;
    if (percentage >= 70) return <Award className="w-8 h-8 text-orange-400" />;
    return <Star className="w-8 h-8 text-red-400" />;
  };

  const getPerformanceMessage = () => {
    if (percentage >= 90) return "Excellent work! Outstanding performance!";
    if (percentage >= 80) return "Great job! You did very well!";
    if (percentage >= 70) return "Good effort! Keep it up!";
    return "Keep practicing! You'll improve!";
  };

  const formatDuration = (timeInSeconds: number) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0m 0s";
    
    // Handle backwards compatibility: if time seems too small (likely in minutes), convert
    // This is a heuristic: if timeSpent is very small but quiz has timeLimit, it's likely in minutes
    let actualSeconds = timeInSeconds;
    if (timeInSeconds < 120 && quiz.timeLimit && quiz.timeLimit > 5) {
      // If time is less than 2 minutes but quiz has more than 5 min limit, likely old format
      actualSeconds = timeInSeconds * 60; // Convert minutes to seconds
    }
    
    const minutes = Math.floor(actualSeconds / 60);
    const seconds = actualSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href={routes.courseQuizzes(courseId)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Quizzes
                </Link>
              </Button>
            </div>
            <div className="flex space-x-3">
              {quiz.allowMultipleAttempts && (
                <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                  <Link href={routes.takeQuiz(courseId, quizId)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Quiz
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href={routes.courseDetails(courseId)}>
                  <Home className="w-4 h-4 mr-2" />
                  Course Home
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="glass-card rounded-2xl p-8 mb-6 text-center">
          <div className="mb-6">
            {getPerformanceIcon()}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
          <p className="text-xl text-white/80 mb-4">{quiz.title}</p>
          <p className={cn("text-lg font-medium", getPerformanceColor())}>
            {getPerformanceMessage()}
          </p>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 w-fit mx-auto mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Score</h3>
            <p className={cn("text-2xl font-bold", getPerformanceColor())}>
              {score}/{totalPoints}
            </p>
            <p className="text-white/60 text-sm">points</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 w-fit mx-auto mb-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Percentage</h3>
            <p className={cn("text-2xl font-bold", getPerformanceColor())}>
              {percentage.toFixed(1)}%
            </p>
            <p className="text-white/60 text-sm">accuracy</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 w-fit mx-auto mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Time Taken</h3>
            <p className="text-2xl font-bold text-white">
              {formatDuration(timeSpent)}
            </p>
            <p className="text-white/60 text-sm">of {quiz.timeLimit}m</p>
          </div>
        </div>

        {/* Detailed Results */}
        {quiz.showCorrectAnswers && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <FileQuestion className="w-5 h-5 mr-2" />
              Question Breakdown
            </h2>
            
            <div className="space-y-6">
              {questions.map((question, index) => {
                const userAnswer = attempt.answers.find(
                  (ans: any) => 
                    (typeof ans.question === 'string' ? ans.question : ans.question._id) === question._id
                );
                
                return (
                  <QuestionResult
                    key={question._id}
                    question={question}
                    userAnswer={userAnswer}
                    questionNumber={index + 1}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Attempt Details */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Attempt Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
            <div>
              <span className="font-medium text-white">Submitted:</span>{" "}
              {moment(attempt.submittedAt).format("MMM DD, YYYY [at] h:mm A")}
            </div>
            <div>
              <span className="font-medium text-white">Duration:</span>{" "}
              {formatDuration(timeSpent)}
            </div>
            <div>
              <span className="font-medium text-white">Questions:</span>{" "}
              {questions.length} total
            </div>
            <div>
              <span className="font-medium text-white">Correct:</span>{" "}
              {attempt.answers.filter((ans: any) => ans.isCorrect).length} / {questions.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionResult({ 
  question, 
  userAnswer, 
  questionNumber 
}: { 
  question: Question; 
  userAnswer: any; 
  questionNumber: number;
}) {
  const isCorrect = userAnswer?.isCorrect || false;
  const selectedOption = userAnswer?.selectedOption || "";
  const correctOption = question.options.find(opt => opt.isCorrect)?.option || "";

  return (
    <div className="border border-white/10 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-white font-medium flex items-center">
          <span className="mr-2">Q{questionNumber}:</span>
          {question.question}
        </h3>
        <div className="flex items-center space-x-2">
          {isCorrect ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={cn(
            "text-sm font-medium",
            isCorrect ? "text-green-400" : "text-red-400"
          )}>
            {isCorrect ? "Correct" : "Incorrect"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === option.option;
          const isCorrectOption = option.isCorrect;
          
          return (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border text-sm",
                isCorrectOption
                  ? "bg-green-500/20 border-green-500/50 text-green-100"
                  : isSelected && !isCorrectOption
                  ? "bg-red-500/20 border-red-500/50 text-red-100"
                  : "bg-white/5 border-white/10 text-white/70"
              )}
            >
              <div className="flex items-center justify-between">
                <span>{option.option}</span>
                <div className="flex items-center space-x-1">
                  {isSelected && (
                    <span className="text-xs px-2 py-1 rounded bg-white/10">
                      Your answer
                    </span>
                  )}
                  {isCorrectOption && (
                    <span className="text-xs px-2 py-1 rounded bg-green-500/30">
                      Correct
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 