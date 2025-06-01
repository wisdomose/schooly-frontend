import api from "@/lib/api";
import { handleApiError } from "@/lib/utils";
import { ApiResponse } from "@/types";

export type UploadedFile = {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

export default class FileService {
  private basePath = "/file";

  async upload(file: File): Promise<UploadedFile> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<ApiResponse<UploadedFile>>(
        `${this.basePath}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 120000, // 2 minutes timeout for file uploads
        }
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error, "Failed to upload file");
      throw error;
    }
  }
} 