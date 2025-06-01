import { User } from "../user/type";
import { Course } from "../course/type";

export type RegisteredCourse = {
  _id: string;
  course: string | Course;
  user: string | User;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateRegisteredCourse = {
  course: string;
};

export type RegisteredCourseQuery = {
  page?: number;
  limit?: number;
  course?: string;
  user?: string;
}; 