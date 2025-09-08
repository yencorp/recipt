# 데이터베이스 관계 정의 - 광남동성당 청소년위원회 예결산 관리 시스템

## 개요

본 문서는 시스템의 모든 엔티티 간 관계를 정의하고, 각 관계의 카디널리티, 참조 무결성 제약 조건을 명세합니다.

## 엔티티 관계 매트릭스

### 1. 사용자 관리 관계

#### 1.1 User ↔ UserOrganization (1:N)
- **관계**: 한 사용자는 여러 단체에 속할 수 있음
- **카디널리티**: 1:N (User : UserOrganization)
- **참조 무결성**: 
  - `user_organizations.user_id` → `users.id` (CASCADE DELETE)
  - 사용자 삭제 시 모든 단체 관계도 함께 삭제

#### 1.2 Organization ↔ UserOrganization (1:N)
- **관계**: 한 단체는 여러 사용자를 가질 수 있음
- **카디널리티**: 1:N (Organization : UserOrganization)
- **참조 무결성**: 
  - `user_organizations.organization_id` → `organizations.id` (CASCADE DELETE)
  - 단체 삭제 시 모든 사용자 관계도 함께 삭제

#### 1.3 User ↔ Organization (M:N via UserOrganization)
- **관계**: 사용자와 단체 간 다대다 관계
- **중간 테이블**: UserOrganization
- **비즈니스 규칙**:
  - 동일한 사용자-단체 조합은 한 번만 허용
  - 역할별 권한 차이 (ADMIN vs MEMBER)

### 2. 행사 관리 관계

#### 2.1 Organization → Event (1:N)
- **관계**: 한 단체는 여러 행사를 주최할 수 있음
- **카디널리티**: 1:N (Organization : Event)
- **참조 무결성**: 
  - `events.organization_id` → `organizations.id` (RESTRICT DELETE)
  - 단체에 행사가 있으면 단체 삭제 불가

#### 2.2 User → Event (1:N) - 생성자
- **관계**: 한 사용자는 여러 행사를 생성할 수 있음
- **카디널리티**: 1:N (User : Event)
- **참조 무결성**: 
  - `events.created_by` → `users.id` (RESTRICT DELETE)
  - 행사를 생성한 사용자는 삭제 불가

### 3. 예산 관리 관계

#### 3.1 Event ↔ Budget (1:1)
- **관계**: 한 행사는 하나의 예산서만 가짐
- **카디널리티**: 1:1 (Event : Budget)
- **참조 무결성**: 
  - `budgets.event_id` → `events.id` (CASCADE DELETE)
  - 행사 삭제 시 예산서도 함께 삭제
- **고유 제약**: `budgets.event_id` UNIQUE

#### 3.2 Budget → BudgetIncome (1:N)
- **관계**: 한 예산서는 여러 수입 항목을 가짐
- **카디널리티**: 1:N (Budget : BudgetIncome)
- **참조 무결성**: 
  - `budget_incomes.budget_id` → `budgets.id` (CASCADE DELETE)
  - 예산서 삭제 시 모든 수입 항목도 함께 삭제
- **순서 제약**: `(budget_id, display_order)` UNIQUE

#### 3.3 Budget → BudgetExpense (1:N)
- **관계**: 한 예산서는 여러 지출 항목을 가짐
- **카디널리티**: 1:N (Budget : BudgetExpense)
- **참조 무결성**: 
  - `budget_expenses.budget_id` → `budgets.id` (CASCADE DELETE)
  - 예산서 삭제 시 모든 지출 항목도 함께 삭제
- **순서 제약**: `(budget_id, display_order)` UNIQUE

#### 3.4 User → Budget (1:N) - 승인자
- **관계**: 한 사용자는 여러 예산서를 승인할 수 있음
- **카디널리티**: 1:N (User : Budget)
- **참조 무결성**: 
  - `budgets.approved_by` → `users.id` (RESTRICT DELETE)
  - 예산서를 승인한 사용자는 삭제 불가
- **선택적 관계**: 승인자는 NULL 가능 (미승인 상태)

### 4. 결산 관리 관계

#### 4.1 Event ↔ Settlement (1:1)
- **관계**: 한 행사는 하나의 결산서만 가짐
- **카디널리티**: 1:1 (Event : Settlement)
- **참조 무결성**: 
  - `settlements.event_id` → `events.id` (CASCADE DELETE)
  - 행사 삭제 시 결산서도 함께 삭제
- **고유 제약**: `settlements.event_id` UNIQUE

#### 4.2 Settlement → SettlementIncome (1:N)
- **관계**: 한 결산서는 여러 수입 항목을 가짐
- **카디널리티**: 1:N (Settlement : SettlementIncome)
- **참조 무결성**: 
  - `settlement_incomes.settlement_id` → `settlements.id` (CASCADE DELETE)
  - 결산서 삭제 시 모든 수입 항목도 함께 삭제
- **순서 제약**: `(settlement_id, display_order)` UNIQUE

#### 4.3 Settlement → SettlementExpense (1:N)
- **관계**: 한 결산서는 여러 지출 항목을 가짐
- **카디널리티**: 1:N (Settlement : SettlementExpense)
- **참조 무결성**: 
  - `settlement_expenses.settlement_id` → `settlements.id` (CASCADE DELETE)
  - 결산서 삭제 시 모든 지출 항목도 함께 삭제
- **순서 제약**: `(settlement_id, display_order)` UNIQUE

#### 4.4 User → Settlement (1:N) - 완료자
- **관계**: 한 사용자는 여러 결산서를 완료할 수 있음
- **카디널리티**: 1:N (User : Settlement)
- **참조 무결성**: 
  - `settlements.completed_by` → `users.id` (RESTRICT DELETE)
  - 결산서를 완료한 사용자는 삭제 불가
- **선택적 관계**: 완료자는 NULL 가능 (미완료 상태)

### 5. OCR 및 영수증 관리 관계

#### 5.1 Settlement → OCRJob (1:N)
- **관계**: 한 결산서는 여러 OCR 작업을 가질 수 있음
- **카디널리티**: 1:N (Settlement : OCRJob)
- **참조 무결성**: 
  - `ocr_jobs.settlement_id` → `settlements.id` (CASCADE DELETE)
  - 결산서 삭제 시 모든 OCR 작업도 함께 삭제

#### 5.2 User → OCRJob (1:N) - 생성자
- **관계**: 한 사용자는 여러 OCR 작업을 생성할 수 있음
- **카디널리티**: 1:N (User : OCRJob)
- **참조 무결성**: 
  - `ocr_jobs.created_by` → `users.id` (RESTRICT DELETE)
  - OCR 작업을 생성한 사용자는 삭제 불가

#### 5.3 Settlement → Receipt (1:N)
- **관계**: 한 결산서는 여러 영수증을 가짐
- **카디널리티**: 1:N (Settlement : Receipt)
- **참조 무결성**: 
  - `receipts.settlement_id` → `settlements.id` (CASCADE DELETE)
  - 결산서 삭제 시 모든 영수증도 함께 삭제

#### 5.4 OCRJob → Receipt (1:N) - 선택적
- **관계**: 한 OCR 작업은 여러 영수증 결과를 생성할 수 있음
- **카디널리티**: 1:N (OCRJob : Receipt)
- **참조 무결성**: 
  - `receipts.ocr_job_id` → `ocr_jobs.id` (SET NULL DELETE)
  - OCR 작업 삭제 시 영수증의 ocr_job_id를 NULL로 설정
- **선택적 관계**: 수동 입력 영수증은 ocr_job_id가 NULL

#### 5.5 Receipt → ReceiptItem (1:N)
- **관계**: 한 영수증은 여러 상품 항목을 가짐
- **카디널리티**: 1:N (Receipt : ReceiptItem)
- **참조 무결성**: 
  - `receipt_items.receipt_id` → `receipts.id` (CASCADE DELETE)
  - 영수증 삭제 시 모든 상품 항목도 함께 삭제
- **순서 제약**: `(receipt_id, display_order)` UNIQUE

### 6. 콘텐츠 관리 관계

#### 6.1 User → Post (1:N) - 작성자
- **관계**: 한 사용자는 여러 게시물을 작성할 수 있음
- **카디널리티**: 1:N (User : Post)
- **참조 무결성**: 
  - `posts.author_id` → `users.id` (RESTRICT DELETE)
  - 게시물을 작성한 사용자는 삭제 불가

### 7. 인증 관리 관계

#### 7.1 User → RefreshToken (1:N)
- **관계**: 한 사용자는 여러 리프레시 토큰을 가질 수 있음
- **카디널리티**: 1:N (User : RefreshToken)
- **참조 무결성**: 
  - `refresh_tokens.user_id` → `users.id` (CASCADE DELETE)
  - 사용자 삭제 시 모든 토큰도 함께 삭제

## 관계 유형별 분류

### 1:1 관계 (One-to-One)
1. **Event ↔ Budget**: 행사당 하나의 예산서
2. **Event ↔ Settlement**: 행사당 하나의 결산서

**구현 방식**: UNIQUE 제약 조건 사용
**삭제 정책**: CASCADE DELETE (행사 삭제 시 예산서/결산서도 삭제)

### 1:N 관계 (One-to-Many)
1. **Organization → Event**: 단체 → 행사
2. **User → Event**: 사용자 → 생성 행사
3. **Budget → BudgetIncome/BudgetExpense**: 예산서 → 예산 항목
4. **Settlement → SettlementIncome/SettlementExpense**: 결산서 → 결산 항목
5. **Settlement → OCRJob**: 결산서 → OCR 작업
6. **Settlement → Receipt**: 결산서 → 영수증
7. **Receipt → ReceiptItem**: 영수증 → 상품 항목
8. **User → Post**: 사용자 → 게시물
9. **User → RefreshToken**: 사용자 → 토큰

**구현 방식**: 외래키 제약 조건 사용
**삭제 정책**: RESTRICT 또는 CASCADE (관계에 따라)

### M:N 관계 (Many-to-Many)
1. **User ↔ Organization**: 사용자 ↔ 단체 (UserOrganization 중간 테이블)

**구현 방식**: 중간 테이블(Junction Table) 사용
**추가 속성**: role, joined_at, is_active 등

## 참조 무결성 제약 조건 정책

### CASCADE DELETE 정책
사용 케이스: 부모 엔티티 삭제 시 자식 엔티티도 자동 삭제
- User → UserOrganization
- Organization → UserOrganization
- Event → Budget/Settlement
- Budget → BudgetIncome/BudgetExpense
- Settlement → SettlementIncome/SettlementExpense/OCRJob/Receipt
- Receipt → ReceiptItem
- User → RefreshToken

### RESTRICT DELETE 정책
사용 케이스: 자식 엔티티가 존재하면 부모 엔티티 삭제 불가
- Organization ← Event (단체에 행사가 있으면 삭제 불가)
- User ← Event (행사를 생성한 사용자는 삭제 불가)
- User ← Post (게시물을 작성한 사용자는 삭제 불가)
- User ← Budget.approved_by (예산서를 승인한 사용자는 삭제 불가)
- User ← Settlement.completed_by (결산서를 완료한 사용자는 삭제 불가)
- User ← OCRJob.created_by (OCR 작업을 생성한 사용자는 삭제 불가)

### SET NULL DELETE 정책
사용 케이스: 부모 엔티티 삭제 시 자식의 외래키를 NULL로 설정
- OCRJob → Receipt (OCR 작업 삭제 시 영수증의 ocr_job_id를 NULL로 설정)

## 인덱스 전략

### 단일 인덱스
1. **Primary Keys**: 모든 테이블의 id 필드 (자동 생성)
2. **Foreign Keys**: 모든 외래키 필드에 인덱스
3. **Unique Constraints**: 고유 제약이 필요한 필드
4. **Status Fields**: 자주 조회되는 상태 필드

### 복합 인덱스
1. **Unique Constraints**: 
   - `(user_id, organization_id)` in user_organizations
   - `(budget_id, display_order)` in budget_incomes/expenses
   - `(settlement_id, display_order)` in settlement_incomes/expenses
   - `(receipt_id, display_order)` in receipt_items

2. **Query Optimization**:
   - `(organization_id, start_date)` in events
   - `(settlement_id, receipt_date)` in receipts
   - `(is_active, role)` in user_organizations

### 부분 인덱스 (Partial Index)
특정 조건을 만족하는 행만 인덱싱하여 성능 최적화
1. `WHERE is_active = TRUE` 조건부 인덱스
2. `WHERE is_published = TRUE` 조건부 인덱스
3. `WHERE status IN ('PENDING', 'PROCESSING')` OCR 작업 상태 인덱스

### 전문 검색 인덱스
1. **GIN Index**: 
   - `events.name` (행사명 검색)
   - `receipts.merchant_name` (가맹점명 검색)
   - `receipt_items.item_name` (상품명 검색)
   - `posts.title`, `posts.content` (게시물 검색)

## 성능 고려사항

### 쿼리 최적화
1. **조인 순서**: 작은 테이블부터 조인
2. **인덱스 활용**: WHERE, ORDER BY, JOIN 조건에 인덱스 활용
3. **N+1 문제 방지**: 적절한 EAGER/LAZY 로딩 설정

### 데이터 증가 대비
1. **파티셔닝**: 날짜 기준으로 테이블 분할 고려
2. **아카이빙**: 오래된 데이터의 별도 저장소 이동
3. **배치 처리**: 대량 데이터 처리 시 배치 단위로 분할

---

**문서 버전**: 1.0  
**작성일**: 2025-01-08  
**작성자**: Backend Developer Team  
**검토자**: Database Architect

## 참고 문서
- [데이터베이스 엔티티 분석](./entities.md)
- [비즈니스 규칙 정의](./business-rules.md)
- [TSD 02_Database_Schema](../TSD/02_Database_Schema.md)