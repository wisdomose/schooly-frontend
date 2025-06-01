import { User } from "../user/type";
import { Course } from "../course/type";
import { Question } from "../question/type";

export type Quiz = {
  _id: string;
  title: string;
  description?: string;
  course: string | Course;
  creator: string | User;
  questions: string[] | Question[];
  timeLimit: number;
  totalPoints: number;
  isActive: boolean;
  dueDate?: Date;
  allowMultipleAttempts: boolean;
  showCorrectAnswers: boolean;
  shuffleQuestions: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AnswerSubmission = {
  question: string | Question;
  selectedOption: string;
  isCorrect: boolean;
  points: number;
};

export type QuizAttempt = {
  _id: string;
  quiz: string | Quiz;
  user: string | User;
  answers: AnswerSubmission[];
  startedAt: Date;
  submittedAt?: Date;
  isCompleted: boolean;
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateQuiz = {
  title: string;
  description?: string;
  course: string;
  questions?: string[];
  timeLimit?: number;
  isActive?: boolean;
  dueDate?: string;
  allowMultipleAttempts?: boolean;
  showCorrectAnswers?: boolean;
  shuffleQuestions?: boolean;
};

export type UpdateQuiz = Partial<Omit<CreateQuiz, 'course'>>;

export type QuizQuery = {
  page?: number;
  limit?: number;
  isActive?: boolean;
};

export type StartQuizAttempt = {
  quizId: string;
};

export type SubmitQuizAttempt = {
  answers: {
    questionId: string;
    selectedOption: string;
  }[];
};

export type QuizStatistics = {
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  lowestScore: number;
  attempts: QuizAttempt[];
}; 