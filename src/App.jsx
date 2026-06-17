import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireRole } from "./components/auth/RequireRole";
import { RoleRedirect } from "./components/auth/RoleRedirect";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { LessonLayout } from "./components/layout/LessonLayout";
import { useLms } from "./data/LmsContext";
import { getHomePathForRole } from "./utils/authRouting";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CertificatesPage } from "./pages/CertificatesPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { CreateCoursePage } from "./pages/CreateCoursePage";
import { InstructorDashboardPage } from "./pages/InstructorDashboardPage";
import { LessonViewerPage } from "./pages/LessonViewerPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicVerifyPage } from "./pages/PublicVerifyPage";
import { QuizPage } from "./pages/QuizPage";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminTransactionsPage } from "./pages/admin/AdminTransactionsPage";
import { TeacherPayoutPage } from "./pages/admin/TeacherPayoutPage";
import { TopUpPage } from "./pages/TopUpPage";
import { StudentTransactionsPage } from "./pages/StudentTransactionsPage";
import { InstructorCoursesPage } from "./pages/instructor/InstructorCoursesPage";
import { InstructorTransactionsPage } from "./pages/instructor/InstructorTransactionsPage";
import { CoursePreviewRedirect } from "./pages/CoursePreviewRedirect";

function App() {
  const { isAuthenticated, authReady, currentUser } = useLms();

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
        element={
          isAuthenticated ? (
            <Navigate to={getHomePathForRole(currentUser?.role)} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={getHomePathForRole(currentUser?.role)} replace />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route
        path="/forgot-password"
        element={
          isAuthenticated ? (
            <Navigate to={getHomePathForRole(currentUser?.role)} replace />
          ) : (
            <ForgotPasswordPage />
          )
        }
      />

      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route path="/verify/:certificateId" element={<PublicVerifyPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<RoleRedirect />} />
        <Route
          path="/catalog"
          element={
            <RequireRole allow={["student"]}>
              <CatalogPage />
            </RequireRole>
          }
        />
        <Route
          path="/quiz/:courseId"
          element={
            <RequireRole allow={["student"]}>
              <QuizPage />
            </RequireRole>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />

        <Route
          path="/student"
          element={
            <RequireRole allow={["student"]}>
              <StudentDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/top-up"
          element={
            <RequireRole allow={["student"]}>
              <TopUpPage />
            </RequireRole>
          }
        />
        <Route
          path="/transactions"
          element={
            <RequireRole allow={["student"]}>
              <StudentTransactionsPage />
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
          path="/instructor/courses"
          element={
            <RequireRole allow={["instructor"]}>
              <InstructorCoursesPage />
            </RequireRole>
          }
        />
        <Route
          path="/instructor/courses/:courseId"
          element={
            <RequireRole allow={["instructor"]}>
              <InstructorCoursesPage />
            </RequireRole>
          }
        />
        <Route
          path="/instructor/transactions"
          element={
            <RequireRole allow={["instructor"]}>
              <InstructorTransactionsPage />
            </RequireRole>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireRole allow={["director"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="payouts" element={<TeacherPayoutPage />} />
          <Route path="transactions" element={<AdminTransactionsPage />} />
        </Route>
      </Route>

      <Route
        element={
          <RequireAuth>
            <RequireRole allow={["student", "instructor"]}>
              <LessonLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route path="/learn/:courseId/:lessonId" element={<LessonViewerPage />} />
      </Route>

      <Route
        path="/learn-preview/:courseId"
        element={
          <RequireAuth>
            <RequireRole allow={["instructor"]}>
              <CoursePreviewRedirect />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/home"
        element={
          <Navigate to={isAuthenticated ? getHomePathForRole(currentUser?.role) : "/login"} replace />
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
