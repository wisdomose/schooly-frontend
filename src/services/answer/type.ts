import { User } from "../user/type";
import { Question } from "../question/type";

export type Answer = {
  _id: string;
  user: string | User;
  question: string | Question;
  option: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAnswer = {
  question: string;
  option: string;
};

export type UpdateAnswer = {
  option: string;
};

export type AnswerQuery = {
  page?: number;
  limit?: number;
  user?: string;
  question?: string;
}; 