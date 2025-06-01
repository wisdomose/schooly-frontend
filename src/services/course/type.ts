import { User } from "../user/type";

export type File = {
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

export type Course = {
  _id: string;
  creator: string | User;
  title: string;
  desc: string;
  cover?: File;
  files: File[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCourse = Pick<Course, "title" | "desc"> & {
  cover?: File;
  files: File[];
};

export type UpdateCourse = Partial<Pick<Course, "title" | "desc" | "cover" | "files">>;

export type CourseQuery = {
  page?: number;
  limit?: number;
  search?: string;
  creator?: string;
}; 