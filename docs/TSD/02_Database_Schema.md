# 데이터베이스 스키마 - 광남동성당 청소년위원회 예결산 관리 시스템

## 개요

PostgreSQL 15를 사용한 관계형 데이터베이스 설계입니다. TypeORM을 통해 객체-관계 매핑을 구현하며, 데이터 무결성과 성능을 모두 고려한 스키마 구조를 제시합니다.

## 데이터베이스 구성

### 기본 설정
- **Database**: PostgreSQL 15+
- **Character Set**: UTF-8
- **Collation**: ko_KR.UTF-8 (한글 정렬 지원)
- **Connection Pool**: 10-30 connections

### 확장 기능
```sql
-- UUID 생성을 위한 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 암호화를 위한 확장
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 전문 검색을 위한 확장
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## ERD (Entity Relationship Diagram)

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│    users    │    │ user_organizations │    │organizations│
│ ============│    │ ================  │    │ ============│
│ id (PK)     │◄──►│ id (PK)          │◄──►│ id (PK)     │
│ email       │    │ user_id (FK)     │    │ name        │
│ password    │    │ organization_id  │    │ description │
│ name        │    │ role            │    │ created_at  │
│ phone       │    │ joined_at       │    │ updated_at  │
│ ...         │    │ created_at      │    └─────────────┘
└─────────────┘    └─────────────────┘           │
       │                                          │ 1:N
       │ 1:N                                     ▼
       ▼                                  ┌─────────────┐
┌─────────────┐                         │   events    │
│    posts    │                         │ ============│
│ ============│                         │ id (PK)     │
│ id (PK)     │                         │ org_id (FK) │
│ title       │                         │ name        │
│ content     │                         │ start_date  │
│ author_id   │                         │ end_date    │
│ created_at  │                         │ location    │
└─────────────┘                         │ budget      │
                                         │ created_by  │
                                         └─────────────┘
                                                │ 1:1
                                   ┌────────────┼────────────┐
                                   ▼            ▼            ▼
                            ┌─────────────┐ ┌─────────────┐ │
                            │   budgets   │ │settlements  │ │
                            │ ============│ │ ============│ │
                            │ id (PK)     │ │ id (PK)     │ │
                            │ event_id    │ │ event_id    │ │
                            │ status      │ │ status      │ │
                            │ created_at  │ │ created_at  │ │
                            └─────────────┘ └─────────────┘ │
                                   │ 1:N           │ 1:N    │
                     ┌─────────────┼───────┐       │        │ 1:N
                     ▼             ▼       ▼       ▼        ▼
              ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
              │budget_incomes│ │budget_expenses│ │  receipts   │
              │ ============│ │ ============ │ │ ============│
              │ id (PK)     │ │ id (PK)      │ │ id (PK)     │
              │ budget_id   │ │ budget_id    │ │ settlement  │
              │ source      │ │ category     │ │ date        │
              │ amount      │ │ amount       │ │ merchant    │
              │ order       │ │ order        │ │ total       │
              └─────────────┘ └─────────────┘ │ ocr_job_id  │
                                               │ image_path  │
                                               └─────────────┘
                                                      │ 1:N
                                                      ▼
                                               ┌─────────────┐
                                               │receipt_items│
                                               │ ============│
                                               │ id (PK)     │
                                               │ receipt_id  │
                                               │ item_name   │
                                               │ quantity    │
                                               │ unit_price  │
                                               │ subtotal    │
                                               │ item_order  │
                                               └─────────────┘
```

## 테이블 상세 스키마

### 1. 사용자 테이블 (users)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    baptismal_name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    position VARCHAR(100) NOT NULL,
    address TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_phone_check CHECK (phone ~ '^[0-9-]{10,15}$')
);

-- 인덱스
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_admin ON users(is_admin) WHERE is_admin = TRUE;

-- 트리거 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. 단체 테이블 (organizations)

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT organizations_name_length CHECK (LENGTH(name) >= 2)
);

-- 인덱스
CREATE UNIQUE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = TRUE;

-- 트리거
CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. 사용자-단체 관계 테이블 (user_organizations)

```sql
CREATE TYPE user_organization_role AS ENUM ('ADMIN', 'MEMBER');

CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role user_organization_role DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT user_organizations_unique UNIQUE(user_id, organization_id)
);

-- 인덱스
CREATE UNIQUE INDEX idx_user_organizations_unique ON user_organizations(user_id, organization_id);
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_role ON user_organizations(role);
CREATE INDEX idx_user_organizations_active ON user_organizations(is_active) WHERE is_active = TRUE;
```

### 4. 행사 테이블 (events)

```sql
CREATE TYPE event_status AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(200),
    allocated_budget DECIMAL(12,2),
    status event_status DEFAULT 'PLANNING',
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT events_date_order CHECK (start_date <= end_date),
    CONSTRAINT events_allocated_budget_positive CHECK (allocated_budget IS NULL OR allocated_budget >= 0)
);

-- 인덱스
CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_name_trgm ON events USING gin (name gin_trgm_ops);

-- 트리거
CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 5. 예산 테이블 (budgets)

```sql
CREATE TYPE budget_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status budget_status DEFAULT 'DRAFT',
    total_income DECIMAL(12,2) DEFAULT 0,
    total_expense DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) GENERATED ALWAYS AS (total_income - total_expense) STORED,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT budgets_unique_event UNIQUE(event_id),
    CONSTRAINT budgets_amounts_non_negative CHECK (total_income >= 0 AND total_expense >= 0)
);

-- 인덱스
CREATE UNIQUE INDEX idx_budgets_event_id ON budgets(event_id);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_approved_by ON budgets(approved_by) WHERE approved_by IS NOT NULL;

-- 트리거
CREATE TRIGGER trigger_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 6. 예산 수입 테이블 (budget_incomes)

```sql
CREATE TABLE budget_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    source VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT budget_incomes_amount_positive CHECK (amount > 0),
    CONSTRAINT budget_incomes_unique_order UNIQUE(budget_id, display_order)
);

-- 인덱스
CREATE INDEX idx_budget_incomes_budget_id ON budget_incomes(budget_id);
CREATE INDEX idx_budget_incomes_order ON budget_incomes(budget_id, display_order);

-- 트리거
CREATE TRIGGER trigger_budget_incomes_updated_at
    BEFORE UPDATE ON budget_incomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 7. 예산 지출 테이블 (budget_expenses)

```sql
CREATE TABLE budget_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT budget_expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT budget_expenses_unique_order UNIQUE(budget_id, display_order)
);

-- 인덱스
CREATE INDEX idx_budget_expenses_budget_id ON budget_expenses(budget_id);
CREATE INDEX idx_budget_expenses_order ON budget_expenses(budget_id, display_order);
CREATE INDEX idx_budget_expenses_category ON budget_expenses(category);

-- 트리거
CREATE TRIGGER trigger_budget_expenses_updated_at
    BEFORE UPDATE ON budget_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 8. 결산 테이블 (settlements)

```sql
CREATE TYPE settlement_status AS ENUM ('DRAFT', 'SUBMITTED', 'COMPLETED');

CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status settlement_status DEFAULT 'DRAFT',
    total_income DECIMAL(12,2) DEFAULT 0,
    total_expense DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) GENERATED ALWAYS AS (total_income - total_expense) STORED,
    receipt_count INTEGER DEFAULT 0,
    completed_by UUID REFERENCES users(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT settlements_unique_event UNIQUE(event_id),
    CONSTRAINT settlements_amounts_non_negative CHECK (total_income >= 0 AND total_expense >= 0)
);

-- 인덱스
CREATE UNIQUE INDEX idx_settlements_event_id ON settlements(event_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_completed_by ON settlements(completed_by) WHERE completed_by IS NOT NULL;

-- 트리거
CREATE TRIGGER trigger_settlements_updated_at
    BEFORE UPDATE ON settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 9. 결산 수입 테이블 (settlement_incomes)

```sql
CREATE TABLE settlement_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    source VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT settlement_incomes_amount_positive CHECK (amount > 0),
    CONSTRAINT settlement_incomes_unique_order UNIQUE(settlement_id, display_order)
);

-- 인덱스
CREATE INDEX idx_settlement_incomes_settlement_id ON settlement_incomes(settlement_id);
CREATE INDEX idx_settlement_incomes_order ON settlement_incomes(settlement_id, display_order);

-- 트리거
CREATE TRIGGER trigger_settlement_incomes_updated_at
    BEFORE UPDATE ON settlement_incomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 10. 결산 지출 테이블 (settlement_expenses)

```sql
CREATE TABLE settlement_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    category VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT settlement_expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT settlement_expenses_unique_order UNIQUE(settlement_id, display_order)
);

-- 인덱스
CREATE INDEX idx_settlement_expenses_settlement_id ON settlement_expenses(settlement_id);
CREATE INDEX idx_settlement_expenses_order ON settlement_expenses(settlement_id, display_order);
CREATE INDEX idx_settlement_expenses_category ON settlement_expenses(category);

-- 트리거
CREATE TRIGGER trigger_settlement_expenses_updated_at
    BEFORE UPDATE ON settlement_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 11. OCR 작업 테이블 (ocr_jobs)

```sql
CREATE TYPE ocr_job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE ocr_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    status ocr_job_status DEFAULT 'PENDING',
    total_files INTEGER NOT NULL DEFAULT 0,
    processed_files INTEGER DEFAULT 0,
    success_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    error_message TEXT,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ocr_jobs_file_counts CHECK (
        processed_files = success_files + failed_files AND
        processed_files <= total_files
    )
);

-- 인덱스
CREATE INDEX idx_ocr_jobs_settlement_id ON ocr_jobs(settlement_id);
CREATE INDEX idx_ocr_jobs_status ON ocr_jobs(status);
CREATE INDEX idx_ocr_jobs_created_by ON ocr_jobs(created_by);
CREATE INDEX idx_ocr_jobs_created_at ON ocr_jobs(created_at);

-- 트리거
CREATE TRIGGER trigger_ocr_jobs_updated_at
    BEFORE UPDATE ON ocr_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 12. 영수증 테이블 (receipts)

```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    ocr_job_id UUID REFERENCES ocr_jobs(id) ON DELETE SET NULL,
    receipt_date DATE NOT NULL,
    merchant_name VARCHAR(200) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    business_number VARCHAR(20),
    payment_method VARCHAR(50),
    image_path TEXT,
    thumbnail_path TEXT,
    ocr_processed BOOLEAN DEFAULT FALSE,
    ocr_confidence DECIMAL(3,2), -- 0.00 ~ 1.00
    verified_by_user BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT receipts_total_amount_positive CHECK (total_amount > 0),
    CONSTRAINT receipts_ocr_confidence_range CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1)),
    CONSTRAINT receipts_business_number_format CHECK (business_number IS NULL OR business_number ~ '^[0-9]{3}-[0-9]{2}-[0-9]{5}$')
);

-- 인덱스
CREATE INDEX idx_receipts_settlement_id ON receipts(settlement_id);
CREATE INDEX idx_receipts_ocr_job_id ON receipts(ocr_job_id) WHERE ocr_job_id IS NOT NULL;
CREATE INDEX idx_receipts_date ON receipts(receipt_date);
CREATE INDEX idx_receipts_merchant_name ON receipts(merchant_name);
CREATE INDEX idx_receipts_total_amount ON receipts(total_amount);
CREATE INDEX idx_receipts_ocr_processed ON receipts(ocr_processed);
CREATE INDEX idx_receipts_merchant_name_trgm ON receipts USING gin (merchant_name gin_trgm_ops);

-- 트리거
CREATE TRIGGER trigger_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 13. 영수증 상품 테이블 (receipt_items)

```sql
CREATE TABLE receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3) DEFAULT 1.0,
    unit_price DECIMAL(10,2),
    subtotal DECIMAL(10,2) NOT NULL,
    item_code VARCHAR(50),
    category VARCHAR(100),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2),
    display_order INTEGER NOT NULL DEFAULT 0,
    ocr_confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT receipt_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT receipt_items_subtotal_positive CHECK (subtotal > 0),
    CONSTRAINT receipt_items_discount_non_negative CHECK (discount_amount >= 0),
    CONSTRAINT receipt_items_ocr_confidence_range CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1)),
    CONSTRAINT receipt_items_unique_order UNIQUE(receipt_id, display_order)
);

-- 인덱스
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_order ON receipt_items(receipt_id, display_order);
CREATE INDEX idx_receipt_items_name ON receipt_items(item_name);
CREATE INDEX idx_receipt_items_category ON receipt_items(category) WHERE category IS NOT NULL;
CREATE INDEX idx_receipt_items_name_trgm ON receipt_items USING gin (item_name gin_trgm_ops);

-- 트리거
CREATE TRIGGER trigger_receipt_items_updated_at
    BEFORE UPDATE ON receipt_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 14. 블로그 게시물 테이블 (posts)

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500),
    is_published BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT posts_title_length CHECK (LENGTH(title) >= 2),
    CONSTRAINT posts_content_length CHECK (LENGTH(content) >= 10)
);

-- 인덱스
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC) WHERE is_published = TRUE;
CREATE INDEX idx_posts_is_published ON posts(is_published);
CREATE INDEX idx_posts_title_trgm ON posts USING gin (title gin_trgm_ops);
CREATE INDEX idx_posts_content_trgm ON posts USING gin (content gin_trgm_ops);

-- 트리거
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 15. 리프레시 토큰 테이블 (refresh_tokens)

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    
    CONSTRAINT refresh_tokens_expires_future CHECK (expires_at > created_at)
);

-- 인덱스
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash) WHERE is_revoked = FALSE;
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 만료된 토큰 정리를 위한 인덱스
CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens(expires_at, is_revoked) WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = TRUE;
```

## TypeORM 엔티티 예시

### User 엔티티
```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UserOrganization } from './user-organization.entity';
import { Event } from './event.entity';
import { Post } from './post.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['name'])
@Index(['phone'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'baptismal_name', type: 'varchar', length: 100, nullable: true })
  baptismalName?: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate: Date;

  @Column({ type: 'varchar', length: 100 })
  position: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserOrganization, userOrg => userOrg.user)
  userOrganizations: UserOrganization[];

  @OneToMany(() => Event, event => event.createdBy)
  createdEvents: Event[];

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}
```

### Event 엔티티
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, Index } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Budget } from './budget.entity';
import { Settlement } from './settlement.entity';

export enum EventStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('events')
@Index(['organizationId'])
@Index(['startDate'])
@Index(['status'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location?: string;

  @Column({ name: 'allocated_budget', type: 'decimal', precision: 12, scale: 2, nullable: true })
  allocatedBudget?: number;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.PLANNING })
  status: EventStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToOne(() => Budget, budget => budget.event)
  budget: Budget;

  @OneToOne(() => Settlement, settlement => settlement.event)
  settlement: Settlement;
}
```

## 마이그레이션 스크립트

### 초기 마이그레이션 생성
```bash
# 마이그레이션 생성
npm run typeorm:migration:generate -- InitialSchema

# 마이그레이션 실행
npm run typeorm:migration:run

# 마이그레이션 롤백
npm run typeorm:migration:revert
```

### package.json 스크립트 추가
```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs",
    "typeorm:migration:generate": "npm run typeorm migration:generate -- -d src/database/data-source.ts",
    "typeorm:migration:create": "npm run typeorm migration:create",
    "typeorm:migration:run": "npm run typeorm migration:run -- -d src/database/data-source.ts",
    "typeorm:migration:revert": "npm run typeorm migration:revert -- -d src/database/data-source.ts",
    "typeorm:schema:sync": "npm run typeorm schema:sync -- -d src/database/data-source.ts",
    "typeorm:schema:drop": "npm run typeorm schema:drop -- -d src/database/data-source.ts"
  }
}
```

### DataSource 설정 예시
```typescript
// src/database/data-source.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'church_budget_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/**/*.entity.{ts,js}'],
  migrations: ['src/database/migrations/*.{ts,js}'],
  subscribers: ['src/**/*.subscriber.{ts,js}'],
});
```

## 데이터베이스 최적화 전략

### 1. 인덱스 최적화
```sql
-- 복합 인덱스 (쿼리 패턴에 따라)
CREATE INDEX idx_events_org_date ON events(organization_id, start_date);
CREATE INDEX idx_receipts_settlement_date ON receipts(settlement_id, receipt_date);

-- 부분 인덱스 (조건부)
CREATE INDEX idx_users_active_admin ON users(id) WHERE is_active = TRUE AND is_admin = TRUE;
CREATE INDEX idx_events_current_year ON events(start_date) WHERE start_date >= CURRENT_DATE - INTERVAL '1 year';
```

### 2. 파티셔닝 (대용량 데이터 시)
```sql
-- 날짜별 파티셔닝 (영수증 테이블)
CREATE TABLE receipts_2024 PARTITION OF receipts
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE receipts_2025 PARTITION OF receipts
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### 3. 통계 업데이트 자동화
```sql
-- 주기적 통계 업데이트
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE users;
    ANALYZE events;
    ANALYZE receipts;
    ANALYZE receipt_items;
END;
$$ LANGUAGE plpgsql;

-- 크론 작업으로 주기적 실행 (pg_cron 확장 필요)
SELECT cron.schedule('update-stats', '0 2 * * *', 'SELECT update_table_statistics();');
```

## 백업 및 복구 전략

### 1. 정기 백업 스크립트
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgres"
DB_NAME="church_budget_db"

# 전체 백업
pg_dump -h localhost -U postgres -d $DB_NAME -f "$BACKUP_DIR/full_backup_$DATE.sql"

# 구조만 백업
pg_dump -h localhost -U postgres -d $DB_NAME -s -f "$BACKUP_DIR/schema_backup_$DATE.sql"

# 7일 이상된 백업 파일 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

### 2. 복구 스크립트
```bash
#!/bin/bash
# restore.sh
BACKUP_FILE=$1
DB_NAME="church_budget_db"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

# 데이터베이스 재생성
dropdb -h localhost -U postgres $DB_NAME
createdb -h localhost -U postgres $DB_NAME

# 백업 복구
psql -h localhost -U postgres -d $DB_NAME -f $BACKUP_FILE
```

---

*이 데이터베이스 스키마는 성능과 확장성을 고려하여 설계되었으며, 실제 운영 환경에서의 요구사항에 따라 조정될 수 있습니다.*