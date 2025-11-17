import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute } from './routes/PublicRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';

// Placeholder Pages
const LoginPage = () => <div className="text-center p-8">로그인 페이지</div>;
const RegisterPage = () => <div className="text-center p-8">회원가입 페이지</div>;
const DashboardPage = () => <div className="text-center p-8">대시보드</div>;
const EventsPage = () => <div className="text-center p-8">행사 목록</div>;
const EventDetailPage = () => <div className="text-center p-8">행사 상세</div>;
const BudgetPage = () => <div className="text-center p-8">예산서</div>;
const SettlementPage = () => <div className="text-center p-8">결산서</div>;
const OCRPage = () => <div className="text-center p-8">OCR 관리</div>;
const BlogPage = () => <div className="text-center p-8">블로그</div>;
const AdminPage = () => <div className="text-center p-8">관리자</div>;
const ProfilePage = () => <div className="text-center p-8">프로필</div>;
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
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:id" element={<EventDetailPage />} />
                <Route path="events/:id/budget" element={<BudgetPage />} />
                <Route path="events/:id/settlement" element={<SettlementPage />} />

                {/* OCR */}
                <Route path="ocr/:settlementId" element={<OCRPage />} />

                {/* Blog */}
                <Route path="blog" element={<BlogPage />} />

                {/* Admin */}
                <Route
                  path="admin/*"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />

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
