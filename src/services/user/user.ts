import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { CreateUser, LoginUser, User } from "./type";
import { ApiResponse } from "@/types";

export default class UserService {
  async signup(params: CreateUser) {
    try {
      const path = `/user/signup`;
      const response = await api.post<ApiResponse<{ message: string }>>(
        path,
        params
      );

      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to signup");
    }
  }

  async login(params: LoginUser) {
    try {
      const path = `/user/login`;
      const response = await api.post<
        ApiResponse<{ user: User; accessToken: string }>
      >(path, params);

      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to login");
    }
  }

  async findAll() {
    try {
      const path = `/user`;
      const response = await api.get<ApiResponse<User[]>>(path);

      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to get users");
    }
  }

  async searchStudents(query: string, courseId?: string) {
    try {
      const path = `/user/search/students`;
      const params: any = { search: query, limit: 10 };
      
      if (courseId) {
        params.courseId = courseId;
      }
      
      const response = await api.get<ApiResponse<User[]>>(path, {
        params
      });

      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to search students");
    }
  }

  async findOne(id: string) {
    try {
      const path = `/user/${id}`;
      const response = await api.get<ApiResponse<User>>(path);

      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to get user");
    }
  }

  async update(
    user: Partial<Pick<User, "email" | "fullname" | "gender" | "dateOfBirth">>
  ) {
    try {
      const path = `/user`;
      const response = await api.put<ApiResponse<User>>(path, user);

      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update user");
    }
  }

  async updatePassword(password: string) {
    try {
      const path = `/user/password`;
      const response = await api.patch<ApiResponse<undefined>>(path, {
        password,
      });

      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update user password");
    }
  }
}
