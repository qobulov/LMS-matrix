/** Map gateway snake_case course list item to UI camelCase (catalog / home featured). */
export function mapCourseListItem(c) {
  if (!c || typeof c !== "object") return null;
  return {
    id: String(c.id),
    title: c.title ?? "",
    coverImage: c.cover_image ?? "",
    category: c.category ?? "",
    difficulty: c.difficulty ?? "",
    language: c.language ?? "",
    price: c.price ?? 0,
    rating: c.rating_avg ?? c.rating ?? 0,
    reviewCount: c.review_count ?? 0,
    studentCount: c.student_count ?? 0,
    durationHours: c.duration_hours ?? 0,
    lessonCount: c.lesson_count ?? null,
    modules: Array.isArray(c.modules) ? c.modules : [],
  };
}

export function mapInstructorHome(i) {
  if (!i || typeof i !== "object") return null;
  return {
    id: String(i.id),
    fullName: i.full_name ?? "",
    avatar: i.avatar_url ?? "",
    bio: i.bio ?? "",
    rating: i.rating ?? null,
    courseCount: i.course_count ?? 0,
    studentTotal: i.student_total ?? 0,
  };
}

/** Full course detail from get_course_details */
export function mapCourseDetail(raw) {
  if (!raw || typeof raw !== "object") return null;
  const modules = (raw.modules ?? []).map((m) => ({
    id: String(m.id),
    title: m.title ?? "",
    orderNo: m.order_no,
    lessons: (m.lessons ?? []).map((l) => ({
      id: String(l.id),
      title: l.title ?? "",
      durationMin: l.duration_min ?? 0,
      isPreview: Boolean(l.is_preview),
      type: l.video_url ? "video" : "text",
      content: l.video_url ? "" : "",
      resourceUrl: l.video_url ?? "",
    })),
  }));
  const finalQuiz = raw.final_quiz
    ? {
        id: String(raw.final_quiz.id),
        title: raw.final_quiz.title ?? "Final Quiz",
        passThreshold: raw.final_quiz.pass_threshold ?? 70,
        timeLimitMin: raw.final_quiz.time_limit_min ?? 30,
        maxAttempts: raw.final_quiz.max_attempts ?? 3,
        questions: [],
      }
    : null;
  const reviews = (raw.reviews ?? []).map((r, idx) => ({
    id: String(r.id ?? idx),
    author: r.user?.full_name ?? r.author ?? "",
    avatar: r.user?.avatar_url ?? "",
    rating: r.rating ?? 0,
    date: r.created_at ?? r.date ?? "",
    text: r.comment ?? r.text ?? "",
  }));
  return {
    id: String(raw.id),
    title: raw.title ?? "",
    description: raw.description ?? "",
    coverImage: raw.cover_image ?? "",
    category: raw.category ?? "",
    difficulty: raw.difficulty ?? "",
    language: raw.language ?? "",
    price: Number(raw.price ?? 0),
    durationHours: raw.duration_hours ?? 0,
    status: raw.status ?? "published",
    rating: raw.rating_avg ?? raw.rating ?? 0,
    reviewCount: raw.review_count ?? 0,
    studentCount: raw.student_count ?? 0,
    instructorId: raw.instructor?.id ? String(raw.instructor.id) : "",
    instructor: raw.instructor
      ? {
          id: String(raw.instructor.id),
          fullName: raw.instructor.full_name ?? "",
          avatar: raw.instructor.avatar_url ?? "",
          rating: raw.instructor.rating ?? null,
          bio: raw.instructor.bio ?? "",
        }
      : null,
    whatYouWillLearn: raw.what_you_will_learn ?? [],
    requirements: raw.requirements ?? [],
    modules,
    finalQuiz,
    reviews,
  };
}

export function mapEnrollmentFromApi(e) {
  if (!e || typeof e !== "object") return null;
  const courseRaw = e.course;
  const course = courseRaw
    ? mapCourseDetail({
        ...courseRaw,
        instructor: courseRaw.instructor,
        modules: courseRaw.modules ?? [],
        reviews: [],
        final_quiz: null,
      })
    : null;
  return {
    id: String(e.id),
    userId: "",
    courseId: course?.id ?? "",
    status: e.status ?? "active",
    progress: e.progress_percent ?? 0,
    completedLessonIds: (e.completed_lesson_ids ?? []).map(String),
    attempts: (e.attempts ?? []).map((a) => ({
      score: a.score,
      submittedAt: a.submitted_at ?? a.submittedAt,
    })),
    certificate: e.certificate
      ? {
          id: e.certificate.id ?? e.certificate.certificate_uid,
          issuedAt: e.certificate.issued_at ?? e.certificate.issuedAt,
        }
      : null,
    course,
  };
}
