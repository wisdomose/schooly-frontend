import { User } from "../user/type";
import { Course, File } from "../course/type";

export type Assignment = {
  _id: string;
  title: string;
  description: string;
  course: string | Course;
  creator: string | User;
  isGroupProject: boolean;
  maxGroupSize: number;
  dueDate: Date;
  instructions?: string;
  attachments: File[];
  status: "draft" | "published" | "closed";
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAssignment = Pick<Assignment, "title" | "description"> & {
  course: string;
  dueDate: string | Date;
  isGroupProject?: boolean;
  maxGroupSize?: number;
  instructions?: string;
  attachments?: File[];
  status?: "draft" | "published";
};

export type UpdateAssignment = Partial<Pick<Assignment, "title" | "description" | "isGroupProject" | "maxGroupSize" | "instructions" | "attachments" | "status">> & {
  dueDate?: string | Date;
};

export type AssignmentQuery = {
  page?: number;
  limit?: number;
  course?: string;
  creator?: string;
  status?: "draft" | "published" | "closed";
}; 