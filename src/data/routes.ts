import { pages } from "./pages";

export const routes = {
  /**
   * Get the profile page path
   */
  profile: () => pages.profile.path,

  /**
   * Get the login page path
   */
  login: () => pages.login.path,

  /**
   * Get the signup page path
   */
  signup: () => pages.signup.path,

  /**
   * Get the dashboard page path
   */
  dashboard: () => pages.dashboard.path,

  /**
   * Get the courses page path
   */
  courses: () => pages.courses.path,

  /**
   * Get the create course page path
   */
  createCourse: () => pages.createCourse.path,

  /**
   * Get the course details page path
   */
  courseDetails: (id: string) => `/courses/${id}`,

  /**
   * Get the course edit page path
   */
  courseEdit: (id: string) => `/courses/${id}/edit`,

  /**
   * Get the course room page path
   */
  courseRoom: (id: string) => `/courses/${id}/room`,

  /**
   * Get the course quizzes page path
   */
  courseQuizzes: (id: string) => `/courses/${id}/quizzes`,

  /**
   * Get the create quiz page path
   */
  createQuiz: (courseId: string) => `/courses/${courseId}/quizzes/create`,

  /**
   * Get the take quiz page path
   */
  takeQuiz: (courseId: string, quizId: string) => `/courses/${courseId}/quizzes/${quizId}/take`,

  /**
   * Get the quiz results page path
   */
  quizResults: (courseId: string, quizId: string) => `/courses/${courseId}/quizzes/${quizId}/result`,

  /**
   * Get the edit quiz page path
   */
  editQuiz: (courseId: string, quizId: string) => `/courses/${courseId}/quizzes/${quizId}/edit`,

  /**
   * Get the quiz statistics page path
   */
  quizStatistics: (courseId: string, quizId: string) => `/courses/${courseId}/quizzes/${quizId}/statistics`,

  /**
   * Get the course assignments page path
   */
  courseAssignments: (courseId: string) => `/courses/${courseId}/assignments`,

  /**
   * Get the create assignment page path
   */
  createAssignment: (courseId: string) => `/courses/${courseId}/assignments/create`,

  /**
   * Get the assignment details page path
   */
  assignmentDetails: (courseId: string, assignmentId: string) => `/courses/${courseId}/assignments/${assignmentId}`,

  /**
   * Get the edit assignment page path
   */
  editAssignment: (courseId: string, assignmentId: string) => `/courses/${courseId}/assignments/${assignmentId}/edit`,

  /**
   * Get the assignment submissions page path (for instructors)
   */
  assignmentSubmissions: (courseId: string, assignmentId: string) => `/courses/${courseId}/assignments/${assignmentId}/submissions`,

  /**
   * Get the submission details page path
   */
  submissionDetails: (courseId: string, assignmentId: string, submissionId: string) => `/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}`,

  /**
   * Get the grade submission page path
   */
  gradeSubmission: (courseId: string, assignmentId: string, submissionId: string) => `/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,

  /**
   * Get the course questions page path
   */
  courseQuestions: (courseId: string) => `/courses/${courseId}/questions`,

  /**
   * Get the create question page path
   */
  createQuestion: (courseId: string) => `/courses/${courseId}/questions/create`,

  /**
   * Get the edit question page path
   */
  editQuestion: (courseId: string, questionId: string) => `/courses/${courseId}/questions/${questionId}/edit`,

  /**
   * Get the students page path
   */
  students: () => pages.students.path,

  /**
   * Get the schedule page path
   */
  schedule: () => pages.schedule.path,

  /**
   * Get the notifications page path
   */
  notification: () => pages.notification.path,

  /**
   * Get the rooms page path
   */
  rooms: () => "/rooms",

  /**
   * Get the create room page path
   */
  createRoom: () => "/rooms/create",

  /**
   * Get the room details page path
   */
  roomDetails: (roomId: string) => `/rooms/${roomId}`,

  /**
   * Get the room edit page path
   */
  editRoom: (roomId: string) => `/rooms/${roomId}/edit`,
};

/**
 * Get navigation items filtered by user role
 */
export const getNavigationItems = (userRole: string) => {
  const allNavItems = [
    { key: 'dashboard', page: pages.dashboard },
    { key: 'courses', page: pages.courses },
    { key: 'students', page: pages.students },
    { key: 'schedule', page: pages.schedule },
  ];

  return allNavItems.filter(item => 
    item.page.roles && item.page.roles.includes(userRole)
  );
};
