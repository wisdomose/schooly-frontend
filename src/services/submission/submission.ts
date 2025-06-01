import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { Submission, CreateSubmission, UpdateSubmission, GradeSubmission, SubmissionQuery, UserSubmissionQuery } from "./type";

export default class SubmissionService {
  private basePath = "/submission";

  async create(params: CreateSubmission) {
    try {
      const path = `${this.basePath}`;
      const response = await api.post<ApiResponse<Submission>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to create submission");
    }
  }

  async findAll(params?: SubmissionQuery) {
    try {
      const path = `${this.basePath}`;
      const response = await api.get<ApiResponse<{ submissions: Submission[]; pagination: Pagination }>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch submissions");
    }
  }

  async findMySubmissions(params?: UserSubmissionQuery) {
    try {
      const path = `${this.basePath}/my/submissions`;
      const response = await api.get<{
        message: string;
        data: Submission[];
        pagination: Pagination;
      }>(path, {
        params,
      });
      return { submissions: response.data.data || [], pagination: response.data.pagination };
    } catch (error) {
      handleApiError(error, "Failed to fetch my submissions");
    }
  }

  async findOne(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.get<ApiResponse<Submission>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch submission");
    }
  }

  async update(id: string, params: UpdateSubmission) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.put<ApiResponse<Submission>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update submission");
    }
  }

  async grade(id: string, params: GradeSubmission) {
    try {
      const path = `${this.basePath}/${id}/grade`;
      const response = await api.patch<ApiResponse<Submission>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to grade submission");
    }
  }

  async delete(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.delete<ApiResponse<undefined>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to delete submission");
    }
  }
} 