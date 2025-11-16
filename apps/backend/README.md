# Recipt Backend API

단체 재무 관리를 위한 백엔드 API 서비스입니다.

## 기술 스택

- **Runtime**: Node.js 20.x
- **Framework**: NestJS 10.x
- **Database**: PostgreSQL 15.x
- **Cache**: Redis 7.x
- **ORM**: TypeORM
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## 시작하기

### 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# 애플리케이션
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=recipt

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API Keys (선택적, 쉼표로 구분)
API_KEYS=

# SMTP (이메일 알림)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@recipt.app

# OCR 서비스 (선택적)
OCR_SERVICE_URL=http://localhost:8000
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start:prod
```

### 데이터베이스 마이그레이션

```bash
# 마이그레이션 생성
npm run migration:generate -- src/migrations/MigrationName

# 마이그레이션 실행
npm run migration:run

# 마이그레이션 되돌리기
npm run migration:revert
```

## API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:3000/api/docs
- **JSON 스펙**: http://localhost:3000/api/docs-json

## 주요 기능

### 인증 및 권한
- JWT 기반 인증
- 역할 기반 접근 제어 (RBAC)
  - ADMIN: 시스템 관리자
  - ORG_ADMIN: 조직 관리자
  - ORG_MEMBER: 조직 멤버
  - QA: 품질 보증
  - USER: 일반 사용자

### 조직 관리
- 조직 CRUD
- 조직원 관리
- 조직별 권한 설정

### 행사 관리
- 행사 생성/수정/삭제
- 행사 상태 관리 (초안, 승인, 진행중, 완료, 취소, 연기)
- 행사 참가자 관리

### 예산/정산
- 예산서 작성 (수입/지출 항목)
- 정산서 작성
- 예산 대비 결산 비교
- 영수증 업로드 및 OCR 처리

### 게시판
- 공지사항
- 자료실
- 커뮤니티 게시판
- 댓글 및 좋아요

### 알림
- 실시간 WebSocket 알림
- 이메일 알림
- 알림 설정 관리

### 파일 관리
- 이미지 업로드 (JPEG, PNG)
- PDF 문서 업로드
- 썸네일 자동 생성
- 파일 메타데이터 관리

## 성능 최적화

### 캐싱 전략
- Redis 기반 응답 캐싱
- 자동 캐시 무효화 (데이터 변경 시)
- 캐시 TTL 설정
  - 목록: 5분
  - 상세: 10분

### 데이터베이스 최적화
- N+1 쿼리 방지 (eager loading)
- 쿼리 최적화
- 연결 풀 관리

### API 최적화
- 응답 압축 (gzip)
- 표준 응답 형식
- 페이징 지원

## 보안

### API 보안
- Rate Limiting (15분당 100 요청)
- CORS 설정
- Helmet 보안 헤더
- HTTPS 강제 (프로덕션)

### 데이터 검증
- 입력 데이터 검증
- XSS 방지
- SQL Injection 방지
- 한국 전화번호 형식 검증
- 금액 범위 검증

## 테스트

```bash
# 단위 테스트
npm run test

# e2e 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

## 배포

### Docker

```bash
# 이미지 빌드
docker build -t recipt-backend .

# 컨테이너 실행
docker run -p 3000:3000 --env-file .env recipt-backend
```

### Docker Compose

```bash
# 서비스 시작 (DB, Redis 포함)
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 서비스 중지
docker-compose down
```

## 디렉토리 구조

```
apps/backend/
├── src/
│   ├── common/              # 공통 모듈
│   │   ├── decorators/      # 커스텀 데코레이터
│   │   ├── filters/         # 예외 필터
│   │   ├── guards/          # 가드
│   │   ├── interceptors/    # 인터셉터
│   │   ├── middlewares/     # 미들웨어
│   │   ├── pipes/           # 파이프
│   │   ├── services/        # 공통 서비스
│   │   └── validators/      # 커스텀 유효성 검사기
│   ├── config/              # 설정 파일
│   ├── entities/            # TypeORM 엔티티
│   ├── migrations/          # 데이터베이스 마이그레이션
│   ├── modules/             # 비즈니스 모듈
│   │   ├── auth/            # 인증
│   │   ├── users/           # 사용자
│   │   ├── organizations/   # 조직
│   │   ├── events/          # 행사
│   │   ├── budgets/         # 예산
│   │   ├── settlements/     # 정산
│   │   ├── receipts/        # 영수증
│   │   ├── posts/           # 게시판
│   │   ├── notifications/   # 알림
│   │   ├── files/           # 파일
│   │   ├── ocr/             # OCR
│   │   └── admin/           # 관리자
│   ├── app.module.ts        # 루트 모듈
│   └── main.ts              # 애플리케이션 진입점
├── test/                    # 테스트 파일
├── .env.example             # 환경 변수 예제
├── Dockerfile               # Docker 이미지
├── docker-compose.yml       # Docker Compose 설정
└── package.json             # 패키지 정의
```

## 라이센스

MIT

## 기여

이슈 및 풀 리퀘스트는 언제든지 환영합니다.
