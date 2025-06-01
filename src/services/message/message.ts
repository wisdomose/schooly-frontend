import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { Message, CreateMessage, UpdateMessage, MessageQuery } from "./type";

export default class MessageService {
  private basePath = "/message";

  async create(params: CreateMessage) {
    try {
      const path = `${this.basePath}`;
      const response = await api.post<ApiResponse<Message>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to send message");
    }
  }

  async findAll(params?: MessageQuery) {
    try {
      const path = `${this.basePath}`;
      const response = await api.get<ApiResponse<{ messages: Message[]; pagination: Pagination }>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch messages");
    }
  }

  async findOne(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.get<ApiResponse<Message>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch message");
    }
  }

  async update(id: string, params: UpdateMessage) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.put<ApiResponse<Message>>(path, params);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to update message");
    }
  }

  async delete(id: string) {
    try {
      const path = `${this.basePath}/${id}`;
      const response = await api.delete<ApiResponse<undefined>>(path);
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to delete message");
    }
  }

  async markAsRead(roomId: string, messageId: string) {
    try {
      const path = `${this.basePath}/${messageId}/read`;
      const response = await api.patch<ApiResponse<Message>>(path, { roomId });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to mark message as read");
    }
  }

  async getByRoom(roomId: string, params?: Omit<MessageQuery, "room">) {
    try {
      const path = `${this.basePath}/${roomId}`;
      const response = await api.get<ApiResponse<Message[]>>(path, {
        params,
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch room messages");
    }
  }
} 