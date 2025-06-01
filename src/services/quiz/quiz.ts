import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { 
  Quiz, 
  QuizAttempt, 
  CreateQuiz, 
  UpdateQuiz, 
  QuizQuery, 
  StartQuizAttempt, 
  SubmitQuizAttempt,
  QuizStatistics 
} from "./type";

export default class QuizService {
  private basePath = "/quiz";
  private attemptPath = "/quiz-attempt";

  // Quiz CRUD operations
  async create(data: CreateQuiz) {
    try {
      const response = await api.post<ApiResponse<Quiz>>(this.basePath, data);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to create quiz");
    }
  }

  async findAll(params?: QuizQuery & { courseId?: string }) {
    try {
      const path = params?.courseId 
        ? `${this.basePath}/course/${params.courseId}`
        : this.basePath;
      const response = await api.get<ApiResponse<{ quizzes: Quiz[]; pagination: Pagination }>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch quizzes");
    }
  }

  async findOne(id: string) {
    try {
      const response = await api.get<ApiResponse<Quiz>>(`${this.basePath}/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch quiz");
    }
  }

  async update(id: string, data: UpdateQuiz) {
    try {
      const response = await api.put<ApiResponse<Quiz>>(`${this.basePath}/${id}`, data);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update quiz");
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete<ApiResponse<null>>(`${this.basePath}/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to delete quiz");
    }
  }

  // Question management
  async addQuestion(quizId: string, questionId: string) {
    try {
      const response = await api.post<ApiResponse<Quiz>>(`${this.basePath}/${quizId}/questions`, {
        questionId,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to add question to quiz");
    }
  }

  async removeQuestion(quizId: string, questionId: string) {
    try {
      const response = await api.delete<ApiResponse<Quiz>>(`${this.basePath}/${quizId}/questions/${questionId}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to remove question from quiz");
    }
  }

  // Quiz attempts
  async startAttempt(quizId: string) {
    try {
      const response = await api.post<ApiResponse<QuizAttempt>>(`${this.attemptPath}/${quizId}/start`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to start quiz attempt");
    }
  }

  async saveProgress(attemptId: string, data: SubmitQuizAttempt) {
    try {
      const response = await api.post<ApiResponse<QuizAttempt>>(`${this.attemptPath}/${attemptId}/save-progress`, data);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to save quiz progress");
    }
  }

  async submitAttempt(attemptId: string, data: SubmitQuizAttempt) {
    try {
      const response = await api.post<ApiResponse<QuizAttempt>>(`${this.attemptPath}/${attemptId}/submit`, data);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to submit quiz attempt");
    }
  }

  async getAttempt(attemptId: string) {
    try {
      const response = await api.get<ApiResponse<QuizAttempt>>(`${this.attemptPath}/${attemptId}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch quiz attempt");
    }
  }

  async getUserAttempts(params?: { quizId?: string; page?: number; limit?: number }) {
    try {
      const response = await api.get<ApiResponse<{ attempts: QuizAttempt[]; pagination: Pagination }>>(
        `${this.attemptPath}/user`, 
        { params }
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch user attempts");
    }
  }

  async getQuizStatistics(quizId: string) {
    try {
      const response = await api.get<ApiResponse<QuizStatistics>>(`${this.attemptPath}/quiz/${quizId}/statistics`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch quiz statistics");
    }
  }

  async getQuizAttempts(quizId: string, params?: { page?: number; limit?: number }) {
    try {
      const response = await api.get<ApiResponse<{ attempts: QuizAttempt[]; pagination: Pagination }>>(
        `${this.attemptPath}/quiz/${quizId}`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch quiz attempts");
    }
  }
} 