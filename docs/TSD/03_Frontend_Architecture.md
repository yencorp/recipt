# 프론트엔드 아키텍처 - React + VITE

## 기술 스택

- **Framework**: React 18.2 + TypeScript 5.0
- **Build Tool**: VITE 5.0
- **State Management**: Redux Toolkit + RTK Query
- **UI Library**: Tailwind CSS + shadcn/ui
- **Router**: React Router v6
- **Form**: React Hook Form + Zod
- **HTTP Client**: Axios

## 프로젝트 구조

```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── ui/              # shadcn/ui 기본 컴포넌트
│   ├── forms/           # 폼 관련 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   └── common/          # 공통 컴포넌트
├── pages/               # 페이지 컴포넌트
│   ├── auth/           # 인증 관련 페이지
│   ├── dashboard/      # 대시보드
│   ├── events/         # 행사 관리
│   ├── budget/         # 예산 관리
│   ├── settlement/     # 결산 관리
│   ├── ocr/           # OCR 관리
│   ├── blog/          # 블로그
│   └── admin/         # 관리자
├── store/              # Redux store 관리
│   ├── slices/        # Redux Toolkit 슬라이스
│   └── api/           # RTK Query API 정의
├── hooks/              # 커스텀 훅
├── utils/              # 유틸리티 함수
├── types/              # TypeScript 타입 정의
├── constants/          # 상수 정의
├── services/           # API 서비스
└── assets/             # 정적 파일
```

## 컴포넌트 계층구조

### 1. Layout Components
```typescript
// src/components/layout/AppLayout.tsx
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};
```

### 2. Page Components 예시
```typescript
// src/pages/events/EventListPage.tsx
import { useState } from 'react';
import { useGetEventsQuery } from '@/store/api/eventsApi';
import { EventCard } from '@/components/events/EventCard';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';
import { Button } from '@/components/ui/button';

export const EventListPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: events, isLoading, error } = useGetEventsQuery();

  if (isLoading) return <div>로딩중...</div>;
  if (error) return <div>에러 발생</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">행사 관리</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          새 행사 생성
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events?.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      <CreateEventDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
};
```

## 상태 관리 (Redux Toolkit)

### Store 구성
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { eventsApi } from './api/eventsApi';
import { ocrApi } from './api/ocrApi';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    [authApi.reducerPath]: authApi.reducer,
    [eventsApi.reducerPath]: eventsApi.reducer,
    [ocrApi.reducerPath]: ocrApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      eventsApi.middleware,
      ocrApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Auth Slice 예시
```typescript
// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  organizations: Organization[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    loginFailure: (state) => {
      state.loading = false;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
```

### RTK Query API 예시
```typescript
// src/store/api/eventsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Event, CreateEventDto } from '@/types/event';

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/events',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Event'],
  endpoints: (builder) => ({
    getEvents: builder.query<Event[], void>({
      query: () => '',
      providesTags: ['Event'],
    }),
    createEvent: builder.mutation<Event, CreateEventDto>({
      query: (event) => ({
        url: '',
        method: 'POST',
        body: event,
      }),
      invalidatesTags: ['Event'],
    }),
    updateEvent: builder.mutation<Event, { id: string; event: Partial<CreateEventDto> }>({
      query: ({ id, event }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: event,
      }),
      invalidatesTags: ['Event'],
    }),
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event'],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventsApi;
```

## 라우팅 구조

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EventListPage } from './pages/events/EventListPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { BudgetPage } from './pages/budget/BudgetPage';
import { SettlementPage } from './pages/settlement/SettlementPage';
import { OCRPage } from './pages/ocr/OCRPage';
import { BlogPage } from './pages/blog/BlogPage';
import { AdminPage } from './pages/admin/AdminPage';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* 보호된 라우트 */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="events" element={<EventListPage />} />
                  <Route path="events/:id" element={<EventDetailPage />} />
                  <Route path="events/:id/budget" element={<BudgetPage />} />
                  <Route path="events/:id/settlement" element={<SettlementPage />} />
                  <Route path="ocr/:settlementId" element={<OCRPage />} />
                  <Route path="blog" element={<BlogPage />} />
                  <Route path="admin/*" element={<AdminPage />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};
```

## 폼 관리 (React Hook Form + Zod)

### 스키마 정의
```typescript
// src/schemas/eventSchema.ts
import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(2, '행사명은 2자 이상이어야 합니다'),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
  location: z.string().optional(),
  allocatedBudget: z.number().min(0, '예산은 0 이상이어야 합니다').optional(),
  organizationId: z.string().uuid('올바른 단체를 선택해주세요'),
  description: z.string().optional(),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: '종료일은 시작일보다 늦어야 합니다',
  path: ['endDate'],
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
```

### 폼 컴포넌트 예시
```typescript
// src/components/events/CreateEventForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, CreateEventFormData } from '@/schemas/eventSchema';
import { useCreateEventMutation } from '@/store/api/eventsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

interface CreateEventFormProps {
  onSuccess: () => void;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({ onSuccess }) => {
  const [createEvent, { isLoading }] = useCreateEventMutation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
  });

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      await createEvent(data).unwrap();
      reset();
      onSuccess();
    } catch (error) {
      console.error('행사 생성 실패:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          {...register('name')}
          placeholder="행사명"
          error={errors.name?.message}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register('startDate')}
          type="date"
          error={errors.startDate?.message}
        />
        <Input
          {...register('endDate')}
          type="date"
          error={errors.endDate?.message}
        />
      </div>

      <Input
        {...register('location')}
        placeholder="행사 장소"
        error={errors.location?.message}
      />

      <Input
        {...register('allocatedBudget', { valueAsNumber: true })}
        type="number"
        placeholder="배정 예산"
        error={errors.allocatedBudget?.message}
      />

      <Textarea
        {...register('description')}
        placeholder="행사 설명"
        error={errors.description?.message}
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? '생성 중...' : '행사 생성'}
      </Button>
    </form>
  );
};
```

## UI 컴포넌트 시스템

### Tailwind CSS 설정
```typescript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#6b7280',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### shadcn/ui 컴포넌트 활용
```typescript
// src/components/ui/card.tsx (shadcn/ui 스타일)
import * as React from 'react';
import { cn } from '@/utils/cn';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
);

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);

export { Card, CardHeader };
```

## 커스텀 훅

### 인증 훅
```typescript
// src/hooks/useAuth.ts
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useLogoutMutation } from '@/store/api/authApi';

export const useAuth = () => {
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    isAdmin: user?.isAdmin ?? false,
    logout: handleLogout,
  };
};
```

### OCR 훅
```typescript
// src/hooks/useOCR.ts
import { useState } from 'react';
import { useProcessReceiptsMutation } from '@/store/api/ocrApi';

export const useOCR = () => {
  const [processReceipts, { isLoading }] = useProcessReceiptsMutation();
  const [progress, setProgress] = useState(0);

  const processFiles = async (files: File[], settlementId: string) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('settlementId', settlementId);

    try {
      const result = await processReceipts(formData).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    processFiles,
    isLoading,
    progress,
  };
};
```

## 타입 정의

```typescript
// src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  baptismalName?: string;
  phone: string;
  position: string;
  isAdmin: boolean;
  organizations: Organization[];
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  allocatedBudget?: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  organization: Organization;
  hasBudget: boolean;
  hasSettlement: boolean;
  createdBy: User;
  createdAt: string;
}

export interface CreateEventDto {
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  allocatedBudget?: number;
  organizationId: string;
  description?: string;
}
```

## 빌드 및 배포 설정

### VITE 설정
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          store: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
});
```

### 환경 변수
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_NAME=광남동성당 청소년위원회 예결산 관리

// .env.production
VITE_API_BASE_URL=/api/v1
VITE_APP_NAME=광남동성당 청소년위원회 예결산 관리
```

---

*이 프론트엔드 아키텍처는 확장 가능하고 유지보수하기 쉬운 구조로 설계되었습니다.*