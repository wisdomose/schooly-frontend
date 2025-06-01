import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { Answer, CreateAnswer, UpdateAnswer, AnswerQuery } from "./type";

export default class AnswerService {
  private basePath = "/answer";

  async create(params: CreateAnswer) {
    try {
      const path = `${this.basePath}`;
      const response = await api.post<ApiResponse<Answer>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to create answer");
    }
  }

  async findAll(params?: AnswerQuery) {
    try {
      const path = `${this.basePath}`;
      const response = await api.get<ApiResponse<{ answers: Answer[]; pagination: Pagination }>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch answers");
    }
  }

  async findOne(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.get<ApiResponse<Answer>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch answer");
    }
  }

  async update(id: string, params: UpdateAnswer) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.put<ApiResponse<Answer>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update answer");
    }
  }

  async delete(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.delete<ApiResponse<undefined>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to delete answer");
    }
  }
} 