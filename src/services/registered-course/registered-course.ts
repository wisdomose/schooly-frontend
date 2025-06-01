import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { RegisteredCourse, CreateRegisteredCourse, RegisteredCourseQuery } from "./type";

export default class RegisteredCourseService {
  private basePath = "/registered-course";

  async create(params: CreateRegisteredCourse) {
    try {
      const path = `${this.basePath}`;
      const response = await api.post<ApiResponse<RegisteredCourse>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to register for course");
    }
  }

  async findAll(params?: RegisteredCourseQuery) {
    try {
      const path = `${this.basePath}`;
      const response = await api.get<ApiResponse<{ registeredCourses: RegisteredCourse[]; pagination: Pagination }>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch registered courses");
    }
  }

  async findOne(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.get<ApiResponse<RegisteredCourse>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch registered course");
    }
  }

  async delete(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.delete<ApiResponse<undefined>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to unregister from course");
    }
  }
} 