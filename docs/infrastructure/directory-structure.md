# 프로젝트 디렉터리 구조 설계

## 1. 저장소 전략 결정

### 1.1 모노레포 vs 멀티레포 분석

**선택된 전략**: **모노레포 (Monorepo)**

#### 선택 근거

**프로젝트 특성**:
- 중소규모 개발팀 (5-6명)
- 4개 서비스 (Frontend, Backend, Database, OCR Service)
- 통합된 예결산 관리 시스템
- 서비스 간 긴밀한 데이터 및 타입 공유

**모노레포 장점**:
- ✅ **공통 코드 공유**: TypeScript 인터페이스, 유틸리티, 상수 등
- ✅ **일관된 개발 환경**: 린트, 포맷팅, 테스트 설정 통일
- ✅ **의존성 관리 단순화**: 패키지 버전 충돌 방지
- ✅ **CI/CD 단순화**: 단일 파이프라인으로 통합 관리
- ✅ **작은 팀 관리 용이**: 코드 리뷰, 협업, 지식 공유 효율성
- ✅ **원자적 변경**: 여러 서비스를 동시에 변경하는 경우 일관성 보장

**고려된 멀티레포 단점**:
- ❌ 서비스별 저장소 관리 오버헤드
- ❌ 공통 타입 동기화 복잡성
- ❌ CI/CD 파이프라인 중복
- ❌ 크로스 서비스 변경 시 복잡한 버전 관리

## 2. 전체 프로젝트 구조

### 2.1 루트 레벨 구조

```
recipt-management/
├── .github/                    # GitHub 워크플로우 및 템플릿
│   ├── workflows/              # CI/CD 파이프라인
│   ├── ISSUE_TEMPLATE/         # 이슈 템플릿
│   └── pull_request_template.md
├── .husky/                     # Git hooks
├── .vscode/                    # VSCode 공통 설정
├── apps/                       # 애플리케이션 서비스들
│   ├── frontend/               # React + VITE 프론트엔드
│   ├── backend/                # NestJS 백엔드 API
│   └── ocr-service/            # Python FastAPI OCR 서비스
├── packages/                   # 공통 패키지 및 라이브러리
│   ├── shared/                 # 공통 타입, 유틸리티
│   ├── ui-components/          # 재사용 가능한 UI 컴포넌트
│   └── database/               # 데이터베이스 스키마 및 마이그레이션
├── tools/                      # 개발 도구 및 스크립트
├── docs/                       # 프로젝트 문서
├── scripts/                    # 개발 편의 스크립트
├── docker/                     # Docker 관련 파일들
├── docker-compose.*.yml        # 환경별 Docker Compose 설정
├── package.json                # 루트 패키지 설정 (workspace)
├── tsconfig.base.json          # TypeScript 기본 설정
├── .env.example                # 환경 변수 템플릿
├── .gitignore                  # Git 무시 파일 설정
├── README.md                   # 프로젝트 개요 및 시작 가이드
└── lerna.json                  # Lerna 모노레포 설정 (선택적)
```

## 3. 서비스별 디렉터리 구조

### 3.1 Frontend (React + VITE) - `apps/frontend/`

```
apps/frontend/
├── public/                     # 정적 자산
│   ├── icons/                  # 아이콘 파일들
│   └── favicon.ico
├── src/
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── common/             # 공통 컴포넌트
│   │   ├── forms/              # 폼 관련 컴포넌트
│   │   ├── layouts/            # 레이아웃 컴포넌트
│   │   └── ui/                 # UI 기본 컴포넌트
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── auth/               # 인증 관련 페이지
│   │   ├── budget/             # 예산 관리 페이지
│   │   ├── settlement/         # 결산 관리 페이지
│   │   ├── blog/               # 블로그 페이지
│   │   └── admin/              # 관리자 페이지
│   ├── hooks/                  # 커스텀 React 훅
│   ├── services/               # API 서비스 레이어
│   ├── stores/                 # 상태 관리 (Zustand/Redux)
│   ├── utils/                  # 유틸리티 함수
│   ├── constants/              # 상수 정의
│   ├── types/                  # 로컬 타입 정의
│   ├── styles/                 # 글로벌 스타일 및 테마
│   ├── assets/                 # 이미지, 폰트 등
│   ├── App.tsx                 # 앱 루트 컴포넌트
│   └── main.tsx                # 앱 진입점
├── tests/                      # 테스트 파일
│   ├── __mocks__/              # 모킹 파일
│   ├── components/             # 컴포넌트 테스트
│   └── utils/                  # 유틸리티 테스트
├── Dockerfile.dev              # 개발용 Docker 설정
├── Dockerfile.prod             # 프로덕션용 Docker 설정
├── vite.config.ts              # VITE 설정
├── tsconfig.json               # TypeScript 설정
├── package.json                # 패키지 의존성
├── .env.development            # 개발 환경 변수
├── .env.production             # 프로덕션 환경 변수
└── .env.local.example          # 로컬 환경 변수 예시
```

### 3.2 Backend (NestJS) - `apps/backend/`

```
apps/backend/
├── src/
│   ├── app.module.ts           # 앱 루트 모듈
│   ├── main.ts                 # 앱 진입점
│   ├── modules/                # 기능별 모듈
│   │   ├── auth/               # 인증 모듈
│   │   ├── users/              # 사용자 관리 모듈
│   │   ├── organizations/      # 단체 관리 모듈
│   │   ├── projects/           # 행사(프로젝트) 모듈
│   │   ├── budgets/            # 예산 관리 모듈
│   │   ├── settlements/        # 결산 관리 모듈
│   │   ├── receipts/           # 영수증 관리 모듈
│   │   ├── blog/               # 블로그 모듈
│   │   └── documents/          # 문서 생성 모듈
│   ├── common/                 # 공통 모듈
│   │   ├── decorators/         # 커스텀 데코레이터
│   │   ├── filters/            # 예외 필터
│   │   ├── guards/             # 가드 (인증, 권한)
│   │   ├── interceptors/       # 인터셉터
│   │   ├── pipes/              # 파이프 (유효성 검사)
│   │   └── dto/                # 공통 DTO
│   ├── database/               # 데이터베이스 설정
│   │   ├── entities/           # TypeORM 엔티티
│   │   ├── migrations/         # 데이터베이스 마이그레이션
│   │   ├── seeds/              # 초기 데이터
│   │   └── database.module.ts  # 데이터베이스 모듈
│   ├── config/                 # 설정 파일
│   ├── utils/                  # 유틸리티 함수
│   └── types/                  # 로컬 타입 정의
├── test/                       # E2E 테스트
├── Dockerfile.dev              # 개발용 Docker 설정
├── Dockerfile.prod             # 프로덕션용 Docker 설정
├── nest-cli.json               # NestJS CLI 설정
├── tsconfig.json               # TypeScript 설정
├── tsconfig.build.json         # 빌드용 TypeScript 설정
├── package.json                # 패키지 의존성
├── .env.development            # 개발 환경 변수
├── .env.production             # 프로덕션 환경 변수
└── .env.test                   # 테스트 환경 변수
```

### 3.3 OCR Service (Python FastAPI) - `apps/ocr-service/`

```
apps/ocr-service/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 진입점
│   ├── api/                    # API 라우터
│   │   ├── __init__.py
│   │   ├── endpoints/          # API 엔드포인트
│   │   └── dependencies.py     # 의존성 정의
│   ├── core/                   # 핵심 설정
│   │   ├── __init__.py
│   │   ├── config.py           # 설정 관리
│   │   ├── security.py         # 보안 설정
│   │   └── logging.py          # 로깅 설정
│   ├── services/               # 비즈니스 로직
│   │   ├── __init__.py
│   │   ├── ocr/                # OCR 처리 서비스
│   │   ├── image/              # 이미지 처리 서비스
│   │   └── ml/                 # 머신러닝 모델
│   ├── models/                 # 데이터 모델
│   │   ├── __init__.py
│   │   ├── schemas.py          # Pydantic 스키마
│   │   └── database.py         # 데이터베이스 모델 (선택적)
│   └── utils/                  # 유틸리티 함수
│       ├── __init__.py
│       ├── file_handler.py     # 파일 처리
│       └── validators.py       # 유효성 검사
├── tests/                      # 테스트 파일
├── uploads/                    # 업로드된 파일 저장소
├── models/                     # 머신러닝 모델 파일
├── Dockerfile.dev              # 개발용 Docker 설정
├── Dockerfile.prod             # 프로덕션용 Docker 설정
├── requirements.txt            # Python 의존성
├── requirements-dev.txt        # 개발 의존성
├── pyproject.toml              # Python 프로젝트 설정
├── pytest.ini                 # pytest 설정
└── .env.development            # 개발 환경 변수
```

## 4. 공통 패키지 구조

### 4.1 Shared Package - `packages/shared/`

```
packages/shared/
├── src/
│   ├── types/                  # 공통 TypeScript 타입
│   │   ├── api.ts              # API 요청/응답 타입
│   │   ├── entities.ts         # 데이터베이스 엔티티 타입
│   │   ├── enums.ts            # 열거형 정의
│   │   └── index.ts            # 타입 export
│   ├── constants/              # 공통 상수
│   │   ├── api-endpoints.ts    # API 엔드포인트 상수
│   │   ├── app-config.ts       # 앱 설정 상수
│   │   └── index.ts
│   ├── utils/                  # 공통 유틸리티 함수
│   │   ├── date.ts             # 날짜 유틸리티
│   │   ├── currency.ts         # 통화 유틸리티
│   │   ├── validation.ts       # 유효성 검사
│   │   └── index.ts
│   ├── schemas/                # 공통 스키마 (Zod, Yup 등)
│   └── index.ts                # 메인 export
├── package.json                # 패키지 설정
└── tsconfig.json               # TypeScript 설정
```

### 4.2 UI Components Package - `packages/ui-components/`

```
packages/ui-components/
├── src/
│   ├── components/             # 재사용 가능한 UI 컴포넌트
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Table/
│   │   └── index.ts
│   ├── hooks/                  # UI 관련 커스텀 훅
│   ├── styles/                 # 공통 스타일
│   │   ├── themes/             # 테마 정의
│   │   ├── variables.css       # CSS 변수
│   │   └── globals.css         # 글로벌 스타일
│   └── index.ts
├── storybook/                  # Storybook 설정
├── package.json
└── tsconfig.json
```

### 4.3 Database Package - `packages/database/`

```
packages/database/
├── src/
│   ├── entities/               # TypeORM 엔티티 정의
│   ├── migrations/             # 데이터베이스 마이그레이션
│   ├── seeds/                  # 초기 데이터
│   ├── config/                 # 데이터베이스 설정
│   └── index.ts
├── scripts/                    # 데이터베이스 관리 스크립트
├── package.json
└── tsconfig.json
```

## 5. 공통 설정 파일 위치

### 5.1 루트 레벨 설정 파일

```
# 워크스페이스 설정
package.json                    # 루트 패키지 설정 (npm workspaces)
lerna.json                      # Lerna 모노레포 설정 (선택적)
pnpm-workspace.yaml             # PNPM 워크스페이스 (PNPM 사용시)

# TypeScript 설정
tsconfig.base.json              # 기본 TypeScript 설정
tsconfig.json                   # 루트 TypeScript 설정

# 코드 품질 설정
.eslintrc.js                    # ESLint 설정
.prettierrc                     # Prettier 설정
.editorconfig                   # 에디터 설정

# Git 설정
.gitignore                      # Git 무시 파일
.gitattributes                  # Git 속성 설정

# 환경 변수
.env.example                    # 환경 변수 템플릿
.env.development                # 개발 환경 (공통)
.env.test                       # 테스트 환경 (공통)
.env.production                 # 프로덕션 환경 (공통)

# 개발 도구
.husky/                         # Git hooks
.vscode/                        # VSCode 설정
```

### 5.2 개발 도구 설정

**ESLint 설정 (`.eslintrc.js`)**:
```javascript
module.exports = {
  root: true,
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: './tsconfig.base.json'
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.base.json'
      }
    }
  }
};
```

**Prettier 설정 (`.prettierrc`)**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

**TypeScript 기본 설정 (`tsconfig.base.json`)**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["packages/shared/src/*"],
      "@ui/*": ["packages/ui-components/src/*"],
      "@database/*": ["packages/database/src/*"]
    }
  }
}
```

## 6. Docker 관련 파일 배치

### 6.1 Docker 파일 구조

```
# 서비스별 Dockerfile
apps/frontend/Dockerfile.dev        # 프론트엔드 개발용
apps/frontend/Dockerfile.prod       # 프론트엔드 프로덕션용
apps/backend/Dockerfile.dev         # 백엔드 개발용
apps/backend/Dockerfile.prod        # 백엔드 프로덕션용
apps/ocr-service/Dockerfile.dev     # OCR 서비스 개발용
apps/ocr-service/Dockerfile.prod    # OCR 서비스 프로덕션용

# Docker Compose 설정
docker-compose.yml                  # 기본 개발 환경
docker-compose.dev.yml              # 개발 환경 (상세)
docker-compose.prod.yml             # 프로덕션 환경
docker-compose.test.yml             # 테스트 환경
docker-compose.override.yml         # 로컬 개발자별 오버라이드

# Docker 관련 보조 파일
docker/                             # Docker 관련 설정
├── nginx/                          # Nginx 설정 (프로덕션)
├── postgres/                       # PostgreSQL 초기화 스크립트
└── scripts/                        # Docker 관련 스크립트

.dockerignore                       # Docker 무시 파일 (루트)
```

### 6.2 Docker Compose 환경 전략

**개발 환경** (`docker-compose.dev.yml`):
- 소스 코드 볼륨 마운트
- Hot Reload 활성화
- 개발용 환경 변수
- 로깅 상세 설정

**테스트 환경** (`docker-compose.test.yml`):
- 테스트 데이터베이스 분리
- 테스트용 환경 변수
- CI/CD 최적화

**프로덕션 환경** (`docker-compose.prod.yml`):
- 최적화된 이미지 사용
- 보안 설정 강화
- 성능 최적화
- 모니터링 도구 포함

## 7. 워크스페이스 관리

### 7.1 Package.json 워크스페이스 설정

```json
{
  "name": "recipt-management",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\" \"npm run dev:ocr\"",
    "dev:frontend": "npm run dev --workspace=apps/frontend",
    "dev:backend": "npm run dev --workspace=apps/backend",
    "dev:ocr": "npm run dev --workspace=apps/ocr-service",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "concurrently": "^8.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 7.2 의존성 관리 전략

**공통 의존성**: 루트 레벨에서 관리
- TypeScript, ESLint, Prettier
- 테스트 도구 (Jest, Vitest)
- 개발 도구 (Concurrently, Nodemon)

**서비스별 의존성**: 각 앱에서 개별 관리
- Frontend: React, VITE, Zustand 등
- Backend: NestJS, TypeORM, Passport 등
- OCR Service: FastAPI, Tesseract, PIL 등

**공통 패키지 의존성**: packages 레벨에서 관리
- 공통 타입, 유틸리티 라이브러리

## 8. 장점 및 고려사항

### 8.1 선택된 구조의 장점

1. **개발 효율성**
   - 공통 타입 및 유틸리티 재사용
   - 일관된 개발 환경 및 도구
   - 간단한 의존성 관리

2. **유지보수성**
   - 명확한 관심사 분리
   - 서비스별 독립적인 코드 구조
   - 공통 설정의 중앙 집중식 관리

3. **확장성**
   - 새로운 서비스 추가 용이
   - 모듈식 아키텍처로 기능 확장 가능
   - 마이크로서비스 전환 준비

4. **팀 협업**
   - 일관된 코딩 스타일
   - 명확한 파일 위치 규칙
   - 효과적인 코드 리뷰 프로세스

### 8.2 향후 고려사항

1. **성능 최적화**
   - 빌드 시간 모니터링 및 최적화
   - 번들 크기 분석 및 관리
   - 캐시 전략 수립

2. **확장성 대비**
   - 서비스 분리 시점 계획
   - 마이크로서비스 전환 전략
   - API 버저닝 전략

3. **보안**
   - 공통 보안 설정 관리
   - 시크릿 관리 전략
   - 의존성 보안 스캔

---

## 생성 일시
- 작성일: 2025년 9월 7일
- 작성자: DevOps 엔지니어 + 백엔드 리드
- 버전: v1.0
- 검토자: 개발팀 리드
- 승인일: 미정