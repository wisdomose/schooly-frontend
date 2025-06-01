"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionService } from "@/services/question";
import type { UpdateQuestion } from "@/services/question/type";
import { routes } from "@/data/routes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileQuestion,
  Target,
  Save,
  Loader2,
  CheckCircle,
  Circle,
  CheckSquare,
  ToggleLeft,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Option {
  option: string;
  isCorrect: boolean;
  _id?: string;
}

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id as string;
  const questionId = params.questionId as string;
  
  const questionService = new QuestionService();

  const [formData, setFormData] = useState({
    question: "",
    points: 1,
    type: "multiple-choice",
  });

  const [options, setOptions] = useState<Option[]>([
    { option: "", isCorrect: false },
    { option: "", isCorrect: false },
  ]);

  // Fetch existing question data
  const { data: existingQuestion, isLoading: isLoadingQuestion, error } = useQuery({
    queryKey: ["question", questionId],
    queryFn: () => questionService.findOne(questionId),
    refetchOnWindowFocus: false,
  });

  // Populate form with existing question data
  useEffect(() => {
    if (existingQuestion) {
      console.log('Loading existing question:', existingQuestion);
      console.log('Question type from backend:', existingQuestion.type);
      
      const questionType = existingQuestion.type || "multiple-choice";
      console.log('Setting form type to:', questionType);
      
      setFormData({
        question: existingQuestion.question,
        points: existingQuestion.points || 1,
        type: questionType,
      });
      
      if (existingQuestion.options && existingQuestion.options.length > 0) {
        setOptions(existingQuestion.options.map(opt => ({
          option: opt.option,
          isCorrect: opt.isCorrect,
          _id: (opt as any)._id,
        })));
      }
    }
  }, [existingQuestion]);

  // Handle question type change
  useEffect(() => {
    if (formData.type === "true-false" && (!existingQuestion || existingQuestion.type !== "true-false")) {
      setOptions([
        { option: "True", isCorrect: false },
        { option: "False", isCorrect: false },
      ]);
    } else if (formData.type === "multiple-choice" && options.length === 2 && 
               options[0].option === "True" && options[1].option === "False") {
      // Reset to empty options when switching from true/false to multiple choice
      setOptions([
        { option: "", isCorrect: false },
        { option: "", isCorrect: false },
      ]);
    }
  }, [formData.type, existingQuestion]);

  const { mutate: updateQuestion, isPending: isUpdating } = useMutation({
    mutationFn: (data: UpdateQuestion) => questionService.update(questionId, data),
    onSuccess: () => {
      toast.success("Question updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["questions", courseId] });
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      router.push(routes.courseQuestions(courseId));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update question");
    },
  });

  // Form validation
  const isFormValid = () => {
    if (!formData.question.trim()) return false;
    
    const validOptions = options.filter(opt => opt.option.trim() !== "");
    if (validOptions.length < 2) return false;
    
    const correctOptions = validOptions.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) return false;
    
    // For true/false, only one correct answer allowed
    if (formData.type === "true-false" && correctOptions.length > 1) return false;
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    const validOptions = options.filter(opt => opt.option.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    const correctOptions = validOptions.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      toast.error("At least one correct answer is required");
      return;
    }

    // For true/false, only one correct answer allowed
    if (formData.type === "true-false" && correctOptions.length > 1) {
      toast.error("True/False questions can only have one correct answer");
      return;
    }

    // Ensure points is a valid number
    const points = typeof formData.points === 'number' ? formData.points : parseInt(formData.points) || 1;
    if (points < 1 || points > 10) {
      toast.error("Points must be between 1 and 10");
      return;
    }

    const submitData: UpdateQuestion = {
      question: formData.question,
      options: validOptions.map(opt => ({
        option: opt.option,
        isCorrect: opt.isCorrect,
        _id: opt._id,
      })),
      points: points,
      type: formData.type,
    };

    updateQuestion(submitData);
  };

  const addOption = () => {
    if (formData.type === "true-false") return; // Disable for true/false
    setOptions([...options, { option: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (formData.type === "true-false") return; // Disable for true/false
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof Option, value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const toggleCorrectAnswer = (index: number) => {
    if (formData.type === "true-false") {
      // For true/false, only one option can be correct
      const newOptions = options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index ? !opt.isCorrect : false
      }));
      setOptions(newOptions);
    } else {
      // For multiple choice, multiple options can be correct
      updateOption(index, "isCorrect", !options[index].isCorrect);
    }
  };

  const handleTypeChange = (value: string) => {
    setFormData({ ...formData, type: value });
  };

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-white/70">Failed to load question</p>
            <Link href={routes.courseQuestions(courseId)}>
              <Button variant="ghost" className="mt-4 text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Questions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingQuestion) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-3" />
            <p className="text-white/70">Loading question...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={routes.courseQuestions(courseId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white cursor-pointer">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Questions
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Question</h1>
              <p className="text-white/70">Update the question details</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Details */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <FileQuestion className="w-5 h-5 mr-2" />
              Question Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="question" className="text-white mb-2 block">
                  Question Text *
                </Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter your question here..."
                  className="min-h-[100px]"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="points" className="text-white mb-2 block flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    Points
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.points}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        // Allow empty field while typing
                        setFormData({ ...formData, points: '' as any });
                      } else {
                        const parsedValue = parseInt(value);
                        if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 10) {
                          setFormData({ ...formData, points: parsedValue });
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure we have a valid value when field loses focus
                      const value = parseInt(e.target.value);
                      if (isNaN(value) || value < 1) {
                        setFormData({ ...formData, points: 1 });
                      } else if (value > 10) {
                        setFormData({ ...formData, points: 10 });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="type" className="text-white mb-2 block">
                    Question Type
                  </Label>
                  {existingQuestion ? (
                    <Select 
                      key={`question-type-${existingQuestion._id}`}
                      value={formData.type || "multiple-choice"} 
                      onValueChange={handleTypeChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-purple-300" />
                            <span>Multiple Choice</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="true-false">
                          <div className="flex items-center gap-2">
                            <ToggleLeft className="w-4 h-4 text-blue-300" />
                            <span>True/False</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="glass-input h-12 rounded-xl border-0 flex items-center px-3 text-white/50">
                      Loading question type...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Answer Options */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Answer Options
              </h2>
              <Button
                type="button"
                onClick={addOption}
                variant="ghost"
                disabled={formData.type === "true-false"}
                className={cn(
                  "text-purple-400 hover:bg-purple-500/20 hover:text-purple-300",
                  formData.type === "true-false" 
                    ? "opacity-50 cursor-not-allowed" 
                    : "cursor-pointer"
                )}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>

            <div className="space-y-4">
              {options.map((option, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border transition-all duration-200",
                    option.isCorrect 
                      ? "bg-green-500/20 border-green-500/50" 
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => toggleCorrectAnswer(index)}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      {option.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/40 hover:text-white/60" />
                      )}
                    </button>
                    
                    <Input
                      value={option.option}
                      onChange={(e) => updateOption(index, "option", e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                      disabled={formData.type === "true-false"}
                    />
                    
                    {options.length > 2 && formData.type !== "true-false" && (
                      <Button
                        type="button"
                        onClick={() => removeOption(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/20 hover:text-red-300 flex-shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {option.isCorrect && (
                    <p className="text-green-300 text-xs mt-2 ml-8">
                      ✓ Correct answer
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-300 text-sm">
                💡 {formData.type === "true-false" 
                  ? "Click the circle icon to mark the correct answer. Only one answer can be correct for True/False questions."
                  : "Click the circle icon to mark correct answers. You can have multiple correct answers for Multiple Choice questions."
                }
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="text-white/70">
                <p className="text-sm">
                  {options.filter(opt => opt.option.trim() !== "").length} options • {options.filter(opt => opt.isCorrect).length} correct
                </p>
              </div>
              <div className="flex space-x-3">
                <Link href={routes.courseQuestions(courseId)}>
                  <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white cursor-pointer">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isUpdating || !isFormValid()}
                  className={cn(
                    "glass-button",
                    isUpdating || !isFormValid() 
                      ? "cursor-not-allowed opacity-50" 
                      : "cursor-pointer"
                  )}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isUpdating ? "Updating..." : "Update Question"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 