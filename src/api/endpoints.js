import { callGateway } from "./client";

export const authApi = {
  login: (payload, options) => callGateway("login", payload, options),
  register: (payload, options) => callGateway("register", payload, options),
  refresh: (payload, options) => callGateway("refresh_token", payload, options),
  logout: (payload = {}, options) => callGateway("logout", payload, options),
};

export const profileApi = {
  me: (options) => callGateway("get_user_profile", {}, options),
  update: (payload, options) => callGateway("update_profile", payload, options),
};

export const courseApi = {
  getCatalog: (filters = {}, options) => callGateway("get_courses", filters, options),
  getById: (courseId, options) =>
    callGateway("get_course_details", { course_id: courseId }, options),
  create: (payload, options) => callGateway("create_course", payload, options),
  update: (courseId, payload, options) =>
    callGateway("update_course", { course_id: courseId, ...payload }, options),
  addModule: (payload, options) => callGateway("create_module", payload, options),
  addLesson: (payload, options) => callGateway("create_lesson", payload, options),
};

export const enrollmentApi = {
  enroll: (payload, options) => callGateway("enroll_course", payload, options),
  myCourses: (options) => callGateway("get_my_courses", {}, options),
  completeLesson: (payload, options) =>
    callGateway("log_lesson_progress", payload, options),
};

export const quizApi = {
  submitAttempt: (payload, options) =>
    callGateway("submit_quiz_attempt", payload, options),
};

export const reviewApi = {
  create: (payload, options) => callGateway("create_course_review", payload, options),
};

export const adminApi = {
  getFinanceSummary: (filters = {}, options) =>
    callGateway("get_finance_summary", filters, options),
  getUsers: (filters = {}, options) => callGateway("get_users", filters, options),
  getReports: (filters = {}, options) => callGateway("get_reports", filters, options),
};

export const certificateApi = {
  verifyById: (certificateId, options) =>
    callGateway("verify_certificate", { certificate_id: certificateId }, options),
};
