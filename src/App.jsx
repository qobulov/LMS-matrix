import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireRole } from "./components/auth/RequireRole";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { LessonLayout } from "./components/layout/LessonLayout";
import { useLms } from "./data/LmsContext";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CertificatesPage } from "./pages/CertificatesPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { CreateCoursePage } from "./pages/CreateCoursePage";
import { HomePage } from "./pages/HomePage";
import { InstructorDashboardPage } from "./pages/InstructorDashboardPage";
import { LessonViewerPage } from "./pages/LessonViewerPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicVerifyPage } from "./pages/PublicVerifyPage";
import { QuizPage } from "./pages/QuizPage";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { RewardsPage } from "./pages/RewardsPage";

function App() {
  const { isAuthenticated, authReady } = useLms();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-damiun-surface-app text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {/* Course detail page accessible without auth for preview */}
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route path="/verify/:certificateId" element={<PublicVerifyPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/quiz/:courseId" element={<QuizPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/rewards" element={<RewardsPage />} />

        <Route
          path="/student"
          element={
            <RequireRole allow={["student"]}>
              <StudentDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/certificates"
          element={
            <RequireRole allow={["student"]}>
              <CertificatesPage />
            </RequireRole>
          }
        />

        <Route
          path="/instructor"
          element={
            <RequireRole allow={["instructor"]}>
              <InstructorDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/instructor/create-course"
          element={
            <RequireRole allow={["instructor"]}>
              <CreateCoursePage />
            </RequireRole>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireRole allow={["superadmin"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      {/* Lesson viewer uses its own full-screen layout (no app sidebar) */}
      <Route
        element={
          <RequireAuth>
            <LessonLayout />
          </RequireAuth>
        }
      >
        <Route path="/learn/:courseId/:lessonId" element={<LessonViewerPage />} />
      </Route>

      <Route
        path="/home"
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
