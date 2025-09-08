# ERD (Entity Relationship Diagram) - 광남동성당 청소년위원회 예결산 관리 시스템

## 전체 ERD 다이어그램

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                  AUTHENTICATION & CONTENT                   │
                                    └─────────────────────────────────────────────────────────────┘

┌─────────────────┐                                                              ┌─────────────────┐
│  refresh_tokens │                                                              │      posts      │
│ =============== │                                                              │ =============== │
│ id (PK)         │─┐                                                        ┌───│ id (PK)         │
│ user_id (FK)    │ │                                                        │   │ title           │
│ token_hash      │ │                                                        │   │ content         │
│ expires_at      │ │                                                        │   │ summary         │
│ is_revoked      │ │                                                        │   │ is_published    │
│ created_at      │ │                                                        │   │ view_count      │
│ last_used_at    │ │                                                        │   │ author_id (FK)  │
└─────────────────┘ │                                                        │   │ published_at    │
                    │                                                        │   │ created_at      │
                    │          ┌─────────────────────────────────────┐        │   │ updated_at      │
                    │          │            USER MANAGEMENT          │        │   └─────────────────┘
                    │          └─────────────────────────────────────┘        │
                    │                                                         │
                    └─────────► ┌─────────────────┐ ◄──────────────────────────┘
                               │      users      │
                               │ =============== │
                               │ id (PK)         │─────┐
                               │ email           │     │
                               │ password_hash   │     │
                               │ name            │     │
                               │ baptismal_name  │     │
                               │ phone           │     │
                               │ birth_date      │     │
                               │ position        │     │
                               │ address         │     │
                               │ is_admin        │     │
                               │ is_active       │     │
                               │ last_login_at   │     │
                               │ created_at      │     │
                               │ updated_at      │     │
                               └─────────────────┘     │
                                        │              │
                                        │ 1:N          │ 1:N (created_by)
                                        ▼              │
                               ┌─────────────────┐     │
                               │user_organizations│     │
                               │ =============== │     │
                               │ id (PK)         │     │
                               │ user_id (FK)    │     │
                               │ organization_id │     │
                               │ role (ENUM)     │     │
                               │ joined_at       │     │
                               │ is_active       │     │
                               │ created_at      │     │
                               └─────────────────┘     │
                                        │ M:N          │
                                        ▼              │
                               ┌─────────────────┐     │
                               │  organizations  │     │
                               │ =============== │     │
                               │ id (PK)         │─┐   │
                               │ name            │ │   │
                               │ description     │ │   │
                               │ is_active       │ │   │
                               │ created_at      │ │   │
                               │ updated_at      │ │   │
                               └─────────────────┘ │   │
                                                   │   │
                    ┌──────────────────────────────────────────────────────────────────────────────┐
                    │                              EVENT MANAGEMENT                                 │
                    └──────────────────────────────────────────────────────────────────────────────┘
                                                   │ 1:N                         
                                                   ▼                            
                               ┌─────────────────┐ ◄─────────────────────────────┘
                               │      events     │
                               │ =============== │
                               │ id (PK)         │─┐
                               │ organization_id │ │
                               │ name            │ │
                               │ start_date      │ │
                               │ end_date        │ │
                               │ location        │ │
                               │ allocated_budget│ │
                               │ status (ENUM)   │ │
                               │ description     │ │
                               │ created_by (FK) │ │
                               │ created_at      │ │
                               │ updated_at      │ │
                               └─────────────────┘ │
                                        │          │
                             ┌──────────┼──────────┘
                             │ 1:1      │ 1:1
                             ▼          ▼


    ┌─────────────────────────────────────────┐              ┌─────────────────────────────────────────┐
    │              BUDGET MANAGEMENT          │              │            SETTLEMENT MANAGEMENT        │
    └─────────────────────────────────────────┘              └─────────────────────────────────────────┘

┌─────────────────┐                                      ┌─────────────────┐
│     budgets     │                                      │   settlements   │
│ =============== │                                      │ =============== │
│ id (PK)         │─┐                                    │ id (PK)         │─┐
│ event_id (FK)   │ │                                    │ event_id (FK)   │ │
│ status (ENUM)   │ │                                    │ status (ENUM)   │ │
│ total_income    │ │                                    │ total_income    │ │
│ total_expense   │ │                                    │ total_expense   │ │
│ balance         │ │                                    │ balance         │ │
│ approved_by     │ │                                    │ receipt_count   │ │
│ approved_at     │ │                                    │ completed_by    │ │
│ created_at      │ │                                    │ completed_at    │ │
│ updated_at      │ │                                    │ created_at      │ │
└─────────────────┘ │                                    │ updated_at      │ │
         │          │                                    └─────────────────┘ │
      ┌──┴──┐       │                                             │          │
      │ 1:N │       │                                          ┌──┴──┐       │
      ▼     ▼       │                                          │ 1:N │       │
                    │                                          ▼     ▼       │
┌─────────────────┐ │ ┌─────────────────┐              ┌─────────────────┐ │ ┌─────────────────┐
│ budget_incomes  │ │ │ budget_expenses │              │settlement_incomes│ │ │settlement_expenses│
│ =============== │ │ │ =============== │              │ =============== │ │ │ =============== │
│ id (PK)         │ │ │ id (PK)         │              │ id (PK)         │ │ │ id (PK)         │
│ budget_id (FK)  │─┘ │ budget_id (FK)  │─┐            │ settlement_id   │─┘ │ settlement_id   │─┐
│ source          │   │ category        │ │            │ source          │   │ category        │ │
│ amount          │   │ amount          │ │            │ amount          │   │ amount          │ │
│ description     │   │ description     │ │            │ description     │   │ description     │ │
│ display_order   │   │ display_order   │ │            │ display_order   │   │ display_order   │ │
│ created_at      │   │ created_at      │ │            │ created_at      │   │ created_at      │ │
│ updated_at      │   │ updated_at      │─┘            │ updated_at      │   │ updated_at      │─┘
└─────────────────┘   └─────────────────┘              └─────────────────┘   └─────────────────┘




                    ┌──────────────────────────────────────────────────────────────────────────────┐
                    │                          OCR & RECEIPT MANAGEMENT                             │
                    └──────────────────────────────────────────────────────────────────────────────┘
                                                             │
                                            ┌────────────────┴────────────────┐
                                            │ 1:N                        1:N │
                                            ▼                              ▼
                                   ┌─────────────────┐              ┌─────────────────┐
                                   │    ocr_jobs     │              │    receipts     │
                                   │ =============== │              │ =============== │
                                   │ id (PK)         │─┐            │ id (PK)         │─┐
                                   │ settlement_id   │ │         ┌──│ settlement_id   │ │
                                   │ status (ENUM)   │ │         │  │ ocr_job_id (FK) │─┘
                                   │ total_files     │ │         │  │ receipt_date    │
                                   │ processed_files │ │         │  │ merchant_name   │
                                   │ success_files   │ │         │  │ total_amount    │
                                   │ failed_files    │ │         │  │ business_number │
                                   │ error_message   │ │  1:N    │  │ payment_method  │
                                   │ proc_started_at │ │  ┌──────┘  │ image_path      │
                                   │ proc_completed  │ │  │         │ thumbnail_path  │
                                   │ created_by (FK) │─┘  │         │ ocr_processed   │
                                   │ created_at      │    │         │ ocr_confidence  │
                                   │ updated_at      │    │         │ verified_by_user│
                                   └─────────────────┘    │         │ notes           │
                                                          │         │ created_at      │
                                                          │         │ updated_at      │
                                                          │         └─────────────────┘
                                                          │                  │ 1:N
                                                          │                  ▼
                                                          │         ┌─────────────────┐
                                                          │         │  receipt_items  │
                                                          │         │ =============== │
                                                          │         │ id (PK)         │
                                                          │         │ receipt_id (FK) │─┘
                                                          │         │ item_name       │
                                                          │         │ quantity        │
                                                          │         │ unit_price      │
                                                          │         │ subtotal        │
                                                          │         │ item_code       │
                                                          │         │ category        │
                                                          │         │ discount_amount │
                                                          │         │ tax_rate        │
                                                          │         │ display_order   │
                                                          │         │ ocr_confidence  │
                                                          │         │ created_at      │
                                                          │         │ updated_at      │
                                                          │         └─────────────────┘
                                                          │
                                                          └─────────────────────────────────────┐
                                                                                                │
                                                    ┌───────────────────────────────────────────┘
                                                    │
                                                    └─► users.id (created_by)
```

## ERD 범례 (Legend)

### 관계 표기법
- `─┐` : 일대다 관계 (1:N)에서 "일" 쪽
- `─┘` : 일대다 관계 (1:N)에서 "다" 쪽  
- `◄─►` : 다대다 관계 (M:N)
- `(PK)` : Primary Key (기본키)
- `(FK)` : Foreign Key (외래키)
- `(ENUM)` : Enumerated Type (열거형)

### 카디널리티 표기
- `1:1` : 일대일 관계
- `1:N` : 일대다 관계
- `M:N` : 다대다 관계

## 주요 관계 설명

### 1. 사용자 관리 도메인
```
users (1) ←→ (N) user_organizations (M) ←→ (1) organizations
```
- 사용자와 단체 간의 다대다 관계
- UserOrganization을 통한 관계 테이블로 구현
- 추가 속성: role, joined_at, is_active

### 2. 행사 관리 도메인
```
organizations (1) → (N) events ← (N) users (created_by)
```
- 단체는 여러 행사를 가질 수 있음
- 사용자는 여러 행사를 생성할 수 있음

### 3. 예산/결산 관리 도메인
```
events (1) ↔ (1) budgets (1) → (N) budget_incomes/expenses
events (1) ↔ (1) settlements (1) → (N) settlement_incomes/expenses
```
- 행사당 예산서와 결산서는 각각 하나씩만 존재
- 각 예결산서는 여러 수입/지출 항목을 가질 수 있음

### 4. OCR 및 영수증 관리 도메인
```
settlements (1) → (N) ocr_jobs
settlements (1) → (N) receipts ← (N) ocr_jobs (선택적)
receipts (1) → (N) receipt_items
```
- 결산서당 여러 OCR 작업과 영수증 가능
- 영수증은 OCR 작업 결과이거나 수동 입력 가능
- 영수증당 여러 상품 항목 포함

## 핵심 제약 조건

### Unique 제약조건
1. `users.email` - 이메일 고유성
2. `organizations.name` - 단체명 고유성  
3. `user_organizations(user_id, organization_id)` - 사용자-단체 관계 고유성
4. `budgets.event_id` - 행사당 예산서 하나
5. `settlements.event_id` - 행사당 결산서 하나
6. `budget_incomes(budget_id, display_order)` - 예산 수입 항목 순서
7. `budget_expenses(budget_id, display_order)` - 예산 지출 항목 순서
8. `settlement_incomes(settlement_id, display_order)` - 결산 수입 항목 순서
9. `settlement_expenses(settlement_id, display_order)` - 결산 지출 항목 순서
10. `receipt_items(receipt_id, display_order)` - 영수증 상품 항목 순서

### Check 제약조건
1. `users.email` - 이메일 형식 검증
2. `users.phone` - 전화번호 형식 검증
3. `events.start_date <= end_date` - 날짜 논리 검증
4. `events.allocated_budget >= 0` - 예산 양수 검증
5. 모든 금액 필드 - 양수 또는 0 이상 검증
6. `receipts.business_number` - 사업자등록번호 형식
7. `ocr_jobs` 파일 카운트 일관성 검증
8. `receipts/receipt_items` OCR 정확도 범위 (0.0-1.0)

### Foreign Key 제약조건
#### CASCADE DELETE
- `user_organizations.user_id` → `users.id`
- `user_organizations.organization_id` → `organizations.id`  
- `budgets.event_id` → `events.id`
- `settlements.event_id` → `events.id`
- 모든 하위 항목들 (incomes, expenses, items 등)

#### RESTRICT DELETE  
- `events.organization_id` → `organizations.id`
- `events.created_by` → `users.id`
- 승인자/완료자/생성자 관련 외래키

#### SET NULL DELETE
- `receipts.ocr_job_id` → `ocr_jobs.id`

## 인덱스 전략

### 기본 인덱스
- 모든 Primary Key (자동)
- 모든 Foreign Key
- Unique 제약조건 필드

### 성능 최적화 인덱스
```sql
-- 복합 인덱스
CREATE INDEX idx_events_org_date ON events(organization_id, start_date);
CREATE INDEX idx_receipts_settlement_date ON receipts(settlement_id, receipt_date);
CREATE INDEX idx_user_orgs_active_role ON user_organizations(is_active, role) WHERE is_active = TRUE;

-- 부분 인덱스  
CREATE INDEX idx_users_active ON users(id) WHERE is_active = TRUE;
CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE is_published = TRUE;
CREATE INDEX idx_ocr_jobs_pending ON ocr_jobs(created_at) WHERE status IN ('PENDING', 'PROCESSING');

-- 전문검색 인덱스 (GIN)
CREATE INDEX idx_events_name_search ON events USING gin(name gin_trgm_ops);
CREATE INDEX idx_receipts_merchant_search ON receipts USING gin(merchant_name gin_trgm_ops);
CREATE INDEX idx_receipt_items_name_search ON receipt_items USING gin(item_name gin_trgm_ops);
```

---

**문서 버전**: 1.0  
**작성일**: 2025-01-08  
**작성자**: Backend Developer Team  
**도구**: ASCII Diagram, 텍스트 기반 ERD

## 참고 문서
- [데이터베이스 엔티티 분석](./entities.md)
- [데이터베이스 관계 정의](./relationships.md)
- [비즈니스 규칙 정의](./business-rules.md)
- [TSD 02_Database_Schema](../TSD/02_Database_Schema.md)