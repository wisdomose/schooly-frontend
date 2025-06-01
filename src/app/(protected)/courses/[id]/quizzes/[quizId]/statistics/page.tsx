"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QuizService from "@/services/quiz/quiz";
import type { Quiz, QuizStatistics as QuizStatsType } from "@/services/quiz/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  Trophy,
  Loader2,
  AlertCircle,
  Calendar,
  FileQuestion,
  Star,
  User,
  Download,
  Eye,
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

export default function QuizStatisticsPage() {
  const params = useParams();
  const { user } = useAppStore();
  const courseId = params.id as string;
  const quizId = params.quizId as string;
  
  const quizService = new QuizService();

  // Fetch quiz details
  const { data: quiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => quizService.findOne(quizId),
    refetchOnWindowFocus: false,
  });

  // Fetch quiz statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ["quizStatistics", quizId],
    queryFn: () => quizService.getQuizStatistics(quizId),
    refetchOnWindowFocus: false,
    enabled: !!quizId,
  });

  // Fetch quiz attempts
  const { data: attemptsData, isLoading: isLoadingAttempts } = useQuery({
    queryKey: ["quizAttempts", quizId],
    queryFn: () => quizService.getQuizAttempts(quizId),
    refetchOnWindowFocus: false,
    enabled: !!quizId,
  });

  if (isLoadingQuiz || isLoadingStats || isLoadingAttempts) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                <p className="text-white/70">Loading statistics...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || !statistics) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No Data Found</h2>
              <p className="text-white/70 mb-4">
                Unable to load quiz statistics. Please try again later.
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

  const attempts = attemptsData?.attempts || [];
  const hasAttempts = statistics.totalAttempts > 0;

  // Calculate total attainable points from questions
  const totalAttainablePoints = quiz?.questions?.reduce((sum: number, question: any) => {
    return sum + (question.points || 1);
  }, 0) || 0;

  // Helper functions for safe calculations
  const safePercentage = (score: number, total: number) => {
    if (total === 0 || isNaN(score) || isNaN(total)) return 0;
    return Math.round((score / total) * 100 * 10) / 10; // Round to 1 decimal
  };

  const safeTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0m 0s";
    
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

  const safeDivision = (numerator: number, denominator: number) => {
    if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) return 0;
    return numerator / denominator;
  };

  // Calculate score distribution
  const getScoreDistribution = () => {
    if (!hasAttempts) return [];
    
    const ranges = [
      { label: "90-100%", min: 90, max: 100, count: 0, color: "bg-green-500" },
      { label: "80-89%", min: 80, max: 89, count: 0, color: "bg-blue-500" },
      { label: "70-79%", min: 70, max: 79, count: 0, color: "bg-yellow-500" },
      { label: "60-69%", min: 60, max: 69, count: 0, color: "bg-orange-500" },
      { label: "Below 60%", min: 0, max: 59, count: 0, color: "bg-red-500" },
    ];

    attempts.forEach(attempt => {
      const percentage = safePercentage(attempt.score, attempt.totalPoints);
      const range = ranges.find(r => percentage >= r.min && percentage <= r.max);
      if (range) range.count++;
    });

    return ranges;
  };

  const scoreDistribution = getScoreDistribution();
  const maxCount = Math.max(...scoreDistribution.map(r => r.count), 1);

  // Safe calculations for statistics display
  const safeHighestScorePercentage = safePercentage(statistics.highestScore, totalAttainablePoints);
  const successCount = scoreDistribution.slice(0, 2).reduce((sum, r) => sum + r.count, 0);
  const successRate = statistics.totalAttempts > 0 ? Math.round((successCount / statistics.totalAttempts) * 100) : 0;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={routes.courseQuizzes(courseId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Quizzes
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href={routes.editQuiz(courseId, quizId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Eye className="w-4 h-4 mr-2" />
                  View Quiz
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quiz Info */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Quiz Statistics</h1>
                <p className="text-xl text-white/80 mt-1">{quiz.title}</p>
                {quiz.description && (
                  <p className="text-white/60 mt-2 max-w-2xl">{quiz.description}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60 mb-1">Created</div>
              <div className="text-white font-medium">
                {moment(quiz.createdAt).format("MMM DD, YYYY")}
              </div>
            </div>
          </div>
          
          {/* Quiz Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="text-white/60 text-sm">Questions</div>
              <div className="text-white font-semibold text-lg">
                {Array.isArray(quiz.questions) ? quiz.questions.length : 0}
              </div>
            </div>
            <div className="text-center">
              <div className="text-white/60 text-sm">Time Limit</div>
              <div className="text-white font-semibold text-lg">{quiz.timeLimit}m</div>
            </div>
            <div className="text-center">
              <div className="text-white/60 text-sm">Total Points</div>
              <div className="text-white font-semibold text-lg">{totalAttainablePoints}</div>
            </div>
            <div className="text-center">
              <div className="text-white/60 text-sm">Status</div>
              <div className={cn(
                "font-semibold text-lg",
                quiz.isActive ? "text-green-400" : "text-red-400"
              )}>
                {quiz.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>

        {!hasAttempts ? (
          /* No Attempts Yet */
          <div className="glass-card rounded-2xl p-12">
            <div className="text-center">
              <div className="p-6 rounded-full bg-white/5 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Users className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">No Attempts Yet</h3>
              <p className="text-white/70 text-lg max-w-md mx-auto">
                This quiz hasn&apos;t been taken by any students yet. Statistics will appear here once students start submitting their attempts.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Total Attempts"
                value={statistics.totalAttempts.toString()}
                subtitle="students participated"
                color="from-blue-500 to-cyan-500"
              />
              <StatCard
                icon={<Target className="w-6 h-6" />}
                title="Average Score"
                value={totalAttainablePoints > 0 ? `${statistics.averageScore}/${totalAttainablePoints}` : `${statistics.averageScore} pts`}
                subtitle={`${statistics.averagePercentage.toFixed(1)}% average`}
                color="from-green-500 to-emerald-500"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Highest Score"
                value={totalAttainablePoints > 0 ? `${statistics.highestScore}/${totalAttainablePoints}` : `${statistics.highestScore} pts`}
                subtitle={`${safeHighestScorePercentage.toFixed(1)}% top score`}
                color="from-yellow-500 to-orange-500"
              />
              <StatCard
                icon={<Trophy className="w-6 h-6" />}
                title="Success Rate"
                value={`${successRate}%`}
                subtitle="scored 80% or higher"
                color="from-purple-500 to-pink-500"
              />
            </div>

            {/* Score Distribution */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Score Distribution
              </h2>
              
              <div className="space-y-4">
                {scoreDistribution.map((range, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-20 text-sm text-white/70 font-medium">
                      {range.label}
                    </div>
                    <div className="flex-1 relative">
                      <div className="w-full bg-white/10 rounded-full h-8 relative overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", range.color)}
                          style={{ width: `${(range.count / maxCount) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {range.count} {range.count === 1 ? "student" : "students"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm text-white/70">
                      {statistics.totalAttempts > 0 ? Math.round((range.count / statistics.totalAttempts) * 100) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Attempts */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <FileQuestion className="w-5 h-5 mr-2" />
                Individual Attempts ({attempts.length})
              </h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/80">Student</TableHead>
                      <TableHead className="text-white/80">Score</TableHead>
                      <TableHead className="text-white/80">Percentage</TableHead>
                      <TableHead className="text-white/80">Time Taken</TableHead>
                      <TableHead className="text-white/80">Submitted</TableHead>
                      <TableHead className="text-white/80">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((attempt) => {
                      const user = typeof attempt.user === 'object' ? attempt.user : null;
                      const safeScore = attempt.score || 0;
                      const safeTotalPoints = attempt.totalPoints || totalAttainablePoints || 1;
                      const percentage = safePercentage(safeScore, safeTotalPoints);
                      const timeDisplayed = safeTime(attempt.timeSpent);
                      
                      const getPerformanceBadge = () => {
                        if (percentage >= 90) return { text: "Excellent", color: "bg-green-500/20 text-green-400 border-green-500/30" };
                        if (percentage >= 80) return { text: "Good", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
                        if (percentage >= 70) return { text: "Fair", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
                        return { text: "Needs Improvement", color: "bg-red-500/20 text-red-400 border-red-500/30" };
                      };
                      
                      const badge = getPerformanceBadge();

                      return (
                        <TableRow key={attempt._id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center space-x-2">
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
                            <div className="text-white font-medium">
                              {safeScore}/{safeTotalPoints}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={cn(
                              "font-medium",
                              percentage >= 80 ? "text-green-400" : 
                              percentage >= 70 ? "text-yellow-400" : "text-red-400"
                            )}>
                              {percentage.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-white/70">
                              {timeDisplayed}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-white/70 text-sm">
                              {attempt.submittedAt ? moment(attempt.submittedAt).format("MMM DD, HH:mm") : "—"}
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: string; 
  subtitle: string; 
  color: string; 
}) {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl bg-gradient-to-r text-white", color)}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-white/70 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>
    </div>
  );
} 