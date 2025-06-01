import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { Room, CreateRoom, UpdateRoom, RoomQuery } from "./type";

export default class RoomService {
  private basePath = "/room";

  async create(params: CreateRoom) {
    try {
      const path = `${this.basePath}`;
      const response = await api.post<ApiResponse<Room>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to create room");
    }
  }

  async findAll(params?: RoomQuery) {
    try {
      const path = `${this.basePath}`;
      const response = await api.get<ApiResponse<{ rooms: Room[]; pagination: Pagination }>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch rooms");
    }
  }

  async findOne(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.get<ApiResponse<Room>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch room");
    }
  }

  async update(id: string, params: UpdateRoom) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.put<ApiResponse<Room>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update room");
    }
  }

  async delete(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.delete<ApiResponse<undefined>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to delete room");
    }
  }

  async getUserRooms(params?: { page?: number; limit?: number; roomType?: string }) {
    try {
      const path = `${this.basePath}/my/rooms`;
      const response = await api.get<ApiResponse<Room[]>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch user rooms");
    }
  }

  async addMember(roomId: string, userId: string) {
    try {
      const path = `${this.basePath}/${roomId}/members`;
      const response = await api.post<ApiResponse<Room>>(path, { userId });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to add member to room");
    }
  }

  async removeMember(roomId: string, userId: string) {
    try {
      const path = `${this.basePath}/${roomId}/members`;
      const response = await api.delete<ApiResponse<Room>>(path, { data: { userId } });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to remove member from room");
    }
  }

  async findByCourse(courseId: string) {
    try {
      const path = `${this.basePath}/course/${courseId}`;
      const response = await api.get<ApiResponse<Room>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch course room");
    }
  }

  async join(id: string) {
    try {
      const path = `${this.basePath}/${id}/join`;
      const response = await api.post<ApiResponse<Room>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to join room");
    }
  }

  async leave(id: string) {
    try {
      const path = `${this.basePath}/${id}/leave`;
      const response = await api.post<ApiResponse<Room>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to leave room");
    }
  }
} 