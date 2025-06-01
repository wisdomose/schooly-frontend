import { User } from "../user/type";

export type FileObject = {
  _id?: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

export type ReadBy = {
  user: string | User;
  readAt: Date;
};

export type Message = {
  _id: string;
  from: string | User;
  room: string;
  type: "TEXT" | "MEDIA" | "FILE";
  content: string;
  media?: FileObject[];
  files?: FileObject[];
  replyTo?: string | Message;
  readBy: ReadBy[];
  deletedFor: string[] | User[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMessage = {
  room: string;
  type: "TEXT" | "MEDIA" | "FILE";
  content: string;
  media?: FileObject[];
  files?: FileObject[];
  replyTo?: string;
};

export type UpdateMessage = Partial<Pick<Message, "content">>;

export type MessageQuery = {
  page?: number;
  limit?: number;
  room?: string;
  from?: string;
  type?: "TEXT" | "MEDIA" | "FILE";
  before?: string;
}; 