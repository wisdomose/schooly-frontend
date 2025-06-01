import { User } from "../user/type";
import { Course } from "../course/type";
import { Assignment } from "../assignment/type";

export type Room = {
  _id: string;
  name: string;
  purpose: string;
  members: string[] | User[];
  creator: string | User;
  course?: string | Course;
  assignment?: string | Assignment;
  lastMessage?: string;
  unreadCount: Map<string, number>;
  isGroup: boolean;
  roomType: "course" | "assignment" | "general" | "study_group";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateRoom = {
  name: string;
  purpose: string;
  members: string[];
  course?: string;
  assignment?: string;
  isGroup?: boolean;
  roomType?: "course" | "assignment" | "general" | "study_group";
};

export type UpdateRoom = Partial<Pick<Room, "name" | "purpose" | "members" | "isActive">>;

export type RoomQuery = {
  page?: number;
  limit?: number;
  creator?: string;
  course?: string;
  assignment?: string;
  roomType?: "course" | "assignment" | "general" | "study_group";
  isActive?: boolean;
}; 