export type User = {
  _id: string;
  fullname: string;
  email: string;
  role: "student" | "instructor" | "admin";
  gender: "male" | "female";
  dateOfBirth: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUser = Omit<User, "_id" | "createdAt" | "updatedAt"> & {
  password: string;
};

export type LoginUser = Pick<User, "email"> & { password: string };
