"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import QuizService from "@/services/quiz/quiz";
import { QuestionService } from "@/services/question";
import type { CreateQuiz } from "@/services/quiz/type";
import type { Question } from "@/services/question/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileQuestion,
  Clock,
  Calendar,
  Target,
  Settings,
  Save,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CreateQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const quizService = new QuizService();
  const questionService = new QuestionService();

  // Fetch available questions for the course
  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["questions", courseId],
    queryFn: () => questionService.findAll({ course: courseId }),
    refetchOnWindowFocus: false,
  });

  const [formData, setFormData] = useState<CreateQuiz>({
    title: "",
    description: "",
    course: courseId,
    questions: [],
    timeLimit: 30,
    isActive: true,
    allowMultipleAttempts: false,
    showCorrectAnswers: true,
    shuffleQuestions: false,
  });

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>("");

  const { mutate: createQuiz, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateQuiz) => quizService.create(data),
    onSuccess: (quiz) => {
      toast.success("Quiz created successfully!");
      router.push(routes.courseQuizzes(courseId));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create quiz");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Quiz title is required");
      return;
    }

    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question");
      return;
    }

    const submitData: CreateQuiz = {
      ...formData,
      questions: selectedQuestions,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    };

    createQuiz(submitData);
  };

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const calculateTotalPoints = () => {
    if (!questionsData?.questions) return 0;
    return selectedQuestions.reduce((total, questionId) => {
      const question = questionsData.questions.find(q => q._id === questionId);
      return total + (question?.points || 1);
    }, 0);
  };

  const availableQuestions = questionsData?.questions || [];
  const totalPoints = calculateTotalPoints();

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
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
          </div>
        </div>

        {/* Page Title */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Quiz</h1>
              <p className="text-white/70">Set up a new quiz for your course</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <FileQuestion className="w-5 h-5 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title" className="text-white mb-2 block">
                  Quiz Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter quiz title"
                  className="glass-input"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description" className="text-white mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter quiz description (optional)"
                  className="glass-input min-h-[100px]"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="timeLimit" className="text-white mb-2 block flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Time Limit (minutes)
                </Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  max="180"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 30 })}
                  className="glass-input"
                />
              </div>

              <div>
                <Label htmlFor="dueDate" className="text-white mb-2 block flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Due Date (optional)
                </Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>
          </div>

          {/* Quiz Settings */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Quiz Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <Label className="text-white font-medium">Active</Label>
                  <p className="text-white/60 text-sm">Students can take this quiz</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <Label className="text-white font-medium">Multiple Attempts</Label>
                  <p className="text-white/60 text-sm">Allow students to retake</p>
                </div>
                <Switch
                  checked={formData.allowMultipleAttempts}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowMultipleAttempts: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <Label className="text-white font-medium">Show Correct Answers</Label>
                  <p className="text-white/60 text-sm">Display answers after submission</p>
                </div>
                <Switch
                  checked={formData.showCorrectAnswers}
                  onCheckedChange={(checked) => setFormData({ ...formData, showCorrectAnswers: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <Label className="text-white font-medium">Shuffle Questions</Label>
                  <p className="text-white/60 text-sm">Randomize question order</p>
                </div>
                <Switch
                  checked={formData.shuffleQuestions}
                  onCheckedChange={(checked) => setFormData({ ...formData, shuffleQuestions: checked })}
                />
              </div>
            </div>
          </div>

          {/* Question Selection */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Select Questions
              </h2>
              <div className="flex items-center space-x-4 text-sm text-white/70">
                <span>{selectedQuestions.length} selected</span>
                <span>•</span>
                <span>{totalPoints} total points</span>
              </div>
            </div>

            {isLoadingQuestions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
                <span className="ml-2 text-white/70">Loading questions...</span>
              </div>
            ) : availableQuestions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-white/60 mx-auto mb-3" />
                <p className="text-white/70 mb-4">No questions available for this course</p>
                <p className="text-white/60 text-sm mb-4">
                  Create some questions first before making a quiz
                </p>
                <Link href={routes.courseQuestions(courseId)}>
                  <Button className="glass-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Manage Questions
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {availableQuestions.map((question) => (
                  <div
                    key={question._id}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                      selectedQuestions.includes(question._id)
                        ? "bg-purple-500/20 border-purple-500/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                    onClick={() => handleQuestionToggle(question._id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {selectedQuestions.includes(question._id) ? (
                          <CheckSquare className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Square className="w-5 h-5 text-white/40" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">
                          {question.question}
                        </h3>
                        <div className="flex items-center space-x-4 text-xs text-white/60">
                          <span className="flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            {question.points || 1} points
                          </span>
                          <span className="capitalize">{question.type || 'multiple-choice'}</span>
                          <span>{question.options?.length || 0} options</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="text-white/70">
                <p className="text-sm">
                  {selectedQuestions.length} questions selected • {totalPoints} total points
                </p>
              </div>
              <div className="flex space-x-3">
                <Link href={routes.courseQuizzes(courseId)}>
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isCreating || selectedQuestions.length === 0}
                  className="glass-button cursor-pointer"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isCreating ? "Creating..." : "Create Quiz"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 