import { Course } from "../course/type";

export type Option = {
  isCorrect: boolean;
  option: string;
};

export type Question = {
  _id: string;
  course: string | Course;
  question: string;
  options: Option[];
  type?: string;
  points?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateQuestion = {
  course: string;
  question: string;
  options: Option[];
  points?: number;
  type?: string;
};

export type UpdateQuestion = {
  question?: string;
  options?: Option[];
  points?: number;
  type?: string;
};

export type QuestionQuery = {
  page?: number;
  limit?: number;
  course?: string;
}; 