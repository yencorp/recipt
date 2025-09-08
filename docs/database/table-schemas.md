# 테이블 상세 스키마 - 광남동성당 청소년위원회 예결산 관리 시스템

## 개요

본 문서는 PRD와 TSD를 기반으로 모든 테이블의 상세 스키마를 정의합니다. PostgreSQL 15+ 기준으로 작성되었으며, TypeORM과의 호환성을 고려합니다.

## 데이터베이스 설정

### 기본 설정
```sql
-- 데이터베이스 생성
CREATE DATABASE recipt_db 
WITH ENCODING='UTF8' 
LC_COLLATE='ko_KR.UTF-8' 
LC_CTYPE='ko_KR.UTF-8';

-- 필수 확장 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID 생성
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- 암호화
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- 전문 검색
```

### 공통 함수
```sql
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 1. 사용자 관리 테이블

### 1.1 users (사용자)

```sql
CREATE TABLE users (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 인증 정보 (FR-001, FR-004)
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 필수 개인 정보 (FR-001)
    name VARCHAR(100) NOT NULL,
    baptismal_name VARCHAR(100) NULL,
    phone VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    position VARCHAR(100) NOT NULL,
    
    -- 선택 정보 (FR-002)
    address TEXT NULL,
    
    -- 시스템 정보 (FR-008, FR-010)
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT users_email_check CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT users_phone_check CHECK (
        phone ~ '^[0-9-]{10,15}$'
    ),
    CONSTRAINT users_name_length CHECK (
        LENGTH(name) >= 2
    )
);

-- 인덱스
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_admin ON users(is_admin) WHERE is_admin = TRUE;
CREATE INDEX idx_users_name_search ON users USING gin(name gin_trgm_ops);

-- 트리거
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 organizations (단체)

```sql
CREATE TABLE organizations (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 단체 정보 (PRD 4개 고정 단체)
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NULL,
    order_priority INTEGER NOT NULL DEFAULT 0,
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT organizations_name_length CHECK (LENGTH(name) >= 2),
    CONSTRAINT organizations_code_format CHECK (
        code ~ '^[A-Z_]+$'
    )
);

-- 인덱스
CREATE UNIQUE INDEX idx_organizations_name ON organizations(name);
CREATE UNIQUE INDEX idx_organizations_code ON organizations(code);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_organizations_priority ON organizations(order_priority);

-- 트리거
CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 초기 데이터 (PRD 기준 4개 고정 단체)
INSERT INTO organizations (name, code, description, order_priority) VALUES
('청년회', 'YOUTH', '청년 구성원들의 단체', 1),
('자모회', 'MOTHERS', '어머니 구성원들의 단체', 2),
('초등부 주일학교', 'ELEMENTARY', '초등부 관련 단체', 3),
('중고등부 주일학교', 'MIDDLE_HIGH', '중고등부 관련 단체', 4);
```

### 1.3 user_organizations (사용자-단체 관계)

```sql
-- 사용자 단체 역할 ENUM
CREATE TYPE user_organization_role AS ENUM ('ADMIN', 'MEMBER');

CREATE TABLE user_organizations (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보 (FR-003, FR-009)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role user_organization_role DEFAULT 'MEMBER',
    
    -- 가입 정보
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건 (사용자-단체 관계 고유성)
    CONSTRAINT user_organizations_unique UNIQUE(user_id, organization_id)
);

-- 인덱스
CREATE UNIQUE INDEX idx_user_organizations_unique 
    ON user_organizations(user_id, organization_id);
CREATE INDEX idx_user_organizations_user_id 
    ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id 
    ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_role 
    ON user_organizations(role);
CREATE INDEX idx_user_organizations_active 
    ON user_organizations(is_active) WHERE is_active = TRUE;
```

## 2. 행사 관리 테이블

### 2.1 events (행사)

```sql
-- 행사 상태 ENUM
CREATE TYPE event_status AS ENUM (
    'PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);

CREATE TABLE events (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보 (FR-020)
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- 행사 정보 (FR-020)
    name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(200) NULL,
    allocated_budget DECIMAL(12,2) NULL,
    description TEXT NULL,
    
    -- 상태 정보
    status event_status DEFAULT 'PLANNING',
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT events_date_order CHECK (start_date <= end_date),
    CONSTRAINT events_allocated_budget_positive CHECK (
        allocated_budget IS NULL OR allocated_budget >= 0
    ),
    CONSTRAINT events_name_length CHECK (LENGTH(name) >= 2)
);

-- 인덱스
CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_start_date ON events(start_date DESC);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_name_search ON events USING gin(name gin_trgm_ops);

-- 복합 인덱스 (성능 최적화)
CREATE INDEX idx_events_org_date ON events(organization_id, start_date DESC);
CREATE INDEX idx_events_status_date ON events(status, start_date DESC);

-- 트리거
CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 3. 예산 관리 테이블

### 3.1 budgets (예산서)

```sql
-- 예산서 상태 ENUM
CREATE TYPE budget_status AS ENUM (
    'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'
);

CREATE TABLE budgets (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보 (FR-023)
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    approved_by UUID NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- 예산 정보
    status budget_status DEFAULT 'DRAFT',
    total_income DECIMAL(12,2) DEFAULT 0,
    total_expense DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) GENERATED ALWAYS AS (total_income - total_expense) STORED,
    
    -- 승인 정보
    approved_at TIMESTAMP NULL,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT budgets_unique_event UNIQUE(event_id),
    CONSTRAINT budgets_amounts_non_negative CHECK (
        total_income >= 0 AND total_expense >= 0
    )
);

-- 인덱스
CREATE UNIQUE INDEX idx_budgets_event_id ON budgets(event_id);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_approved_by ON budgets(approved_by) 
    WHERE approved_by IS NOT NULL;

-- 트리거
CREATE TRIGGER trigger_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 budget_incomes (예산 수입)

```sql
CREATE TABLE budget_incomes (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    
    -- 수입 정보
    source VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT budget_incomes_amount_positive CHECK (amount > 0),
    CONSTRAINT budget_incomes_unique_order UNIQUE(budget_id, display_order)
);

-- 인덱스
CREATE INDEX idx_budget_incomes_budget_id ON budget_incomes(budget_id);
CREATE UNIQUE INDEX idx_budget_incomes_order 
    ON budget_incomes(budget_id, display_order);

-- 트리거
CREATE TRIGGER trigger_budget_incomes_updated_at
    BEFORE UPDATE ON budget_incomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3.3 budget_expenses (예산 지출)

```sql
CREATE TABLE budget_expenses (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    
    -- 지출 정보
    category VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT budget_expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT budget_expenses_unique_order UNIQUE(budget_id, display_order)
);

-- 인덱스
CREATE INDEX idx_budget_expenses_budget_id ON budget_expenses(budget_id);
CREATE UNIQUE INDEX idx_budget_expenses_order 
    ON budget_expenses(budget_id, display_order);
CREATE INDEX idx_budget_expenses_category ON budget_expenses(category);

-- 트리거
CREATE TRIGGER trigger_budget_expenses_updated_at
    BEFORE UPDATE ON budget_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 4. 결산 관리 테이블

### 4.1 settlements (결산서)

```sql
-- 결산서 상태 ENUM
CREATE TYPE settlement_status AS ENUM (
    'DRAFT', 'SUBMITTED', 'COMPLETED'
);

CREATE TABLE settlements (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보 (FR-027)
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    completed_by UUID NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- 결산 정보
    status settlement_status DEFAULT 'DRAFT',
    total_income DECIMAL(12,2) DEFAULT 0,
    total_expense DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) GENERATED ALWAYS AS (total_income - total_expense) STORED,
    receipt_count INTEGER DEFAULT 0,
    
    -- 완료 정보
    completed_at TIMESTAMP NULL,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT settlements_unique_event UNIQUE(event_id),
    CONSTRAINT settlements_amounts_non_negative CHECK (
        total_income >= 0 AND total_expense >= 0
    ),
    CONSTRAINT settlements_receipt_count_non_negative CHECK (
        receipt_count >= 0
    )
);

-- 인덱스
CREATE UNIQUE INDEX idx_settlements_event_id ON settlements(event_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_completed_by ON settlements(completed_by) 
    WHERE completed_by IS NOT NULL;

-- 트리거
CREATE TRIGGER trigger_settlements_updated_at
    BEFORE UPDATE ON settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 settlement_incomes (결산 수입)

```sql
CREATE TABLE settlement_incomes (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    
    -- 수입 정보
    source VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT settlement_incomes_amount_positive CHECK (amount > 0),
    CONSTRAINT settlement_incomes_unique_order UNIQUE(settlement_id, display_order)
);

-- 인덱스
CREATE INDEX idx_settlement_incomes_settlement_id ON settlement_incomes(settlement_id);
CREATE UNIQUE INDEX idx_settlement_incomes_order 
    ON settlement_incomes(settlement_id, display_order);

-- 트리거
CREATE TRIGGER trigger_settlement_incomes_updated_at
    BEFORE UPDATE ON settlement_incomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 4.3 settlement_expenses (결산 지출)

```sql
CREATE TABLE settlement_expenses (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    
    -- 지출 정보
    category VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT settlement_expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT settlement_expenses_unique_order UNIQUE(settlement_id, display_order)
);

-- 인덱스
CREATE INDEX idx_settlement_expenses_settlement_id ON settlement_expenses(settlement_id);
CREATE UNIQUE INDEX idx_settlement_expenses_order 
    ON settlement_expenses(settlement_id, display_order);
CREATE INDEX idx_settlement_expenses_category ON settlement_expenses(category);

-- 트리거
CREATE TRIGGER trigger_settlement_expenses_updated_at
    BEFORE UPDATE ON settlement_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 5. OCR 및 영수증 관리 테이블

### 5.1 ocr_jobs (OCR 작업)

```sql
-- OCR 작업 상태 ENUM
CREATE TYPE ocr_job_status AS ENUM (
    'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
);

-- OCR 엔진 단계 ENUM (FR-033)
CREATE TYPE ocr_engine_stage AS ENUM (
    'TESSERACT', 'EASYOCR', 'GOOGLE_VISION'
);

CREATE TABLE ocr_jobs (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보 (FR-031)
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- OCR 작업 정보
    status ocr_job_status DEFAULT 'PENDING',
    engine_stage ocr_engine_stage DEFAULT 'TESSERACT',
    total_files INTEGER NOT NULL DEFAULT 0,
    processed_files INTEGER DEFAULT 0,
    success_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.6,
    
    -- 에러 및 로그
    error_message TEXT NULL,
    processing_started_at TIMESTAMP NULL,
    processing_completed_at TIMESTAMP NULL,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT ocr_jobs_file_counts CHECK (
        processed_files = success_files + failed_files AND
        processed_files <= total_files AND
        total_files >= 0 AND
        processed_files >= 0 AND
        success_files >= 0 AND
        failed_files >= 0
    ),
    CONSTRAINT ocr_jobs_confidence_threshold_range CHECK (
        confidence_threshold >= 0.0 AND confidence_threshold <= 1.0
    )
);

-- 인덱스
CREATE INDEX idx_ocr_jobs_settlement_id ON ocr_jobs(settlement_id);
CREATE INDEX idx_ocr_jobs_status ON ocr_jobs(status);
CREATE INDEX idx_ocr_jobs_created_by ON ocr_jobs(created_by);
CREATE INDEX idx_ocr_jobs_created_at ON ocr_jobs(created_at DESC);
CREATE INDEX idx_ocr_jobs_engine_stage ON ocr_jobs(engine_stage);

-- 부분 인덱스 (활성 작업만)
CREATE INDEX idx_ocr_jobs_active ON ocr_jobs(created_at DESC) 
    WHERE status IN ('PENDING', 'PROCESSING');

-- 트리거
CREATE TRIGGER trigger_ocr_jobs_updated_at
    BEFORE UPDATE ON ocr_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 receipts (영수증)

```sql
CREATE TABLE receipts (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    ocr_job_id UUID NULL REFERENCES ocr_jobs(id) ON DELETE SET NULL,
    
    -- 영수증 정보 (FR-032)
    receipt_date DATE NOT NULL,
    merchant_name VARCHAR(200) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    business_number VARCHAR(20) NULL,
    payment_method VARCHAR(50) NULL,
    
    -- 파일 정보
    image_path TEXT NULL,
    thumbnail_path TEXT NULL,
    
    -- OCR 처리 정보
    ocr_processed BOOLEAN DEFAULT FALSE,
    ocr_confidence DECIMAL(3,2) NULL,
    verified_by_user BOOLEAN DEFAULT FALSE,
    
    -- 비고
    notes TEXT NULL,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT receipts_total_amount_positive CHECK (total_amount > 0),
    CONSTRAINT receipts_ocr_confidence_range CHECK (
        ocr_confidence IS NULL OR 
        (ocr_confidence >= 0 AND ocr_confidence <= 1)
    ),
    CONSTRAINT receipts_business_number_format CHECK (
        business_number IS NULL OR 
        business_number ~ '^[0-9]{3}-[0-9]{2}-[0-9]{5}$'
    )
);

-- 인덱스
CREATE INDEX idx_receipts_settlement_id ON receipts(settlement_id);
CREATE INDEX idx_receipts_ocr_job_id ON receipts(ocr_job_id) 
    WHERE ocr_job_id IS NOT NULL;
CREATE INDEX idx_receipts_date ON receipts(receipt_date DESC);
CREATE INDEX idx_receipts_merchant_name ON receipts(merchant_name);
CREATE INDEX idx_receipts_total_amount ON receipts(total_amount);
CREATE INDEX idx_receipts_ocr_processed ON receipts(ocr_processed);
CREATE INDEX idx_receipts_verified ON receipts(verified_by_user);

-- 전문 검색 인덱스
CREATE INDEX idx_receipts_merchant_name_search 
    ON receipts USING gin(merchant_name gin_trgm_ops);

-- 복합 인덱스 (성능 최적화)
CREATE INDEX idx_receipts_settlement_date 
    ON receipts(settlement_id, receipt_date DESC);

-- 트리거
CREATE TRIGGER trigger_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 5.3 receipt_items (영수증 상품)

```sql
CREATE TABLE receipt_items (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    
    -- 상품 정보 (FR-032)
    item_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3) DEFAULT 1.0,
    unit_price DECIMAL(10,2) NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    item_code VARCHAR(50) NULL,
    category VARCHAR(100) NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- OCR 정보
    ocr_confidence DECIMAL(3,2) NULL,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT receipt_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT receipt_items_subtotal_positive CHECK (subtotal > 0),
    CONSTRAINT receipt_items_discount_non_negative CHECK (discount_amount >= 0),
    CONSTRAINT receipt_items_ocr_confidence_range CHECK (
        ocr_confidence IS NULL OR 
        (ocr_confidence >= 0 AND ocr_confidence <= 1)
    ),
    CONSTRAINT receipt_items_unique_order UNIQUE(receipt_id, display_order)
);

-- 인덱스
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE UNIQUE INDEX idx_receipt_items_order 
    ON receipt_items(receipt_id, display_order);
CREATE INDEX idx_receipt_items_name ON receipt_items(item_name);
CREATE INDEX idx_receipt_items_category ON receipt_items(category) 
    WHERE category IS NOT NULL;

-- 전문 검색 인덱스
CREATE INDEX idx_receipt_items_name_search 
    ON receipt_items USING gin(item_name gin_trgm_ops);

-- 트리거
CREATE TRIGGER trigger_receipt_items_updated_at
    BEFORE UPDATE ON receipt_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 6. 머신러닝 및 학습 데이터 테이블

### 6.1 ml_training_data (머신러닝 학습 데이터)

```sql
-- 학습 상태 ENUM
CREATE TYPE training_status AS ENUM (
    'PENDING', 'PROCESSED', 'VALIDATED'
);

-- OCR 엔진 ENUM
CREATE TYPE ml_ocr_engine AS ENUM (
    'TESSERACT', 'EASYOCR', 'GOOGLE_VISION'
);

CREATE TABLE ml_training_data (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보 (FR-036)
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- 이미지 정보
    original_image_path TEXT NOT NULL,
    preprocessed_image_path TEXT NULL,
    
    -- OCR 데이터
    ocr_raw_text TEXT NULL,
    user_corrected_text TEXT NULL,
    ocr_engine ml_ocr_engine NOT NULL,
    confidence_score DECIMAL(5,4) NULL,
    accuracy_score DECIMAL(5,4) NULL,
    
    -- 구조화 데이터 (JSON)
    extraction_data JSONB NULL,
    user_feedback JSONB NULL,
    
    -- 학습 상태
    training_status training_status DEFAULT 'PENDING',
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT ml_training_data_confidence_range CHECK (
        confidence_score IS NULL OR 
        (confidence_score >= 0.0 AND confidence_score <= 1.0)
    ),
    CONSTRAINT ml_training_data_accuracy_range CHECK (
        accuracy_score IS NULL OR 
        (accuracy_score >= 0.0 AND accuracy_score <= 1.0)
    )
);

-- 인덱스
CREATE INDEX idx_ml_training_data_receipt_id ON ml_training_data(receipt_id);
CREATE INDEX idx_ml_training_data_created_by ON ml_training_data(created_by);
CREATE INDEX idx_ml_training_data_engine ON ml_training_data(ocr_engine);
CREATE INDEX idx_ml_training_data_status ON ml_training_data(training_status);
CREATE INDEX idx_ml_training_data_created_at ON ml_training_data(created_at DESC);
CREATE INDEX idx_ml_training_data_accuracy ON ml_training_data(accuracy_score DESC) 
    WHERE accuracy_score IS NOT NULL;

-- JSON 인덱스 (검색 성능 향상)
CREATE INDEX idx_ml_training_data_extraction 
    ON ml_training_data USING gin(extraction_data);

-- 트리거
CREATE TRIGGER trigger_ml_training_data_updated_at
    BEFORE UPDATE ON ml_training_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 7. 콘텐츠 관리 테이블

### 7.1 posts (블로그 게시물)

```sql
CREATE TABLE posts (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보 (FR-016~FR-019)
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- 게시물 정보
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500) NULL,
    
    -- 게시 설정
    is_published BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    
    -- 게시 일시
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT posts_title_length CHECK (LENGTH(title) >= 2),
    CONSTRAINT posts_content_length CHECK (LENGTH(content) >= 10),
    CONSTRAINT posts_view_count_non_negative CHECK (view_count >= 0)
);

-- 인덱스
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC) 
    WHERE is_published = TRUE;
CREATE INDEX idx_posts_is_published ON posts(is_published);
CREATE INDEX idx_posts_is_pinned ON posts(is_pinned) 
    WHERE is_pinned = TRUE;
CREATE INDEX idx_posts_view_count ON posts(view_count DESC);

-- 전문 검색 인덱스
CREATE INDEX idx_posts_title_search ON posts USING gin(title gin_trgm_ops);
CREATE INDEX idx_posts_content_search ON posts USING gin(content gin_trgm_ops);

-- 트리거
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 7.2 notifications (알림)

```sql
-- 알림 유형 ENUM
CREATE TYPE notification_type AS ENUM (
    'SYSTEM', 'BLOG_POST', 'OCR_COMPLETE', 'BUDGET_APPROVED', 
    'SETTLEMENT_COMPLETE', 'USER_MENTION', 'REMINDER'
);

-- 알림 우선순위 ENUM
CREATE TYPE notification_priority AS ENUM (
    'LOW', 'NORMAL', 'HIGH', 'URGENT'
);

CREATE TABLE notifications (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 대상 사용자 (NULL = 전체 공지)
    user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 알림 정보
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT NULL,
    
    -- 상태 정보
    is_read BOOLEAN DEFAULT FALSE,
    priority notification_priority DEFAULT 'NORMAL',
    
    -- 만료 정보
    expires_at TIMESTAMP NULL,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    CONSTRAINT notifications_title_length CHECK (LENGTH(title) >= 1),
    CONSTRAINT notifications_message_length CHECK (LENGTH(message) >= 1),
    CONSTRAINT notifications_expires_future CHECK (
        expires_at IS NULL OR expires_at > created_at
    )
);

-- 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id) 
    WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read, user_id) 
    WHERE is_read = FALSE;
CREATE INDEX idx_notifications_priority ON notifications(priority, created_at DESC);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 부분 인덱스 (미만료 알림만)
CREATE INDEX idx_notifications_active ON notifications(created_at DESC) 
    WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP;

-- 전체 공지 인덱스
CREATE INDEX idx_notifications_system ON notifications(created_at DESC) 
    WHERE user_id IS NULL;
```

## 8. 인증 관리 테이블

### 8.1 refresh_tokens (리프레시 토큰)

```sql
CREATE TABLE refresh_tokens (
    -- 기본 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계 정보
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 토큰 정보
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    
    -- 사용 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    
    -- 제약 조건
    CONSTRAINT refresh_tokens_expires_future CHECK (
        expires_at > created_at
    )
);

-- 인덱스
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash) 
    WHERE is_revoked = FALSE;
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 만료된/폐기된 토큰 정리용 인덱스
CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens(expires_at, is_revoked) 
    WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = TRUE;
```

## 데이터 타입 최적화 가이드

### 문자열 필드
- **UUID**: PostgreSQL의 네이티브 UUID 타입 사용
- **짧은 텍스트** (≤255자): VARCHAR(길이) 사용
- **긴 텍스트** (>255자): TEXT 사용
- **고정 길이**: CHAR(길이) (예: 단체 코드)

### 숫자 필드
- **금액**: DECIMAL(12,2) - 최대 999,999,999,999.99
- **비율/확률**: DECIMAL(3,2) 또는 DECIMAL(5,4) - 0.00~1.00
- **정수**: INTEGER (기본), BIGINT (큰 수)
- **카운트**: INTEGER DEFAULT 0

### 날짜/시간 필드
- **날짜만**: DATE
- **날짜+시간**: TIMESTAMP (시간대 정보 없음)
- **시간대 포함**: TIMESTAMPTZ (필요시)

### JSON 데이터
- **구조화된 데이터**: JSONB (인덱싱 가능, 성능 우수)
- **단순 저장**: JSON (압축 효율 우수)

### 불린 필드
- **기본값 명시**: DEFAULT TRUE/FALSE
- **부분 인덱스 활용**: WHERE 조건과 함께 인덱스

---

**문서 버전**: 1.0  
**작성일**: 2025-01-08  
**작성자**: Backend Developer Team  
**검토자**: Database Architect Team

## 참고 문서
- [데이터베이스 엔티티 분석](./entities.md)
- [데이터베이스 관계 정의](./relationships.md)
- [ERD 다이어그램](./erd.md)
- [PRD 요구사항](../PRD.md)
- [TSD 02_Database_Schema](../TSD/02_Database_Schema.md)