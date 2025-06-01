export const pages = {
  login: {
    name: "Login",
    path: "/login",
  },
  signup: {
    name: "Signup",
    path: "/",
  },
  profile: {
    name: "Profile",
    path: "/profile",
    protected: true,
  },
  dashboard: {
    name: "Dashboard",
    path: "/dashboard",
    protected: true,
    roles: ["admin", "instructor", "student"], // All roles can see dashboard
  },
  courses: {
    name: "Courses",
    path: "/courses",
    protected: true,
    roles: ["admin", "instructor", "student"], // All roles can see courses
  },
  createCourse: {
    name: "Create Course",
    path: "/courses/create",
    protected: true,
    roles: ["admin", "instructor"], // Only admin and instructors can create courses
  },
  students: {
    name: "Students",
    path: "/students",
    protected: true,
    roles: ["admin", "instructor"], // Only admin and instructors can see students
  },
  schedule: {
    name: "Schedule",
    path: "/schedule",
    protected: true,
    roles: ["admin", "instructor", "student"], // All roles can see schedule
  },
  notification: {
    name: "Notifications",
    path: "/notification",
    protected: true,
    roles: ["admin", "instructor", "student"], // All roles can see notifications
  },
};
