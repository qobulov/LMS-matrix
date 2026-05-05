/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import {
  categories,
  courses as initialCourses,
  enrollments as initialEnrollments,
  payments,
  roles,
  users as initialUsers,
} from "./mockData";

const LmsContext = createContext(null);

const SESSION_KEY = "lms_session_v1";

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("user_id");
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("user_id", session.userId);
}

function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function LmsProvider({ children }) {
  const [users, setUsers] = useState(initialUsers);
  const [courses, setCourses] = useState(initialCourses);
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [session, setSession] = useState(readSession());

  const currentUser = useMemo(
    () => users.find((user) => user.id === session?.userId) || null,
    [users, session],
  );

  const isAuthenticated = Boolean(currentUser);
  const role = currentUser?.role || null;

  const instructors = useMemo(
    () => users.filter((user) => user.role === "instructor"),
    [users],
  );

  const students = useMemo(() => users.filter((user) => user.role === "student"), [users]);

  const myEnrollments = useMemo(() => {
    if (!currentUser) return [];
    return enrollments.filter((item) => item.userId === currentUser.id);
  }, [enrollments, currentUser]);

  const enrollmentByCourseId = useMemo(() => {
    return myEnrollments.reduce((acc, enrollment) => {
      acc[enrollment.courseId] = enrollment;
      return acc;
    }, {});
  }, [myEnrollments]);

  const featuredCourses = useMemo(
    () => [...courses].sort((a, b) => b.studentCount - a.studentCount).slice(0, 3),
    [courses],
  );

  const financeSummary = useMemo(() => {
    const revenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const expenses = payments.reduce((sum, payment) => sum + payment.instructorPayout, 0);
    return {
      revenue,
      expenses,
      net: revenue - expenses,
    };
  }, []);

  const reportRows = useMemo(() => {
    const enrollmentsReport = courses.map((course) => {
      const rows = enrollments.filter((item) => item.courseId === course.id);
      const completed = rows.filter((item) => item.status === "completed").length;
      return {
        course: course.title,
        enrollments: rows.length,
        completed,
        completionRate: rows.length ? Math.round((completed / rows.length) * 100) : 0,
      };
    });

    const quizAttempts = enrollments.flatMap((enrollment) => enrollment.attempts);
    const avgQuiz =
      quizAttempts.length > 0
        ? Math.round(
            quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
              quizAttempts.length,
          )
        : 0;

    const studentsGrowth = [
      { month: "Jan", value: 28 },
      { month: "Feb", value: 36 },
      { month: "Mar", value: 51 },
      { month: "Apr", value: students.length },
    ];

    const instructorReport = instructors.map((instructor) => {
      const ownCourses = courses.filter((course) => course.instructorId === instructor.id);
      const studentsCount = ownCourses.reduce((sum, course) => {
        return (
          sum + enrollments.filter((item) => item.courseId === course.id).length
        );
      }, 0);

      return {
        instructor: instructor.fullName,
        courses: ownCourses.length,
        students: studentsCount,
        rating: instructor.rating || 0,
      };
    });

    return {
      enrollmentsReport,
      quizOverview: {
        totalAttempts: quizAttempts.length,
        averageScore: avgQuiz,
      },
      studentsGrowth,
      instructorReport,
    };
  }, [courses, enrollments, instructors, students.length]);

  const login = async ({ email, password }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();
    const found = users.find(
      (user) =>
        user.email.toLowerCase() === normalizedEmail &&
        user.password === normalizedPassword,
    );
    if (!found) {
      return { ok: false, error: "Email yoki parol noto'g'ri" };
    }

    const nextSession = {
      userId: found.id,
      token: `mock-token-${found.id}`,
      refreshToken: `mock-refresh-${found.id}`,
    };

    setSession(nextSession);
    persistSession(nextSession);
    return { ok: true, user: found };
  };

  const register = async ({ fullName, email, password, role: userRole }) => {
    const normalizedFullName = String(fullName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();

    if (users.some((item) => item.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, error: "Bu email bilan foydalanuvchi mavjud" };
    }

    const created = {
      id: `u-${Date.now()}`,
      fullName: normalizedFullName,
      email: normalizedEmail,
      password: normalizedPassword,
      role: userRole,
      avatar:
        "https://images.unsplash.com/photo-1584999734482-0361aecad844?auto=format&fit=crop&w=120&q=80",
      bio: "New user",
    };

    setUsers((prev) => [created, ...prev]);

    const nextSession = {
      userId: created.id,
      token: `mock-token-${created.id}`,
      refreshToken: `mock-refresh-${created.id}`,
    };

    setSession(nextSession);
    persistSession(nextSession);
    return { ok: true, user: created };
  };

  const logout = () => {
    setSession(null);
    persistSession(null);
  };

  const updateProfile = ({ fullName, bio, avatar }) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              fullName,
              bio,
              avatar,
            }
          : user,
      ),
    );
  };

  const enrollToCourse = (courseId) => {
    if (!currentUser || currentUser.role !== "student" || enrollmentByCourseId[courseId]) {
      return;
    }

    setEnrollments((prev) => [
      ...prev,
      {
        id: `en-${prev.length + 1}`,
        userId: currentUser.id,
        courseId,
        status: "active",
        progress: 0,
        completedLessonIds: [],
        attempts: [],
        certificate: null,
      },
    ]);
  };

  const completeLesson = (courseId, lessonId) => {
    if (!currentUser) return;

    const targetCourse = courses.find((item) => item.id === courseId);
    if (!targetCourse) return;

    const totalLessons = targetCourse.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0,
    );

    setEnrollments((prev) =>
      prev.map((item) => {
        if (item.courseId !== courseId || item.userId !== currentUser.id) {
          return item;
        }

        if (item.completedLessonIds.includes(lessonId)) {
          return item;
        }

        const completedLessonIds = [...item.completedLessonIds, lessonId];
        const progress = Math.round((completedLessonIds.length / totalLessons) * 100);

        return {
          ...item,
          completedLessonIds,
          progress,
          status: progress === 100 ? "completed" : item.status,
        };
      }),
    );
  };

  const submitQuiz = (courseId, score) => {
    if (!currentUser) return;

    setEnrollments((prev) =>
      prev.map((item) => {
        if (item.courseId !== courseId || item.userId !== currentUser.id) {
          return item;
        }

        const updated = {
          ...item,
          attempts: [
            ...item.attempts,
            {
              quizId: courses.find((course) => course.id === courseId)?.finalQuiz.id,
              score,
              timeSpentMin: 20,
              submittedAt: new Date().toISOString(),
            },
          ],
        };

        if (updated.progress === 100 && score >= 70) {
          updated.certificate = {
            id: `CERT-${courseId.toUpperCase()}-${currentUser.id.toUpperCase()}`,
            issuedAt: new Date().toISOString(),
          };
          updated.status = "completed";
        }

        return updated;
      }),
    );
  };

  const createCourse = (payload) => {
    if (!currentUser || currentUser.role !== "instructor") return;

    const course = {
      id: `c-custom-${Date.now()}`,
      title: payload.title,
      description: payload.description,
      coverImage: payload.coverImage,
      category: payload.category,
      difficulty: payload.difficulty,
      language: payload.language,
      price: Number(payload.price || 0),
      durationHours: Number(payload.durationHours || 1),
      status: payload.status,
      rating: 0,
      reviewCount: 0,
      studentCount: 0,
      instructorId: currentUser.id,
      whatYouWillLearn: payload.whatYouWillLearn
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      requirements: payload.requirements
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      modules: [],
      finalQuiz: {
        id: `q-${Date.now()}`,
        title: "Final Quiz",
        passThreshold: 70,
        timeLimitMin: 30,
        maxAttempts: 3,
        questions: [],
      },
      reviews: [],
    };

    setCourses((prev) => [course, ...prev]);
  };

  const addModuleToCourse = (courseId, moduleTitle) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;
        return {
          ...course,
          modules: [
            ...course.modules,
            {
              id: `m-${Date.now()}`,
              title: moduleTitle,
              lessons: [],
            },
          ],
        };
      }),
    );
  };

  const addLessonToModule = (courseId, moduleId, lesson) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;

        return {
          ...course,
          modules: course.modules.map((module) => {
            if (module.id !== moduleId) return module;
            return {
              ...module,
              lessons: [
                ...module.lessons,
                {
                  id: `l-${Date.now()}`,
                  title: lesson.title,
                  type: lesson.type,
                  durationMin: Number(lesson.durationMin || 10),
                  isPreview: lesson.isPreview,
                  content: lesson.content,
                  resourceUrl: lesson.resourceUrl,
                },
              ],
            };
          }),
        };
      }),
    );
  };

  const addCourseReview = ({ courseId, rating, text }) => {
    if (!currentUser || currentUser.role !== "student") return;

    const enrollment = enrollments.find(
      (item) => item.courseId === courseId && item.userId === currentUser.id,
    );

    if (!enrollment || enrollment.status !== "completed") return;

    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;

        const reviews = [
          ...course.reviews,
          {
            id: `r-${Date.now()}`,
            author: currentUser.fullName,
            rating,
            date: new Date().toISOString(),
            text,
          },
        ];

        const average =
          reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

        return {
          ...course,
          reviews,
          reviewCount: reviews.length,
          rating: Number(average.toFixed(1)),
        };
      }),
    );
  };

  const exportReportCsv = (type) => {
    if (type === "enrollments") {
      const header = "Course,Enrollments,Completed,CompletionRate\n";
      const body = reportRows.enrollmentsReport
        .map((row) =>
          [row.course, row.enrollments, row.completed, `${row.completionRate}%`].join(","),
        )
        .join("\n");
      downloadCsv("enrollments-report.csv", header + body);
      return;
    }

    if (type === "instructors") {
      const header = "Instructor,Courses,Students,Rating\n";
      const body = reportRows.instructorReport
        .map((row) => [row.instructor, row.courses, row.students, row.rating].join(","))
        .join("\n");
      downloadCsv("instructors-report.csv", header + body);
    }
  };

  const value = {
    roles,
    categories,
    users,
    students,
    instructors,
    currentUser,
    isAuthenticated,
    role,
    courses,
    featuredCourses,
    enrollments,
    myEnrollments,
    enrollmentByCourseId,
    financeSummary,
    reportRows,
    login,
    register,
    logout,
    updateProfile,
    enrollToCourse,
    completeLesson,
    submitQuiz,
    createCourse,
    addModuleToCourse,
    addLessonToModule,
    addCourseReview,
    exportReportCsv,
  };

  return <LmsContext.Provider value={value}>{children}</LmsContext.Provider>;
}

export function useLms() {
  const context = useContext(LmsContext);
  if (!context) {
    throw new Error("useLms must be used within LmsProvider");
  }
  return context;
}
