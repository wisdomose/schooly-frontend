import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse, Pagination } from "@/types";
import { CreateNotification, Notification, NotificationQuery } from "./type";

export default class NotificationService {
  private basePath = "/notification";

  async findAll(params: NotificationQuery) {
    try {
      const path = `${this.basePath}`;
      const response = await api.get<ApiResponse<{notifications:Notification[];pagination:Pagination}>>(path, {
        params,
      });

      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to find notifications");
    }
  }
}
