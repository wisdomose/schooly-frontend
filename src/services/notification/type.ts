import { User } from "../user/type";
import { Course } from "../course/type";
import { Assignment } from "../assignment/type";
import { Submission } from "../submission/type";
import { Quiz, QuizAttempt } from "../quiz/type";

export enum NotificationType {
  LOGIN = "LOGIN",
  SIGNUP = "SIGNUP",
  PASSWORD_UPDATED = "PASSWORD_UPDATED",
  NEW_COURSE = "NEW_COURSE",
  COURSE_UPDATED = "COURSE_UPDATED",
  COURSE_REGISTRATION = "COURSE_REGISTRATION",
  COURSE_COMPLETION = "COURSE_COMPLETION",
  QUIZ_SUBMISSION = "QUIZ_SUBMISSION",
  NEW_ASSIGNMENT = "NEW_ASSIGNMENT",
  ASSIGNMENT_UPDATED = "ASSIGNMENT_UPDATED",
  ASSIGNMENT_DUE_REMINDER = "ASSIGNMENT_DUE_REMINDER",
  SUBMISSION_RECEIVED = "SUBMISSION_RECEIVED",
  SUBMISSION_GRADED = "SUBMISSION_GRADED",
}

export type Notification = {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  user: string | User;
  isRead: boolean;
  type: NotificationType;
  msg: string;
  metadata?: {
    course?: string | Course;
    assignment?: string | Assignment;
    submission?: string | Submission;
    quiz?: string | Quiz;
    quizAttempt?: string | QuizAttempt;
    user?: string | User;
  };
};

export type CreateNotification = {
  user: string;
  type: NotificationType;
  msg: string;
};

export type NotificationQuery = {
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
};
