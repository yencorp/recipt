# 03. 백엔드 개발 워크플로우

## 목표 및 범위

**목표**: NestJS 기반 RESTful API 서버 개발, 인증/권한 시스템 구축, 핵심 비즈니스 로직 구현  
**소요 기간**: 3주 (15일)  
**담당자**: 백엔드 개발자 2명, DevOps 엔지니어 (지원)  
**선행 작업**: [01_Infrastructure_Setup](./01_Infrastructure_Setup.md), [02_Database_Development](./02_Database_Development.md) 완료

## 세부 작업 목록

## Week 1: NestJS 기반 구조 및 인증 시스템 (5일)

### Day 1: NestJS 프로젝트 초기 설정 (8시간)

#### Task 3.1: NestJS 프로젝트 구조 설정 (3시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [x] NestJS CLI를 사용한 프로젝트 초기화
- [x] 모듈 구조 설계 (auth, users, events, budgets, settlements)
- [x] 공통 모듈 설정 (database, config, common)
- [x] 환경 설정 파일 구성

**완료 기준**:
- NestJS 애플리케이션 정상 시작 ✅
- 모듈간 의존성 주입 동작 ✅
- 환경별 설정 로드 확인 ✅

**산출물**:
- `backend/src/app.module.ts` ✅
- `backend/src/config/config.module.ts` ✅
- `backend/src/common/common.module.ts` ✅
- `backend/src/modules/auth/auth.module.ts` ✅
- `backend/src/modules/users/users.module.ts` ✅
- `backend/src/modules/events/events.module.ts` ✅
- `backend/src/modules/budgets/budgets.module.ts` ✅
- `backend/src/modules/settlements/settlements.module.ts` ✅

#### Task 3.2: 데이터베이스 연동 및 TypeORM 설정 (2시간)
**담당자**: 백엔드 주니어 개발자  

**세부 작업**:
- [x] TypeORM 모듈 설정
- [x] 데이터베이스 연결 설정
- [x] Entity 모듈 등록
- [x] 마이그레이션 실행 스크립트 작성

**완료 기준**:
- 데이터베이스 연결 성공 ✅
- Entity 자동 로드 확인 ✅
- 마이그레이션 정상 실행 ✅

**산출물**:
- `backend/src/database/database.module.ts` ✅
- `backend/src/database/database.service.ts` ✅ (추가 구현)
- Entity 관계 매핑 수정 완료 ✅

#### Task 3.3: 기본 미들웨어 및 글로벌 설정 (3시간) ✅
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [x] CORS 설정 ✅ (기존 구현 확인)
- [x] 요청 로깅 미들웨어 ✅ (LoggerMiddleware 구현)
- [x] 에러 핸들링 미들웨어 ✅ (HttpExceptionFilter 구현)
- [x] 유효성 검증 파이프 설정 ✅ (기존 구현 확인)
- [x] Swagger API 문서 설정 ✅ (기존 구현 확인)

**완료 기준**:
- API 엔드포인트 CORS 정상 동작 ✅
- 모든 요청/응답 로그 기록 ✅
- 에러 응답 표준화 완료 ✅
- Swagger UI 접근 가능 ✅

**산출물**:
- `backend/src/common/middlewares/logger.middleware.ts` ✅ (구현 완료)
- `backend/src/common/filters/http-exception.filter.ts` ✅ (구현 완료)
- `backend/src/main.ts` ✅ (미들웨어 통합 완료)

---

### Day 2: 사용자 인증 시스템 구현 (8시간)

#### Task 3.4: JWT 인증 전략 구현 (4시간) ✅
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [x] JWT 모듈 설정 및 토큰 생성/검증 로직 ✅
- [x] Access Token & Refresh Token 관리 ✅
- [x] Passport JWT 전략 구현 ✅
- [x] 인증 가드(Guard) 구현 ✅

**완료 기준**:
- JWT 토큰 생성/검증 정상 동작 ✅
- Access/Refresh 토큰 순환 메커니즘 구현 ✅
- 보호된 라우트 접근 제어 확인 ✅

**산출물**:
- `backend/src/modules/auth/jwt.strategy.ts` ✅
- `backend/src/modules/auth/jwt-auth.guard.ts` ✅
- `backend/src/modules/auth/auth.service.ts` ✅
- `backend/src/common/decorators/public.decorator.ts` ✅
- `backend/src/modules/auth/auth.controller.ts` ✅ (토큰 갱신 엔드포인트 추가)

#### Task 3.5: 사용자 등록/로그인 API 구현 (4시간) ✅
**담당자**: 백엔드 주니어 개발자

**세부 작업**:
- [x] 회원가입 엔드포인트 구현 ✅
- [x] 로그인/로그아웃 엔드포인트 구현 ✅
- [x] 패스워드 해싱 (bcrypt) 적용 ✅
- [x] 토큰 갱신 엔드포인트 구현 ✅
- [x] 입력 유효성 검증 DTO 작성 ✅

**완료 기준**:
- 회원가입/로그인 정상 동작 ✅
- 패스워드 안전하게 암호화 저장 ✅
- 토큰 갱신 메커니즘 동작 ✅

**산출물**:
- `backend/src/modules/auth/auth.controller.ts` ✅
- `backend/src/modules/auth/dto/register.dto.ts` ✅
- `backend/src/modules/auth/dto/login.dto.ts` ✅
- `backend/src/modules/auth/dto/refresh-token.dto.ts` ✅
- `backend/src/modules/users/users.service.ts` ✅ (create 메서드 구현)
- `backend/src/modules/auth/auth.service.ts` ✅ (register 메서드 구현)

---

### Day 3: 사용자 관리 모듈 구현 (8시간)

#### Task 3.6: 사용자 프로필 관리 API (4시간)
**담당자**: 백엔드 주니어 개발자  

**세부 작업**:
- [ ] 사용자 프로필 조회 엔드포인트
- [ ] 사용자 정보 수정 엔드포인트
- [ ] 패스워드 변경 엔드포인트
- [ ] 사용자 소속 단체 조회

**완료 기준**:
- 사용자 CRUD 기능 완전히 구현
- 권한 기반 접근 제어 적용
- 입력 데이터 유효성 검증

**산출물**:
- `backend/src/users/users.controller.ts`
- `backend/src/users/users.service.ts`
- `backend/src/users/dto/update-user.dto.ts`

#### Task 3.7: 권한 및 역할 기반 접근 제어 (RBAC) (4시간) ✅
**담당자**: 백엔드 시니어 개발자
**완료일**: 2025-11-16

**세부 작업**:
- [x] 역할 기반 가드 구현
- [x] 단체별 권한 관리 로직
- [x] 관리자 권한 체크 데코레이터
- [x] 리소스 소유권 검증 로직

**완료 기준**:
- 단체별 데이터 접근 제어 확인
- 관리자 전용 기능 보호
- 본인 데이터만 수정 가능 확인

**산출물**:
- `backend/src/modules/auth/roles.guard.ts`
- `backend/src/modules/auth/roles.decorator.ts`
- `backend/src/common/guards/ownership.guard.ts`

---

### Day 4: 단체 및 행사 관리 모듈 (8시간)

#### Task 3.8: 단체 관리 API 구현 (3시간) ✅
**담당자**: 백엔드 주니어 개발자
**완료일**: 2025-11-16

**세부 작업**:
- [x] 단체 목록 조회 API
- [x] 단체 상세 정보 조회 API
- [x] 단체 구성원 관리 API (관리자 전용)
- [x] 사용자-단체 연결 관리

**완료 기준**:
- 단체 정보 CRUD 완전 구현
- 구성원 추가/제거 기능 동작
- 권한별 접근 제어 적용

**산출물**:
- `backend/src/modules/organizations/organizations.controller.ts`
- `backend/src/modules/organizations/organizations.service.ts`
- `backend/src/modules/organizations/organizations.module.ts`
- `backend/src/modules/organizations/dto/*.ts`

#### Task 3.9: 행사 관리 API 구현 (5시간)
**담당자**: 백엔드 개발자 2명 (병렬 작업)

**Developer A: 기본 CRUD (2.5시간)**:
- [ ] 행사 생성 API
- [ ] 행사 목록 조회 API (필터링, 페이징)
- [ ] 행사 상세 조회 API

**Developer B: 고급 기능 (2.5시간)**:
- [ ] 행사 수정/삭제 API
- [ ] 행사 상태 관리 (진행중, 완료, 취소)
- [ ] 행사별 권한 관리 (작성자, 관리자)

**완료 기준**:
- 행사 전체 라이프사이클 관리 가능
- 단체별 행사 필터링 동작
- 작성자/관리자 권한 제어 확인

**산출물**:
- `backend/src/events/events.controller.ts`
- `backend/src/events/events.service.ts`
- `backend/src/events/dto/create-event.dto.ts`
- `backend/src/events/dto/update-event.dto.ts`

---

### Day 5: API 문서화 및 테스트 (8시간)

#### Task 3.10: Swagger API 문서 작성 (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] 모든 엔드포인트 Swagger 어노테이션 추가
- [ ] DTO 클래스 문서화
- [ ] 인증 방식 문서화
- [ ] 에러 응답 예제 작성

**완료 기준**:
- Swagger UI에서 모든 API 확인 가능
- Try it out 기능으로 테스트 가능
- 명확한 요청/응답 예제 제공

**산출물**:
- 완성된 Swagger API 문서
- `docs/api/swagger-config.ts`

#### Task 3.11: 단위 테스트 작성 (4시간)
**담당자**: 백엔드 개발자 2명

**세부 작업**:
- [ ] Service 클래스 단위 테스트
- [ ] Controller 클래스 테스트
- [ ] 인증/권한 로직 테스트
- [ ] 테스트 커버리지 측정

**완료 기준**:
- 핵심 로직 테스트 커버리지 80% 이상
- 모든 테스트 케이스 통과
- CI에서 자동 테스트 실행

**산출물**:
- `backend/src/**/*.spec.ts`
- `backend/test/jest-e2e.json`

## Week 2: 예산 관리 시스템 (5일)

### Day 6: 예산서 관리 API (8시간)

#### Task 3.12: 예산서 기본 CRUD API (4시간)
**담당자**: 백엔드 주니어 개발자  

**세부 작업**:
- [ ] 예산서 생성 API (행사 연결)
- [ ] 예산서 조회 API
- [ ] 예산서 수정 API
- [ ] 예산서 삭제 API

**완료 기준**:
- 행사당 하나의 예산서만 생성 가능
- 예산서 상태 관리 (작성중, 완료, 승인)
- 권한 기반 접근 제어 적용

**산출물**:
- `backend/src/budgets/budgets.controller.ts`
- `backend/src/budgets/budgets.service.ts`
- `backend/src/budgets/dto/create-budget.dto.ts`

#### Task 3.13: 예산 항목 관리 API (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] 예산 항목 추가/수정/삭제 API
- [ ] 예산 카테고리 관리
- [ ] 예산 집계 및 계산 로직
- [ ] 예산 승인 워크플로우

**완료 기준**:
- 예산 항목 동적 관리 가능
- 수입/지출 자동 집계 정확성
- 예산 초과 알림 기능

**산출물**:
- `backend/src/budget-items/budget-items.controller.ts`
- `backend/src/budget-items/budget-items.service.ts`

---

### Day 7: 결산서 관리 API (8시간)

#### Task 3.14: 결산서 기본 CRUD API (4시간)
**담당자**: 백엔드 주니어 개발자  

**세부 작업**:
- [ ] 결산서 생성 API (행사 및 예산서 연결)
- [ ] 결산서 조회 API
- [ ] 결산서 수정/삭제 API
- [ ] 예산서 대비 결산 비교 로직

**완료 기준**:
- 예산서 기반 결산서 생성
- 예산 vs 실제 비교 데이터 제공
- 결산 승인 프로세스 구현

**산출물**:
- `backend/src/settlements/settlements.controller.ts`
- `backend/src/settlements/settlements.service.ts`

#### Task 3.15: 결산 항목 및 영수증 연동 API (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] 결산 항목 관리 API
- [ ] 영수증 업로드 준비 API
- [ ] OCR 작업 연동 인터페이스
- [ ] 영수증 데이터 결산 항목 매핑

**완료 기준**:
- 영수증 데이터 결산 항목 자동 반영
- OCR 서비스와 통신 인터페이스 준비
- 수동 입력과 OCR 입력 구분 관리

**산출물**:
- `backend/src/settlement-items/settlement-items.controller.ts`
- `backend/src/receipts/receipts.controller.ts`

---

### Day 8: 블로그 및 알림 시스템 (8시간)

#### Task 3.16: 블로그 포스트 관리 API (4시간)
**담당자**: 백엔드 주니어 개발자  

**세부 작업**:
- [ ] 블로그 포스트 CRUD API
- [ ] 포스트 카테고리 관리
- [ ] 포스트 공개/비공개 설정
- [ ] 관리자 전용 포스트 작성 권한

**완료 기준**:
- 관리자만 포스트 작성/수정 가능
- 모든 사용자 포스트 조회 가능
- 포스트 목록 페이징 처리

**산출물**:
- `backend/src/posts/posts.controller.ts`
- `backend/src/posts/posts.service.ts`

#### Task 3.17: 알림 시스템 기반 구조 (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] 알림 엔티티 및 서비스 구현
- [ ] 실시간 알림 기반 구조 (WebSocket 준비)
- [ ] 이메일 알림 서비스 인터페이스
- [ ] 알림 설정 관리

**완료 기준**:
- 알림 생성/조회/읽음 처리 API
- 사용자별 알림 설정 관리
- 향후 실시간 알림 확장 가능한 구조

**산출물**:
- `backend/src/notifications/notifications.controller.ts`
- `backend/src/notifications/notifications.service.ts`

---

### Day 9: 관리자 기능 구현 (8시간)

#### Task 3.18: 관리자 사용자 관리 API (4시간)
**담당자**: 백엔드 개발자 2명

**세부 작업**:
- [ ] 전체 사용자 목록 조회 (검색, 필터링)
- [ ] 사용자 상세 정보 관리
- [ ] 사용자 계정 활성화/비활성화
- [ ] 사용자 권한 및 단체 배정 관리

**완료 기준**:
- 관리자 전용 API 접근 제어
- 사용자 검색 및 필터링 기능
- 사용자 상태 관리 완전 구현

**산출물**:
- `backend/src/admin/users/admin-users.controller.ts`
- `backend/src/admin/users/admin-users.service.ts`

#### Task 3.19: 관리자 시스템 관리 API (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] 단체 관리 (추가, 수정, 삭제)
- [ ] 시스템 설정 관리
- [ ] 사용 통계 및 대시보드 데이터 API
- [ ] 데이터 백업/복원 API 인터페이스

**완료 기준**:
- 관리자 시스템 운영 기능 완전 구현
- 통계 데이터 실시간 조회 가능
- 시스템 상태 모니터링 API

**산출물**:
- `backend/src/admin/system/admin-system.controller.ts`
- `backend/src/admin/dashboard/admin-dashboard.controller.ts`

---

### Day 10: 통합 테스트 및 최적화 (8시간)

#### Task 3.20: API 통합 테스트 (4시간)
**담당자**: 백엔드 개발자 2명  

**세부 작업**:
- [ ] E2E 테스트 시나리오 작성
- [ ] 전체 워크플로우 테스트 (회원가입→행사생성→예결산작성)
- [ ] API 성능 테스트
- [ ] 동시성 테스트

**완료 기준**:
- 주요 시나리오 E2E 테스트 통과
- API 응답 시간 기준 만족
- 동시 접속 부하 테스트 통과

**산출물**:
- `backend/test/e2e/*.spec.ts`
- `backend/test/performance/*.spec.ts`

#### Task 3.21: 코드 최적화 및 리팩토링 (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] 중복 코드 제거
- [ ] 공통 로직 모듈화
- [ ] 쿼리 최적화 및 N+1 문제 해결
- [ ] 에러 핸들링 표준화

**완료 기준**:
- 코드 품질 지표 개선
- 쿼리 성능 최적화 완료
- 일관된 에러 응답 형식

**산출물**:
- 리팩토링된 소스 코드
- `docs/api/error-handling.md`

## Week 3: 파일 처리 및 보안 강화 (5일)

### Day 11: 파일 업로드 시스템 (8시간)

#### Task 3.22: 파일 업로드 기본 인프라 (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] Multer 설정 및 파일 업로드 미들웨어
- [ ] 파일 저장 경로 및 명명 규칙 설정
- [ ] 파일 타입 및 크기 제한 설정
- [ ] 업로드된 파일 메타데이터 관리

**완료 기준**:
- 이미지 파일 안전한 업로드 가능
- 파일 크기 및 형식 제한 동작
- 업로드 파일 경로 관리

**산출물**:
- `backend/src/common/middlewares/file-upload.middleware.ts`
- `backend/src/files/files.controller.ts`
- `backend/src/files/files.service.ts`

#### Task 3.23: 영수증 이미지 처리 API (4시간)
**담당자**: 백엔드 주니어 개발자  

**세부 작업**:
- [ ] 영수증 이미지 업로드 API
- [ ] 이미지 썸네일 생성
- [ ] OCR 서비스 호출 인터페이스
- [ ] OCR 작업 상태 관리

**완료 기준**:
- 대용량 이미지 일괄 업로드 지원
- 썸네일 자동 생성 동작
- OCR 서비스 비동기 호출 구현

**산출물**:
- `backend/src/receipts/receipt-upload.controller.ts`
- `backend/src/ocr/ocr-jobs.service.ts`

---

### Day 12: 외부 서비스 연동 (8시간)

#### Task 3.24: OCR 마이크로서비스 통신 (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] OCR 서비스 HTTP 클라이언트 구현
- [ ] OCR 작업 큐 관리 시스템
- [ ] OCR 결과 처리 및 데이터베이스 저장
- [ ] OCR 작업 실패 처리 및 재시도 로직

**완료 기준**:
- OCR 서비스와 안정적 통신
- 작업 결과 정확한 저장
- 실패 시 적절한 에러 처리

**산출물**:
- `backend/src/ocr/ocr-client.service.ts`
- `backend/src/ocr/ocr-queue.service.ts`

#### Task 3.25: 이메일 알림 서비스 (4시간)
**담당자**: 백엔드 주니어 개발자  

**세부 작업**:
- [ ] 이메일 전송 서비스 설정 (Nodemailer)
- [ ] 이메일 템플릿 시스템
- [ ] 비동기 이메일 전송 큐
- [ ] 이메일 전송 상태 추적

**완료 기준**:
- 다양한 이메일 템플릿 지원
- 대량 이메일 전송 가능
- 전송 실패 추적 및 재시도

**산출물**:
- `backend/src/notifications/email/email.service.ts`
- `backend/src/notifications/email/templates/`

---

### Day 13: 데이터 검증 및 보안 강화 (8시간)

#### Task 3.26: 입력 데이터 검증 강화 (4시간)
**담당자**: 백엔드 개발자 2명

**세부 작업**:
- [ ] DTO 클래스 유효성 검증 규칙 강화
- [ ] 커스텀 유효성 검증 데코레이터 작성
- [ ] XSS 방지 및 입력 데이터 필터링
- [ ] SQL Injection 방지 검증

**완료 기준**:
- 모든 API 입력 데이터 검증 완료
- 악성 입력 차단 확인
- 에러 메시지 명확성

**산출물**:
- `backend/src/common/validators/*.ts`
- `backend/src/common/decorators/validation.decorator.ts`

#### Task 3.27: API 보안 미들웨어 구현 (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] Rate Limiting 미들웨어
- [ ] API 키 기반 인증 (선택적)
- [ ] 요청 로깅 및 감사
- [ ] HTTPS 강제 리다이렉션

**완료 기준**:
- DDoS 공격 방지 동작
- 모든 API 호출 로깅
- 보안 헤더 적절히 설정

**산출물**:
- `backend/src/common/middlewares/rate-limit.middleware.ts`
- `backend/src/common/middlewares/security.middleware.ts`

---

### Day 14: 성능 최적화 (8시간)

#### Task 3.28: 데이터베이스 쿼리 최적화 (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] N+1 쿼리 문제 해결
- [ ] 복잡한 조인 쿼리 최적화
- [ ] 페이징 성능 개선
- [ ] 캐시 전략 구현 (Redis)

**완료 기준**:
- 주요 API 응답 시간 500ms 이내
- 데이터베이스 연결 풀 최적화
- 캐시 적중률 80% 이상

**산출물**:
- `backend/src/common/interceptors/cache.interceptor.ts`
- 최적화된 서비스 클래스들

#### Task 3.29: API 응답 최적화 (4시간)
**담당자**: 백엔드 주니어 개발자  

**세부 작업**:
- [ ] 응답 데이터 압축 (gzip)
- [ ] 불필요한 데이터 제거
- [ ] API 응답 형식 표준화
- [ ] 페이지네이션 최적화

**완료 기준**:
- 응답 크기 30% 이상 감소
- 일관된 API 응답 구조
- 대용량 데이터 효율적 처리

**산출물**:
- `backend/src/common/interceptors/transform.interceptor.ts`
- `backend/src/common/dto/base-response.dto.ts`

---

### Day 15: 문서화 및 배포 준비 (8시간)

#### Task 3.30: API 문서 완성 및 배포 준비 (4시간)
**담당자**: 백엔드 시니어 개발자  

**세부 작업**:
- [ ] 완전한 Swagger 문서 작성
- [ ] API 사용 가이드 문서 작성
- [ ] 에러 코드 및 처리 가이드
- [ ] 프로덕션 환경 설정 준비

**완료 기준**:
- API 문서 100% 완성
- 개발자 가이드 작성 완료
- 프로덕션 설정 검증

**산출물**:
- 완성된 Swagger 문서
- `docs/api/developer-guide.md`
- `backend/.env.production`

#### Task 3.31: 최종 테스트 및 검증 (4시간)
**담당자**: 백엔드 개발자 2명 + DevOps  

**세부 작업**:
- [ ] 전체 기능 회귀 테스트
- [ ] 성능 벤치마크 테스트
- [ ] 보안 스캔 및 취약점 점검
- [ ] 배포 파이프라인 테스트

**완료 기준**:
- 모든 기능 테스트 통과
- 성능 기준 만족
- 보안 취약점 없음 확인

**검증 항목**:
- [ ] API 응답 시간 < 500ms
- [ ] 동시 사용자 50명 처리 가능
- [ ] 메모리 사용량 적정 수준
- [ ] 모든 테스트 케이스 통과

## 병렬 작업 가능성

### Week 1: 기반 구조 병렬 개발
```
Developer A (시니어)               Developer B (주니어)
├─ NestJS 프로젝트 구조            ├─ TypeORM 설정
├─ JWT 인증 시스템                ├─ 사용자 등록/로그인 API  
├─ 권한 관리 시스템               ├─ 사용자 프로필 관리
└─ 행사 관리 (고급 기능)          └─ 행사 관리 (기본 CRUD)
```

### Week 2: 기능 모듈 병렬 개발
```
Developer A                      Developer B
├─ 예산 항목 관리                ├─ 예산서 기본 CRUD
├─ 결산 OCR 연동                 ├─ 결산서 기본 CRUD
├─ 알림 시스템                   ├─ 블로그 관리
└─ 관리자 시스템 관리            └─ 관리자 사용자 관리
```

### Week 3: 고도화 병렬 개발
```
Developer A (시니어)               Developer B (주니어)  
├─ 파일 업로드 인프라             ├─ 영수증 이미지 처리
├─ OCR 서비스 연동               ├─ 이메일 알림 서비스
├─ 성능 최적화                   ├─ 입력 검증 강화
└─ 문서화                        └─ API 응답 최적화
```

## 위험 요소 및 대응 방안

### 기술적 위험
1. **복잡한 비즈니스 로직**
   - 위험: 예결산 로직의 복잡성
   - 대응: 단위 테스트 철저, 단계적 구현

2. **외부 서비스 의존성**
   - 위험: OCR 서비스 통신 장애
   - 대응: 재시도 로직, 장애 격리

3. **성능 병목**
   - 위험: 복잡한 쿼리, 대용량 파일 처리
   - 대응: 쿼리 최적화, 비동기 처리

### 일정 위험
1. **NestJS 학습 곡선**
   - 위험: 팀원의 프레임워크 경험 부족
   - 대응: 페어 프로그래밍, 코드 리뷰 강화

2. **요구사항 변경**
   - 위험: 개발 중 API 스펙 변경
   - 대응: 유연한 아키텍처, 문서화

## 완료 후 확인 사항

### 기능 검증
- [ ] 모든 REST API 정상 동작
- [ ] 인증/권한 시스템 완전 구현
- [ ] 파일 업로드 및 처리 정상 동작
- [ ] OCR 서비스 연동 확인
- [ ] 이메일 발송 기능 동작

### 성능 검증
- [ ] API 응답 시간 기준 만족
- [ ] 동시 접속 부하 테스트 통과
- [ ] 데이터베이스 연결 풀 효율성
- [ ] 메모리 사용량 적정 수준

### 보안 검증
- [ ] 인증 토큰 안전성 확인
- [ ] 입력 데이터 검증 완료
- [ ] SQL Injection 방어 확인
- [ ] XSS 공격 방어 확인

## 다음 단계

워크플로우 완료 후 진행할 작업:
1. **[04_Frontend_Development](./04_Frontend_Development.md)** - React 프론트엔드와 API 연동
2. **[05_OCR_System_Development](./05_OCR_System_Development.md)** - OCR 마이크로서비스 개발

---

**관련 문서**:
- [TSD 04_Backend_Architecture](../TSD/04_Backend_Architecture.md)
- [TSD 01_API_Specification](../TSD/01_API_Specification.md)
- [메인 워크플로우](./00_Main_Workflow.md)