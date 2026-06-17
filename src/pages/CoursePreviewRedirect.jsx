import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { courseApi } from "../api/endpoints";
import { mapCourseDetail } from "../utils/gatewayMappers";

function flattenLessons(course) {
  return (course.modules ?? []).flatMap((m) => m.lessons ?? []);
}

export function CoursePreviewRedirect() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await courseApi.getById(courseId, {});
        if (cancelled) return;
        const course = mapCourseDetail(raw);
        const lessons = flattenLessons(course);
        if (lessons.length > 0) {
          navigate(`/learn/${courseId}/${lessons[0].id}`, { replace: true });
        } else {
          navigate(`/instructor/courses/${courseId}`, { replace: true });
        }
      } catch {
        if (!cancelled) navigate(`/instructor/courses/${courseId}`, { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
      Yuklanmoqda…
    </div>
  );
}
