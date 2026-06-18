/** Map get_instructor_dashboard course row to UI shape. */
export function mapInstructorCourse(c) {
  if (!c || typeof c !== "object") return null;
  return {
    id: String(c.id),
    title: c.title ?? "",
    status: c.status ?? "draft",
    description: c.description ?? "",
    coverImage: c.cover_image ?? c.image ?? null,
    studentCount: c.student_count ?? 0,
    modules: (c.modules ?? []).map((m) => ({
      id: String(m.id),
      title: m.title ?? "",
      lessons: [],
    })),
  };
}
