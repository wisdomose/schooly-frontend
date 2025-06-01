import { User } from "../user/type";
import { Assignment } from "../assignment/type";
import { File } from "../course/type";

export type Submission = {
  _id: string;
  assignment: string | Assignment;
  submittedBy: string | User;
  groupMembers: string[] | User[];
  content?: string;
  attachments: File[];
  submittedAt: Date;
  status: "submitted" | "graded" | "returned";
  grade?: number;
  feedback?: string;
  gradedBy?: string | User;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSubmission = {
  assignment: string;
  content?: string;
  attachments?: File[];
  groupMembers?: string[];
};

export type UpdateSubmission = Partial<Pick<Submission, "content" | "groupMembers">> & {
  attachments?: File[];
};

export type GradeSubmission = {
  grade: number;
  feedback?: string;
};

export type SubmissionQuery = {
  page?: number;
  limit?: number;
  assignment?: string;
  submittedBy?: string;
  status?: "submitted" | "graded" | "returned";
};

export type UserSubmissionQuery = {
  page?: number;
  limit?: number;
  course?: string;
  assignment?: string;
  status?: "submitted" | "graded" | "returned";
}; 