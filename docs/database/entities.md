# 데이터베이스 엔티티 분석 - 광남동성당 청소년위원회 예결산 관리 시스템

## 개요

본 문서는 PRD와 TSD를 기반으로 추출된 핵심 데이터 엔티티들을 정의하고 각 엔티티의 역할과 속성을 명세합니다.

## 핵심 엔티티 식별

### 1. 사용자 관리 엔티티

#### 1.1 User (사용자)
**목적**: 시스템 사용자 정보 관리  
**설명**: 청소년위원회 회원 및 관리자 정보 저장

**핵심 속성**:
- `id` (UUID): 사용자 고유 식별자
- `email` (VARCHAR): 로그인용 이메일 (고유값)
- `password_hash` (VARCHAR): 암호화된 비밀번호
- `name` (VARCHAR): 실명
- `baptismal_name` (VARCHAR): 세례명 (선택)
- `phone` (VARCHAR): 연락처
- `birth_date` (DATE): 생년월일
- `position` (VARCHAR): 직책/역할
- `address` (TEXT): 주소 (선택)
- `is_admin` (BOOLEAN): 관리자 권한 여부
- `is_active` (BOOLEAN): 계정 활성화 상태
- `last_login_at` (TIMESTAMP): 최근 로그인 시간
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 이메일은 유효한 형식이어야 함
- 전화번호는 10-15자리 숫자와 하이픈만 허용
- 관리자는 모든 단체에 접근 가능

#### 1.2 Organization (단체)
**목적**: 청소년위원회 내 각 단체 정보 관리  
**설명**: 청년회, 자모회, 초등부, 중고등부 등 단체 정보

**핵심 속성**:
- `id` (UUID): 단체 고유 식별자
- `name` (VARCHAR): 단체명 (고유값)
- `description` (TEXT): 단체 설명
- `is_active` (BOOLEAN): 단체 활성화 상태
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 단체명은 최소 2자 이상
- 비활성 단체는 새 행사 생성 불가

#### 1.3 UserOrganization (사용자-단체 관계)
**목적**: 사용자와 단체 간 다대다 관계 관리  
**설명**: 한 사용자가 여러 단체에 속할 수 있는 관계 정의

**핵심 속성**:
- `id` (UUID): 관계 고유 식별자
- `user_id` (UUID): 사용자 참조
- `organization_id` (UUID): 단체 참조
- `role` (ENUM): 단체 내 역할 (ADMIN, MEMBER)
- `joined_at` (TIMESTAMP): 가입 일시
- `is_active` (BOOLEAN): 관계 활성화 상태
- `created_at`: 타임스탬프

**비즈니스 규칙**:
- 동일한 사용자-단체 조합은 한 번만 허용
- ADMIN 역할은 단체 관리 권한 보유

### 2. 행사 관리 엔티티

#### 2.1 Event (행사)
**목적**: 단체별 행사 정보 관리  
**설명**: 각종 행사의 기본 정보와 일정 관리

**핵심 속성**:
- `id` (UUID): 행사 고유 식별자
- `organization_id` (UUID): 주최 단체 참조
- `name` (VARCHAR): 행사명
- `start_date` (DATE): 시작일
- `end_date` (DATE): 종료일
- `location` (VARCHAR): 행사 장소
- `allocated_budget` (DECIMAL): 배정 예산
- `status` (ENUM): 행사 상태 (PLANNING, IN_PROGRESS, COMPLETED, CANCELLED)
- `description` (TEXT): 행사 설명
- `created_by` (UUID): 생성자 참조
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 시작일은 종료일보다 빠르거나 같아야 함
- 배정 예산은 0 이상이어야 함
- 행사당 예산서와 결산서는 각각 하나씩만 가능

### 3. 예산 관리 엔티티

#### 3.1 Budget (예산서)
**목적**: 행사별 예산서 관리  
**설명**: 행사 진행 전 계획된 수입과 지출 관리

**핵심 속성**:
- `id` (UUID): 예산서 고유 식별자
- `event_id` (UUID): 행사 참조 (1:1 관계)
- `status` (ENUM): 예산서 상태 (DRAFT, SUBMITTED, APPROVED, REJECTED)
- `total_income` (DECIMAL): 총 수입
- `total_expense` (DECIMAL): 총 지출
- `balance` (DECIMAL): 잔액 (계산 필드)
- `approved_by` (UUID): 승인자 참조
- `approved_at` (TIMESTAMP): 승인 일시
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 하나의 행사당 하나의 예산서만 허용
- 총 수입과 지출은 0 이상이어야 함
- 잔액은 총수입-총지출로 자동 계산

#### 3.2 BudgetIncome (예산 수입)
**목적**: 예산서의 수입 항목 관리  
**설명**: 예상되는 각종 수입 항목 상세 관리

**핵심 속성**:
- `id` (UUID): 수입 항목 고유 식별자
- `budget_id` (UUID): 예산서 참조
- `source` (VARCHAR): 수입원
- `amount` (DECIMAL): 금액
- `description` (TEXT): 상세 설명
- `display_order` (INTEGER): 표시 순서
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 금액은 양수여야 함
- 동일 예산서 내에서 표시 순서는 고유해야 함

#### 3.3 BudgetExpense (예산 지출)
**목적**: 예산서의 지출 항목 관리  
**설명**: 예상되는 각종 지출 항목 상세 관리

**핵심 속성**:
- `id` (UUID): 지출 항목 고유 식별자
- `budget_id` (UUID): 예산서 참조
- `category` (VARCHAR): 지출 카테고리
- `amount` (DECIMAL): 금액
- `description` (TEXT): 상세 설명
- `display_order` (INTEGER): 표시 순서
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 금액은 양수여야 함
- 동일 예산서 내에서 표시 순서는 고유해야 함

### 4. 결산 관리 엔티티

#### 4.1 Settlement (결산서)
**목적**: 행사별 결산서 관리  
**설명**: 행사 종료 후 실제 수입과 지출 정산

**핵심 속성**:
- `id` (UUID): 결산서 고유 식별자
- `event_id` (UUID): 행사 참조 (1:1 관계)
- `status` (ENUM): 결산서 상태 (DRAFT, SUBMITTED, COMPLETED)
- `total_income` (DECIMAL): 총 수입
- `total_expense` (DECIMAL): 총 지출
- `balance` (DECIMAL): 잔액 (계산 필드)
- `receipt_count` (INTEGER): 첨부된 영수증 수
- `completed_by` (UUID): 완료자 참조
- `completed_at` (TIMESTAMP): 완료 일시
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 하나의 행사당 하나의 결산서만 허용
- 총 수입과 지출은 0 이상이어야 함
- 잔액은 총수입-총지출로 자동 계산

#### 4.2 SettlementIncome (결산 수입)
**목적**: 결산서의 수입 항목 관리  
**설명**: 실제 발생한 수입 항목 상세 관리

**핵심 속성**:
- `id` (UUID): 수입 항목 고유 식별자
- `settlement_id` (UUID): 결산서 참조
- `source` (VARCHAR): 수입원
- `amount` (DECIMAL): 금액
- `description` (TEXT): 상세 설명
- `display_order` (INTEGER): 표시 순서
- `created_at`, `updated_at`: 타임스탬프

#### 4.3 SettlementExpense (결산 지출)
**목적**: 결산서의 지출 항목 관리  
**설명**: 실제 발생한 지출 항목 상세 관리

**핵심 속성**:
- `id` (UUID): 지출 항목 고유 식별자
- `settlement_id` (UUID): 결산서 참조
- `category` (VARCHAR): 지출 카테고리
- `amount` (DECIMAL): 금액
- `description` (TEXT): 상세 설명
- `display_order` (INTEGER): 표시 순서
- `created_at`, `updated_at`: 타임스탬프

### 5. OCR 및 영수증 관리 엔티티

#### 5.1 OCRJob (OCR 작업)
**목적**: 영수증 OCR 처리 작업 관리  
**설명**: 영수증 이미지의 텍스트 인식 작업 상태 추적

**핵심 속성**:
- `id` (UUID): OCR 작업 고유 식별자
- `settlement_id` (UUID): 결산서 참조
- `status` (ENUM): 작업 상태 (PENDING, PROCESSING, COMPLETED, FAILED)
- `total_files` (INTEGER): 전체 파일 수
- `processed_files` (INTEGER): 처리된 파일 수
- `success_files` (INTEGER): 성공한 파일 수
- `failed_files` (INTEGER): 실패한 파일 수
- `error_message` (TEXT): 오류 메시지
- `processing_started_at` (TIMESTAMP): 처리 시작 시간
- `processing_completed_at` (TIMESTAMP): 처리 완료 시간
- `created_by` (UUID): 작업 생성자 참조
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 처리된 파일 수 = 성공 파일 수 + 실패 파일 수
- 처리된 파일 수 ≤ 전체 파일 수

#### 5.2 Receipt (영수증)
**목적**: 영수증 기본 정보 관리  
**설명**: 영수증별 기본 정보와 OCR 결과 저장

**핵심 속성**:
- `id` (UUID): 영수증 고유 식별자
- `settlement_id` (UUID): 결산서 참조
- `ocr_job_id` (UUID): OCR 작업 참조 (선택)
- `receipt_date` (DATE): 영수증 발행일
- `merchant_name` (VARCHAR): 가맹점명
- `total_amount` (DECIMAL): 총 금액
- `business_number` (VARCHAR): 사업자등록번호
- `payment_method` (VARCHAR): 결제 방법
- `image_path` (TEXT): 이미지 파일 경로
- `thumbnail_path` (TEXT): 썸네일 경로
- `ocr_processed` (BOOLEAN): OCR 처리 여부
- `ocr_confidence` (DECIMAL): OCR 정확도 (0.00-1.00)
- `verified_by_user` (BOOLEAN): 사용자 검증 여부
- `notes` (TEXT): 비고
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 총 금액은 양수여야 함
- OCR 정확도는 0과 1 사이 값
- 사업자등록번호는 정해진 형식 (XXX-XX-XXXXX)

#### 5.3 ReceiptItem (영수증 상품)
**목적**: 영수증 내 개별 상품 정보 관리  
**설명**: OCR로 인식된 각 상품의 상세 정보

**핵심 속성**:
- `id` (UUID): 상품 항목 고유 식별자
- `receipt_id` (UUID): 영수증 참조
- `item_name` (VARCHAR): 상품명
- `quantity` (DECIMAL): 수량
- `unit_price` (DECIMAL): 단가
- `subtotal` (DECIMAL): 소계
- `item_code` (VARCHAR): 상품 코드
- `category` (VARCHAR): 카테고리
- `discount_amount` (DECIMAL): 할인 금액
- `tax_rate` (DECIMAL): 세율
- `display_order` (INTEGER): 표시 순서
- `ocr_confidence` (DECIMAL): OCR 정확도
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 수량과 소계는 양수여야 함
- 할인 금액은 0 이상
- 동일 영수증 내에서 표시 순서는 고유해야 함

### 6. 콘텐츠 관리 엔티티

#### 6.1 Post (블로그 게시물)
**목적**: 공지사항 및 게시글 관리  
**설명**: 위원회 소식 및 공지사항 콘텐츠

**핵심 속성**:
- `id` (UUID): 게시물 고유 식별자
- `title` (VARCHAR): 제목
- `content` (TEXT): 내용
- `summary` (VARCHAR): 요약
- `is_published` (BOOLEAN): 발행 여부
- `view_count` (INTEGER): 조회수
- `author_id` (UUID): 작성자 참조
- `published_at` (TIMESTAMP): 발행 일시
- `created_at`, `updated_at`: 타임스탬프

**비즈니스 규칙**:
- 제목은 최소 2자 이상
- 내용은 최소 10자 이상

### 7. 인증 관리 엔티티

#### 7.1 RefreshToken (리프레시 토큰)
**목적**: JWT 리프레시 토큰 관리  
**설명**: 자동 로그인 및 토큰 갱신을 위한 토큰 저장

**핵심 속성**:
- `id` (UUID): 토큰 고유 식별자
- `user_id` (UUID): 사용자 참조
- `token_hash` (VARCHAR): 토큰 해시값
- `expires_at` (TIMESTAMP): 만료 일시
- `is_revoked` (BOOLEAN): 폐기 여부
- `created_at`: 생성 일시
- `last_used_at` (TIMESTAMP): 최근 사용 일시

**비즈니스 규칙**:
- 만료 일시는 생성 일시보다 늦어야 함
- 폐기된 토큰은 사용 불가

## 엔티티 관계 요약

### 핵심 관계
1. **User ↔ Organization**: 다대다 (UserOrganization을 통해)
2. **Organization → Event**: 일대다 (한 단체는 여러 행사 가능)
3. **Event ↔ Budget**: 일대일 (행사당 예산서 하나)
4. **Event ↔ Settlement**: 일대일 (행사당 결산서 하나)
5. **Budget → BudgetIncome/BudgetExpense**: 일대다
6. **Settlement → SettlementIncome/SettlementExpense**: 일대다
7. **Settlement → OCRJob**: 일대다 (결산서당 여러 OCR 작업 가능)
8. **Settlement → Receipt**: 일대다 (결산서당 여러 영수증)
9. **Receipt → ReceiptItem**: 일대다 (영수증당 여러 상품)
10. **OCRJob → Receipt**: 일대다 (OCR 작업당 여러 영수증 처리 결과)

### 주요 제약조건
- 사용자-단체 관계의 고유성
- 행사당 예산서/결산서의 유일성
- 금액 필드의 양수 제약
- 날짜 논리적 제약 (시작일 ≤ 종료일)
- 파일 카운트 일관성 (OCR 작업)

---

**문서 버전**: 1.0  
**작성일**: 2025-01-08  
**작성자**: Backend Developer Team