import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { Course, CreateCourse, UpdateCourse, CourseQuery } from "./type";

export default class CourseService {
  private basePath = "/course";

  async create(params: CreateCourse) {
    try {
      const path = `${this.basePath}`;
      const response = await api.post<ApiResponse<Course>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to create course");
    }
  }

  async findAll(params?: CourseQuery) {
    try {
      const path = `${this.basePath}`;
      const response = await api.get<ApiResponse<{ courses: Course[]; pagination: Pagination }>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch courses");
    }
  }

  async findOne(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.get<ApiResponse<Course>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch course");
    }
  }

  async update(id: string, params: UpdateCourse) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.put<ApiResponse<Course>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update course");
    }
  }

  async delete(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.delete<ApiResponse<undefined>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to delete course");
    }
  }

  async register(id: string) {
    try {
      const path = `${this.basePath}/${id}/register`;
      const response = await api.post<ApiResponse<any>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to register for course");
    }
  }

  async checkRegistrationStatus(id: string) {
    try {
      const path = `/registered-course/course/${id}/check`;
      const response = await api.get<ApiResponse<any>>(path);
      return response.data.data;
    } catch (error) {
      // If the endpoint returns 404/error, it means not registered
      return null;
    }
  }
} 