import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { Question, CreateQuestion, UpdateQuestion, QuestionQuery } from "./type";

export default class QuestionService {
  private basePath = "/question";

  async create(params: CreateQuestion) {
    try {
      const path = `${this.basePath}/single`;
      const response = await api.post<ApiResponse<Question>>(path, {
        courseId: params.course,
        question: params.question,
        options: params.options,
        points: params.points || 1,
        type: params.type || "multiple-choice",
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to create question");
    }
  }

  async findAll(params?: QuestionQuery) {
    try {
      const path = params?.course 
        ? `${this.basePath}/course/${params.course}`
        : `${this.basePath}`;
      const response = await api.get<ApiResponse<Question[]>>(path, {
        params: params?.course ? undefined : params,
      });
      return { questions: response.data.data, pagination: { total: response.data.data.length, page: 1, limit: 50 } };
    } catch (error) {
      handleApiError(error, "Failed to fetch questions");
    }
  }

  async findOne(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.get<ApiResponse<Question>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch question");
    }
  }

  async update(id: string, params: UpdateQuestion) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.put<ApiResponse<Question>>(path, {
        question: params.question,
        options: params.options,
        points: params.points,
        type: params.type,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update question");
    }
  }

  async delete(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.delete<ApiResponse<undefined>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to delete question");
    }
  }
} 