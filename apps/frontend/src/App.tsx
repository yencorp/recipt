import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute } from './routes/PublicRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Placeholder Pages (아직 구현되지 않은 페이지들)
const EventListPage = () => <div className="text-center p-8">행사 목록 (준비 중)</div>;
const EventDetailPage = () => <div className="text-center p-8">행사 상세 페이지 (준비 중)</div>;
const BudgetWizard = () => <div className="text-center p-8">예산서 작성 (준비 중)</div>;
const SettlementWizard = () => <div className="text-center p-8">결산서 작성 (준비 중)</div>;
const OCRPage = () => <div className="text-center p-8">OCR 관리 (준비 중)</div>;
const BlogPage = () => <div className="text-center p-8">블로그 (준비 중)</div>;
const SystemDashboard = () => <div className="text-center p-8">시스템 대시보드 (준비 중)</div>;
const UsersPage = () => <div className="text-center p-8">사용자 관리 (준비 중)</div>;
const OrganizationsPage = () => <div className="text-center p-8">조직 관리 (준비 중)</div>;
const UnauthorizedPage = () => (
  <div className="text-center p-8 text-destructive">접근 권한이 없습니다</div>
);

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmailPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />

                {/* Events */}
                <Route path="events" element={<EventListPage />} />
                <Route path="events/:id" element={<EventDetailPage />} />
                <Route path="events/:id/budget" element={<BudgetWizard />} />
                <Route path="events/:id/settlement" element={<SettlementWizard />} />

                {/* OCR */}
                <Route path="ocr/:settlementId" element={<OCRPage />} />

                {/* Blog */}
                <Route path="blog" element={<BlogPage />} />

                {/* Admin */}
                <Route path="admin/*" element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <Routes>
                      <Route index element={<SystemDashboard />} />
                      <Route path="users" element={<UsersPage />} />
                      <Route path="organizations" element={<OrganizationsPage />} />
                    </Routes>
                  </ProtectedRoute>
                } />

                <Route path="unauthorized" element={<UnauthorizedPage />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
