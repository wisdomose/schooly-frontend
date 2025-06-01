import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { Assignment, CreateAssignment, UpdateAssignment, AssignmentQuery } from "./type";

export default class AssignmentService {
  private basePath = "/assignment";

  async create(params: CreateAssignment) {
    try {
      const path = `${this.basePath}`;
      const response = await api.post<ApiResponse<Assignment>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to create assignment");
    }
  }

  async findAll(params?: AssignmentQuery) {
    try {
      // If course is specified, use the course-specific endpoint
      if (params?.course) {
        return this.findByCourse(params.course, params);
      }
      
      const path = `${this.basePath}`;
      const response = await api.get<ApiResponse<{ assignments: Assignment[]; pagination: Pagination }>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch assignments");
    }
  }

  async findByCourse(courseId: string, params?: Omit<AssignmentQuery, 'course'>) {
    try {
      const path = `${this.basePath}/course/${courseId}`;
      const response = await api.get<ApiResponse<{ assignments: Assignment[]; pagination: Pagination }>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch assignments for course");
    }
  }

  async findOne(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.get<ApiResponse<Assignment>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch assignment");
    }
  }

  async update(id: string, params: UpdateAssignment) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.put<ApiResponse<Assignment>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update assignment");
    }
  }

  async delete(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.delete<ApiResponse<undefined>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to delete assignment");
    }
  }

  async getSubmissions(id: string) {
    try {
      const path = `/submission/assignment/${id}`;
      const response = await api.get<ApiResponse<{ submissions: any[]; pagination: Pagination }>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch assignment submissions");
    }
  }

  async getStudentSubmission(id: string, studentId?: string) {
    try {
      // Get user's own submission for the assignment
      const path = `/submission/my/submissions`;
      const response = await api.get<ApiResponse<any[]>>(path, {
        params: { assignment: id },
      });
      
      // Find the submission for this assignment
      const submissions = response.data.data || [];
      const submission = submissions.find((sub: any) => {
        // Check if assignment matches (handle both string and object assignment)
        const assignmentId = typeof sub.assignment === 'object' ? sub.assignment._id : sub.assignment;
        return assignmentId === id;
      });
      
      return submission || null;
    } catch (error) {
      handleApiError(error, "Failed to fetch student submission");
    }
  }
} 