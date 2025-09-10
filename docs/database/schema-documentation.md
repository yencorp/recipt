# 데이터베이스 스키마 종합 문서

## 개요

본 문서는 광남동성당 청소년위원회 예결산 관리 시스템의 실제 구현된 데이터베이스 스키마를 종합적으로 정리한 문서입니다.

**기술 스택**:
- PostgreSQL 15+
- TypeORM 0.3+
- Node.js + TypeScript

**문서 기준일**: 2025년 1월 11일  
**데이터베이스 버전**: v1.0  
**마이그레이션 적용 완료**: 2025-01-08

---

## 1. 데이터베이스 구조 개요

### 1.1 테이블 분류

#### 핵심 도메인 테이블 (13개)
| 테이블명 | 설명 | 주요 기능 |
|---------|------|----------|
| `users` | 사용자 계정 | 인증, 권한 관리 |
| `organizations` | 단체 정보 | 청년회, 자모회, 초등부, 중고등부 |
| `user_organizations` | 사용자-단체 관계 | 역할 및 권한 매핑 |
| `events` | 행사 관리 | 행사 일정, 예산 할당 |
| `budgets` | 예산서 | 수입/지출 계획 |
| `budget_incomes` | 예산 수입 항목 | 수입 세부 내역 |
| `budget_expenses` | 예산 지출 항목 | 지출 세부 내역 |
| `settlements` | 결산서 | 실제 수입/지출 정산 |
| `settlement_items` | 결산 세부 항목 | 정산 세부 내역 |
| `receipt_scans` | 영수증 스캔 | OCR 처리 대상 이미지 |
| `receipt_validations` | 영수증 검증 | 사용자 검증 및 수정 |
| `ocr_results` | OCR 처리 결과 | 텍스트 추출 결과 |
| `audit_trails` | 감사 로그 | 시스템 활동 추적 |

### 1.2 스키마 설계 원칙

1. **UUID 기반 식별자**: 모든 테이블의 Primary Key는 UUID 사용
2. **타임스탬프 표준화**: `created_at`, `updated_at` 필드 공통 적용
3. **Soft Delete 지원**: 물리적 삭제 대신 `is_active`, `deleted_at` 활용
4. **관계 무결성**: 외래키 제약조건으로 데이터 일관성 보장
5. **인덱스 최적화**: 조회 성능을 위한 단일/복합 인덱스 설계
6. **Enum 타입 활용**: 상태값 관리를 위한 TypeScript Enum 매핑

---

## 2. 테이블별 상세 스키마

### 2.1 사용자 관리

#### users (사용자)
```typescript
// Entity: User
// Status: ✅ 구현 완료
// Migration: 1757331860358-CreateUsersTable.ts
```

**주요 필드**:
- `id`: UUID Primary Key
- `email`: 이메일 (unique, 로그인 ID)
- `password_hash`: 암호화된 비밀번호
- `name`: 사용자 이름
- `baptismal_name`: 세례명 (선택)
- `phone`: 연락처
- `birth_date`: 생년월일
- `position`: 직책/역할
- `status`: 계정 상태 (ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION)
- `role`: 시스템 역할 (SUPER_ADMIN, ORGANIZATION_ADMIN, etc.)
- `last_login_at`: 마지막 로그인

**주요 인덱스**:
- `idx_users_email`: 이메일 조회 최적화
- `idx_users_status`: 상태별 필터링
- `idx_users_role`: 역할별 조회

#### organizations (단체)
```typescript
// Entity: Organization  
// Status: ✅ 구현 완료
// Migration: 1757332045857-CreateOrganizationsTable.ts
```

**고정 단체 (4개)**:
- 청년회 (YOUTH)
- 자모회 (MOTHERS) 
- 초등부 주일학교 (ELEMENTARY)
- 중고등부 주일학교 (MIDDLE_HIGH)

**주요 필드**:
- `id`: UUID Primary Key
- `name`: 단체명
- `code`: 단체 코드 (unique)
- `description`: 설명
- `settings`: 단체별 설정 (JSONB)
- `is_active`: 활성 상태

#### user_organizations (사용자-단체 관계)
```typescript
// Entity: UserOrganization
// Status: ✅ 구현 완료  
// Migration: 1757332257934-CreateUserOrganizationsTable.ts
```

**역할 유형**:
- `ADMIN`: 단체 관리자
- `TREASURER`: 회계
- `ACCOUNTANT`: 회계담당
- `SECRETARY`: 총무
- `MEMBER`: 일반 회원
- `OBSERVER`: 옵저버

**권한 관리**: JSONB 타입으로 세밀한 권한 제어
- `canViewBudgets`, `canCreateBudgets`, `canApproveBudgets`
- `canViewSettlements`, `canCreateSettlements`, `canApproveSettlements`
- `canManageEvents`, `canManageMembers`, `canViewReports`

### 2.2 행사 및 예산 관리

#### events (행사)
```typescript
// Entity: Event
// Status: ✅ 구현 완료
// Migration: 1757332260435-CreateEventsTable.ts
```

**상태 관리**:
- `PLANNING`: 기획중
- `IN_PROGRESS`: 진행중
- `COMPLETED`: 완료
- `CANCELLED`: 취소

**핵심 기능**:
- 행사별 예산 할당
- 날짜 유효성 검증
- 단체별 행사 관리

#### budgets (예산서)
```typescript
// Entity: Budget
// Status: ✅ 구현 완료
// Migration: 1757332263014-CreateBudgetsTable.ts
```

**예산 관리 특징**:
- 행사당 1개 예산서 (unique constraint)
- 수입/지출 총액 자동 계산
- 승인 워크플로 지원
- 버전 관리 시스템

**비즈니스 메서드**:
- `submit()`: 예산서 제출
- `approve()`: 예산서 승인
- `reject()`: 예산서 반려
- `updateAmounts()`: 금액 재계산

#### budget_incomes / budget_expenses
```typescript
// Entity: BudgetIncome, BudgetExpense
// Status: ✅ 구현 완료
// Migration: 1757332265611, 1757332277135
```

**세부 항목 관리**:
- 카테고리별 분류
- 표시 순서 제어
- 실제 집행액 추적
- 예산 대비 실적 분석

### 2.3 결산 관리

#### settlements (결산서)
```typescript
// Entity: Settlement
// Status: ✅ 구현 완료
// Migration: 1757332280000-CreateSettlementsTable.ts
```

**결산 프로세스**:
1. `DRAFT`: 작성중
2. `IN_PROGRESS`: 정산중
3. `COMPLETED`: 정산완료

**자동 계산 필드**:
- 총 수입/지출 금액
- 수지 차액
- 예산 대비 실적률

#### settlement_items (결산 항목)
```typescript
// Entity: SettlementItem
// Status: ✅ 구현 완료
// Migration: 1757332285000-CreateSettlementItemsTable.ts
```

**영수증 연동**:
- 영수증 이미지와 1:1 매핑
- OCR 결과 자동 반영
- 수동 수정 및 검증 지원

### 2.4 OCR 및 영수증 처리

#### receipt_scans (영수증 스캔)
```typescript
// Entity: ReceiptScan
// Status: ✅ 구현 완료
// Migration: 1757332295000-CreateReceiptScansTable.ts
```

**이미지 관리**:
- 원본 이미지 저장 경로
- 썸네일 생성
- 메타데이터 관리 (크기, 해상도, 포맷)

**OCR 처리 상태**:
- `PENDING`: 처리 대기
- `PROCESSING`: 처리중
- `COMPLETED`: 처리완료
- `FAILED`: 처리실패

#### receipt_validations (영수증 검증)
```typescript
// Entity: ReceiptValidation
// Status: ✅ 구현 완료
// Migration: 1757332305000-CreateReceiptValidationsTable.ts
```

**검증 프로세스**:
1. OCR 자동 추출
2. 사용자 검토 및 수정
3. 최종 승인
4. 결산서 반영

**데이터 구조화**:
- JSON 형태로 영수증 세부 항목 저장
- 상호명, 금액, 구매 항목별 분류
- 신뢰도 점수 관리

#### ocr_results (OCR 처리 결과)
```typescript
// Entity: OCRResult
// Status: ✅ 구현 완료
// Migration: 1757332300000-CreateOcrResultsTable.ts
```

**다단계 OCR 처리**:
1. Tesseract (1차)
2. EasyOCR (2차)
3. Google Vision API (3차)

**결과 데이터**:
- 추출된 텍스트
- 신뢰도 점수
- 구조화된 데이터 (JSON)
- 오류 정보

### 2.5 감사 및 로깅

#### audit_trails (감사 로그)
```typescript
// Entity: AuditTrail
// Status: ✅ 구현 완료
// Migration: 1757332290000-CreateAuditTrailsTable.ts
```

**추적 대상**:
- 사용자 인증/인가 활동
- 예산서/결산서 변경 이력
- 시스템 설정 변경
- 데이터 수정/삭제 작업

**로그 레벨**:
- `INFO`: 일반 정보
- `WARNING`: 주의사항
- `ERROR`: 오류 발생
- `CRITICAL`: 심각한 문제

---

## 3. 관계 설계 및 제약조건

### 3.1 주요 관계

#### 1:N 관계
- `Organization` → `UserOrganization` (단체-회원)
- `Organization` → `Event` (단체-행사)
- `Event` → `Budget` (행사-예산서)
- `Budget` → `BudgetIncome/Expense` (예산-항목)
- `Event` → `Settlement` (행사-결산서)
- `Settlement` → `SettlementItem` (결산-항목)

#### 다대다 관계
- `User` ↔ `Organization` (through `UserOrganization`)

#### 특수 관계
- `ReceiptScan` → `OCRResult` (1:N, OCR 재처리 가능)
- `OCRResult` → `ReceiptValidation` (1:1, 검증)
- `ReceiptValidation` → `SettlementItem` (1:1, 결산 반영)

### 3.2 제약조건

#### 비즈니스 규칙 제약
```sql
-- 행사 날짜 유효성
CONSTRAINT events_date_order CHECK (start_date <= end_date)

-- 예산 금액 양수
CONSTRAINT budgets_amounts_positive CHECK (
    total_income_amount >= 0 AND total_expense_amount >= 0
)

-- 영수증 금액 양수
CONSTRAINT receipt_validations_amount_positive CHECK (total_amount > 0)

-- OCR 신뢰도 범위
CONSTRAINT ocr_confidence_range CHECK (
    confidence_score >= 0 AND confidence_score <= 1
)
```

#### 고유성 제약
- 행사당 1개 예산서: `budgets(event_id) UNIQUE`
- 행사당 1개 결산서: `settlements(event_id) UNIQUE`
- 사용자-단체 관계: `user_organizations(user_id, organization_id) UNIQUE`

---

## 4. 인덱스 전략

### 4.1 성능 최적화 인덱스

#### 단일 컬럼 인덱스
```sql
-- 자주 조회되는 외래키
CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_budgets_event_id ON budgets(event_id);
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);

-- 상태 필터링
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_budgets_status ON budgets(status);

-- 날짜 기반 조회
CREATE INDEX idx_events_start_date ON events(start_date DESC);
CREATE INDEX idx_audit_trails_created_at ON audit_trails(created_at DESC);
```

#### 복합 인덱스 (성능 최적화)
```sql
-- 단체별 행사 조회
CREATE INDEX idx_events_org_date ON events(organization_id, start_date DESC);

-- 사용자별 활성 역할
CREATE INDEX idx_user_orgs_active ON user_organizations(user_id, status) 
WHERE status = 'ACTIVE';

-- 결산별 영수증 조회  
CREATE INDEX idx_receipt_validations_settlement ON receipt_validations(settlement_id, created_at DESC);
```

#### 부분 인덱스 (선택적 최적화)
```sql
-- 활성 사용자만
CREATE INDEX idx_users_active ON users(last_login_at DESC) 
WHERE status = 'ACTIVE';

-- 처리 중인 OCR 작업
CREATE INDEX idx_ocr_results_processing ON ocr_results(created_at DESC) 
WHERE status = 'PROCESSING';
```

### 4.2 전문 검색 인덱스
```sql
-- 사용자명 검색
CREATE INDEX idx_users_name_search ON users USING gin(name gin_trgm_ops);

-- 행사명 검색
CREATE INDEX idx_events_name_search ON events USING gin(name gin_trgm_ops);

-- 영수증 상호명 검색
CREATE INDEX idx_receipt_merchant_search ON receipt_validations 
USING gin((extracted_data->>'merchant_name') gin_trgm_ops);
```

---

## 5. 데이터 타입 및 검증

### 5.1 표준 데이터 타입

#### 문자열
- `VARCHAR(50)`: 코드, 상태값
- `VARCHAR(100)`: 이름, 제목
- `VARCHAR(255)`: URL, 경로
- `TEXT`: 긴 텍스트, 설명

#### 숫자
- `DECIMAL(15,2)`: 금액 (최대 13자리, 소수점 2자리)
- `DECIMAL(5,2)`: 비율, 신뢰도 (0.00~100.00)
- `INTEGER`: 카운트, 순서
- `UUID`: 모든 Primary Key

#### 날짜/시간
- `DATE`: 생년월일, 행사날짜
- `TIMESTAMP`: 생성/수정 시간, 로그인 시간

#### JSON
- `JSONB`: 설정값, OCR 결과, 메타데이터

### 5.2 유효성 검증

#### 클래스 검증 (class-validator)
```typescript
@IsEmail({}, { message: "유효한 이메일 주소를 입력해주세요." })
email: string;

@IsDecimal({ decimal_digits: "0,2" })
@Min(0, { message: "금액은 0 이상이어야 합니다." })
amount: number;

@IsEnum(BudgetStatus)
status: BudgetStatus;

@IsDateString()
@IsOptional()
startDate?: string;
```

#### 데이터베이스 제약조건
```sql
-- 이메일 형식
CONSTRAINT users_email_check CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
)

-- 전화번호 형식
CONSTRAINT users_phone_check CHECK (
    phone ~ '^[0-9-]{10,15}$'
)

-- 날짜 순서
CONSTRAINT events_date_order CHECK (start_date <= end_date)
```

---

## 6. 마이그레이션 현황

### 6.1 적용 완료 마이그레이션 (13개)

| 순번 | 마이그레이션 파일 | 설명 | 적용일 |
|------|------------------|------|--------|
| 1 | `1757331860358-CreateUsersTable.ts` | 사용자 테이블 | 2025-01-08 |
| 2 | `1757332045857-CreateOrganizationsTable.ts` | 단체 테이블 | 2025-01-08 |
| 3 | `1757332257934-CreateUserOrganizationsTable.ts` | 사용자-단체 관계 | 2025-01-08 |
| 4 | `1757332260435-CreateEventsTable.ts` | 행사 테이블 | 2025-01-08 |
| 5 | `1757332263014-CreateBudgetsTable.ts` | 예산서 테이블 | 2025-01-08 |
| 6 | `1757332265611-CreateBudgetIncomesTable.ts` | 예산 수입 | 2025-01-08 |
| 7 | `1757332277135-CreateBudgetExpensesTable.ts` | 예산 지출 | 2025-01-08 |
| 8 | `1757332280000-CreateSettlementsTable.ts` | 결산서 테이블 | 2025-01-08 |
| 9 | `1757332285000-CreateSettlementItemsTable.ts` | 결산 항목 | 2025-01-08 |
| 10 | `1757332290000-CreateAuditTrailsTable.ts` | 감사 로그 | 2025-01-08 |
| 11 | `1757332295000-CreateReceiptScansTable.ts` | 영수증 스캔 | 2025-01-08 |
| 12 | `1757332300000-CreateOcrResultsTable.ts` | OCR 결과 | 2025-01-08 |
| 13 | `1757332305000-CreateReceiptValidationsTable.ts` | 영수증 검증 | 2025-01-08 |

### 6.2 마이그레이션 실행 순서

1. **기본 테이블**: users, organizations
2. **관계 테이블**: user_organizations, events
3. **예산 관련**: budgets, budget_incomes, budget_expenses
4. **결산 관련**: settlements, settlement_items
5. **OCR/영수증**: receipt_scans, ocr_results, receipt_validations
6. **시스템**: audit_trails

---

## 7. 성능 및 최적화

### 7.1 조회 성능 기준

#### 목표 응답 시간
- **단순 조회**: 100ms 이내
- **복잡한 조회**: 500ms 이내
- **페이징 쿼리**: 300ms 이내
- **검색 쿼리**: 1초 이내

#### 주요 성능 지표
- **인덱스 히트율**: 90% 이상
- **캐시 히트율**: 85% 이상
- **동시 접속**: 50명까지 처리 가능
- **데이터 처리량**: 10,000건/분

### 7.2 최적화 전략

#### 쿼리 최적화
- JOIN 쿼리 최적화 (적절한 인덱스 활용)
- N+1 문제 해결 (eager loading 활용)
- 복잡한 집계 쿼리 최적화

#### 인덱스 관리
- 정기적인 REINDEX 실행
- 사용하지 않는 인덱스 정리
- 통계 정보 업데이트 (ANALYZE)

#### 데이터 관리
- 정기적인 VACUUM 실행
- 파티셔닝 고려 (audit_trails 등)
- 아카이브 정책 수립

---

## 8. 보안 및 규정 준수

### 8.1 데이터 보안

#### 암호화
- **비밀번호**: bcrypt 해시
- **민감한 개인정보**: 암호화 저장 고려
- **통신**: HTTPS/TLS 사용

#### 접근 제어
- **데이터베이스**: 역할 기반 접근 제어
- **애플리케이션**: JWT 토큰 인증
- **API**: 권한 별 엔드포인트 제어

### 8.2 감사 및 로깅

#### 감사 로그
- 모든 중요 작업 로깅
- 사용자 활동 추적
- 시스템 변경 이력 관리

#### 데이터 무결성
- 외래키 제약조건 강제
- 트랜잭션 사용
- 정기적인 무결성 검증

---

## 9. 백업 및 복구

### 9.1 백업 전략

#### 정기 백업
- **전체 백업**: 주 1회 (일요일 새벽)
- **증분 백업**: 일 1회 (매일 새벽 2시)
- **로그 백업**: 실시간

#### 백업 보관
- **온사이트**: 30일간 보관
- **오프사이트**: 1년간 보관
- **암호화**: 모든 백업 파일 암호화

### 9.2 복구 계획

#### 복구 시나리오
1. **부분 복구**: 특정 테이블/데이터
2. **시점 복구**: 특정 시점으로 롤백
3. **전체 복구**: 전체 데이터베이스 복원

#### RTO/RPO 목표
- **RTO**: 4시간 이내
- **RPO**: 1시간 이내

---

## 10. 향후 계획

### 10.1 확장성 고려사항

#### 데이터 증가 대응
- 파티셔닝 (audit_trails, ocr_results)
- 아카이빙 (이전 연도 데이터)
- 인덱스 최적화

#### 기능 확장
- 다중 언어 지원
- 모바일 앱 대응
- 외부 시스템 연동

### 10.2 기술 업그레이드

#### 데이터베이스
- PostgreSQL 최신 버전 적용
- 새로운 기능 활용 (JSONB 개선 등)

#### 프레임워크
- TypeORM 버전 업데이트
- 새로운 기능 적용

---

## 참고 자료

### 관련 문서
- [마이그레이션 실행 가이드](./migration-guide.md)
- [트러블슈팅 가이드](./troubleshooting.md)
- [API 데이터 모델](./api-data-models.md)
- [데이터베이스 ERD](./erd.md)
- [워크플로우 가이드](../workflow/02_Database_Development.md)

### 외부 참조
- [PostgreSQL 15 문서](https://www.postgresql.org/docs/15/)
- [TypeORM 공식 가이드](https://typeorm.io/)
- [NestJS 데이터베이스 가이드](https://docs.nestjs.com/techniques/database)

---

**문서 정보**
- **버전**: 1.0
- **작성일**: 2025-01-11
- **작성자**: Backend Development Team
- **검토자**: Database Architect Team
- **승인자**: Technical Lead
- **다음 검토 예정일**: 2025-02-11