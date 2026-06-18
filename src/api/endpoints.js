import { callGateway, uploadFile } from "./client";

export const authApi = {
  login: (payload, options) => callGateway("login", payload, options),
  register: (payload, options) => callGateway("register", payload, options),
  refresh: (payload, options) => callGateway("refresh_token", payload, options),
  logout: (payload = {}, options) => callGateway("logout", payload, options),
  sendOtp: (payload, options) => callGateway("send_otp", payload, options),
  verifyOtp: (payload, options) => callGateway("verify_otp", payload, options),
  resetPassword: (payload, options) => callGateway("reset_password", payload, options),
};

export const profileApi = {
  me: (options) => callGateway("get_user_profile", {}, options),
  update: (payload, options) => callGateway("update_profile", payload, options),
  getBalance: (options) => callGateway("get_balance", {}, options),
  topUpBalance: (payload, options) => callGateway("top_up_balance", payload, options),
  getNotifications: (filters = {}, options) => callGateway("get_notifications", filters, options),
  getTransactions: (filters = {}, options) => callGateway("get_transactions", filters, options),
};

export const homeApi = {
  getData: (options) => callGateway("get_home_data", {}, options),
};

export const fileApi = {
  upload: (file, options) => uploadFile(file, options),
};

export const instructorApi = {
  getStudents: (courseId, options) =>
    callGateway("get_course_students", { courses_id: courseId }, options),
};

export const courseApi = {
  getCatalog: (filters = {}, options) => callGateway("get_courses", filters, options),
  /** lms-qobulov gateway expects `courses_id`, not `course_id`. */
  getById: (courseId, options) =>
    callGateway("get_course_details", { courses_id: courseId }, options),
  getInstructorDashboard: (options) =>
    callGateway("get_instructor_dashboard", {}, options),
  create: (payload, options) => callGateway("create_course", payload, options),
  update: (courseId, payload, options) =>
    callGateway("update_course", { courses_id: courseId, ...payload }, options),
  addModule: (payload, options) => callGateway("create_module", payload, options),
  addLesson: (payload, options) => callGateway("create_lesson", payload, options),
  updateLesson: (courseId, lessonId, payload, options) =>
    callGateway(
      "update_lesson",
      { courses_id: courseId, lesson_id: lessonId, ...payload },
      options,
    ),
};

export const enrollmentApi = {
  enroll: (payload, options) => callGateway("enroll_course", payload, options),
  myCourses: (options) => callGateway("get_my_courses", {}, options),
  getLessonViewer: (courseId, lessonId, options) =>
    callGateway(
      "get_lesson_viewer",
      { courses_id: courseId, lesson_id: lessonId },
      options,
    ),
  completeLesson: (payload, options) =>
    callGateway("log_lesson_progress", payload, options),
};

export const quizApi = {
  get: (courseId, options) => callGateway("get_quiz", { courses_id: courseId }, options),
  list: (courseId, options) =>
    callGateway("get_course_quizzes", { courses_id: courseId }, options),
  detail: (quizId, options) =>
    callGateway("get_quiz_detail", { quiz_id: quizId }, options),
  submitAttempt: (payload, options) =>
    callGateway("submit_quiz_attempt", payload, options),
  create: (payload, options) => callGateway("create_quiz", payload, options),
  update: (payload, options) => callGateway("update_quiz", payload, options),
};

export const reviewApi = {
  create: (payload, options) => callGateway("create_course_review", payload, options),
};

export const adminApi = {
  getFinanceSummary: (filters = {}, options) =>
    callGateway("get_finance_summary", filters, options),
  getUsers: (filters = {}, options) => callGateway("get_users", filters, options),
  getReports: (filters = {}, options) => callGateway("get_reports", filters, options),
  getBalance: (options) =>
    callGateway("get_balance", {}, options),
  getInstructors: (options) =>
    callGateway("get_instructors", {}, options),
  getInstructorPayouts: (filters = {}, options) =>
    callGateway("get_instructor_payouts", filters, options),
  createPayout: (payload, options) =>
    callGateway("create_instructor_payout", payload, options),
  getTransactions: (filters = {}, options) =>
    callGateway("get_transactions", filters, options),
};

export const certificateApi = {
  verifyById: (certificateId, options) =>
    callGateway("verify_certificate", { certificate_id: certificateId }, options),
  getMine: (options) => callGateway("get_my_certificates", {}, options),
};
