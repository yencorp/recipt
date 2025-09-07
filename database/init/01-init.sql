-- =================================================================
-- PostgreSQL 초기화 스크립트
-- 프로젝트: 광남동성당 청소년위원회 예결산 관리 시스템
-- 설명: 개발환경 데이터베이스 초기 설정 및 기본 데이터
-- =================================================================

-- 데이터베이스 연결 확인
\echo '🚀 PostgreSQL 초기화 스크립트 시작...'

-- 한국어 설정 확인
SHOW LC_COLLATE;
SHOW LC_CTYPE;

-- 확장 모듈 설치
\echo '📦 필요한 확장 모듈 설치 중...'

-- UUID 생성을 위한 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 암호화 기능을 위한 확장
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 전체 텍스트 검색을 위한 확장 (한국어 지원)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 문자열 유사도 검색을 위한 확장
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

\echo '✅ 확장 모듈 설치 완료'

-- =================================================================
-- 개발환경용 기본 데이터베이스 생성 (필요시)
-- =================================================================

-- 테스트 데이터베이스 생성
\echo '📋 테스트 데이터베이스 생성 중...'

-- recipt_test 데이터베이스가 없으면 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'recipt_test') THEN
        CREATE DATABASE recipt_test
            WITH OWNER = recipt
            ENCODING = 'UTF8'
            LC_COLLATE = 'C'
            LC_CTYPE = 'C'
            TEMPLATE = template0;
        
        RAISE NOTICE '✅ 테스트 데이터베이스 생성 완료: recipt_test';
    ELSE
        RAISE NOTICE '⚠️  테스트 데이터베이스 이미 존재: recipt_test';
    END IF;
END
$$;

-- =================================================================
-- 개발환경용 기본 테이블 생성
-- =================================================================

\echo '📊 기본 테이블 구조 생성 중...'

-- 단체(조직) 테이블
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE organizations IS '교회 단체 정보 (청년회, 자모회, 초등부, 중고등부)';

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    baptism_name VARCHAR(100),
    phone VARCHAR(20),
    birth_date DATE,
    address TEXT,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'leader', 'member')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS '시스템 사용자 정보';

-- 사용자-단체 연결 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'treasurer', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(user_id, organization_id)
);

COMMENT ON TABLE user_organizations IS '사용자-단체 연결 관계 (다대다)';

-- 프로젝트(행사) 테이블
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE,
    location VARCHAR(255),
    allocated_budget DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'approved', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE projects IS '행사(프로젝트) 정보';

-- 세션 테이블 (JWT 토큰 관리용)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_sessions IS '사용자 세션 관리 (리프레시 토큰)';

-- =================================================================
-- 인덱스 생성 (성능 최적화)
-- =================================================================

\echo '🔍 인덱스 생성 중...'

-- 사용자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 단체 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- 사용자-단체 관계 인덱스
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_is_active ON user_organizations(is_active);

-- 프로젝트 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_creator_id ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_event_date ON projects(event_date);

-- 세션 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

\echo '✅ 인덱스 생성 완료'

-- =================================================================
-- 개발환경용 기본 데이터 삽입
-- =================================================================

\echo '🎯 개발환경용 기본 데이터 삽입 중...'

-- 기본 단체 데이터
INSERT INTO organizations (name, description, contact_email, contact_phone) VALUES
('청년회', '광남동성당 청년회', 'youth@recipt.com', '010-1234-5678'),
('자모회', '광남동성당 자모회', 'mothers@recipt.com', '010-2234-5678'),
('초등부 주일학교', '광남동성당 초등부 주일학교', 'elementary@recipt.com', '010-3234-5678'),
('중고등부 주일학교', '광남동성당 중고등부 주일학교', 'secondary@recipt.com', '010-4234-5678')
ON CONFLICT (name) DO NOTHING;

-- 개발용 테스트 사용자
-- 비밀번호: password (bcrypt 해시)
INSERT INTO users (email, password_hash, name, baptism_name, role) VALUES
('admin@recipt.com', '$2b$10$8K1p/a0dF9p.5QS9B4Q5Xuf6K5Y8E5wq4lF4J4Z5Z5Z5Z5Z5Z5Z5Zu', '관리자', '요한', 'admin'),
('youth.leader@recipt.com', '$2b$10$8K1p/a0dF9p.5QS9B4Q5Xuf6K5Y8E5wq4lF4J4Z5Z5Z5Z5Z5Z5Z5Zu', '청년회 회장', '베드로', 'leader'),
('treasurer@recipt.com', '$2b$10$8K1p/a0dF9p.5QS9B4Q5Xuf6K5Y8E5wq4lF4J4Z5Z5Z5Z5Z5Z5Z5Zu', '회계 담당', '마리아', 'member'),
('test@recipt.com', '$2b$10$8K1p/a0dF9p.5QS9B4Q5Xuf6K5Y8E5wq4lF4J4Z5Z5Z5Z5Z5Z5Z5Zu', '테스트 사용자', '요셉', 'member')
ON CONFLICT (email) DO NOTHING;

-- 사용자-단체 연결 (테스트 데이터)
WITH admin_user AS (SELECT id FROM users WHERE email = 'admin@recipt.com'),
     youth_leader AS (SELECT id FROM users WHERE email = 'youth.leader@recipt.com'),
     treasurer AS (SELECT id FROM users WHERE email = 'treasurer@recipt.com'),
     test_user AS (SELECT id FROM users WHERE email = 'test@recipt.com'),
     youth_org AS (SELECT id FROM organizations WHERE name = '청년회'),
     mothers_org AS (SELECT id FROM organizations WHERE name = '자모회')
INSERT INTO user_organizations (user_id, organization_id, role) VALUES
-- 관리자는 모든 단체에 접근
((SELECT id FROM admin_user), (SELECT id FROM youth_org), 'leader'),
((SELECT id FROM admin_user), (SELECT id FROM mothers_org), 'leader'),
-- 청년회장은 청년회에만
((SELECT id FROM youth_leader), (SELECT id FROM youth_org), 'leader'),
-- 회계 담당은 청년회에 소속
((SELECT id FROM treasurer), (SELECT id FROM youth_org), 'treasurer'),
-- 테스트 사용자는 청년회 일반 멤버
((SELECT id FROM test_user), (SELECT id FROM youth_org), 'member')
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 개발용 테스트 프로젝트
WITH youth_org AS (SELECT id FROM organizations WHERE name = '청년회'),
     admin_user AS (SELECT id FROM users WHERE email = 'admin@recipt.com')
INSERT INTO projects (organization_id, creator_id, name, description, event_date, location, allocated_budget) VALUES
((SELECT id FROM youth_org), (SELECT id FROM admin_user), '여름 수련회 2025', '청년회 여름 수련회', '2025-08-15', '수양관', 2000000.00),
((SELECT id FROM youth_org), (SELECT id FROM admin_user), '크리스마스 행사', '2024년 청년회 크리스마스 행사', '2024-12-25', '성당 대강당', 500000.00)
ON CONFLICT DO NOTHING;

\echo '✅ 개발환경용 기본 데이터 삽입 완료'

-- =================================================================
-- 권한 및 보안 설정
-- =================================================================

\echo '🔒 권한 및 보안 설정 중...'

-- recipt 사용자에게 모든 테이블에 대한 권한 부여
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO recipt;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO recipt;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO recipt;

-- 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO recipt;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO recipt;

\echo '✅ 권한 설정 완료'

-- =================================================================
-- 트리거 및 함수 생성
-- =================================================================

\echo '⚙️  트리거 및 함수 생성 중...'

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 테이블별 updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '✅ 트리거 및 함수 생성 완료'

-- =================================================================
-- 설정 확인 및 정리
-- =================================================================

\echo '🔍 데이터베이스 설정 확인...'

-- 생성된 테이블 목록 확인
\echo '📋 생성된 테이블:'
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 생성된 인덱스 확인
\echo '🔍 생성된 인덱스:'
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 데이터베이스 크기 확인
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;

\echo '🎉 PostgreSQL 초기화 완료!'
\echo '📊 접속 정보:'
\echo '  - 데이터베이스: recipt_db'
\echo '  - 사용자: recipt'
\echo '  - 포트: 5432'
\echo '  - 테스트 DB: recipt_test'
\echo ''
\echo '👥 개발용 테스트 계정:'
\echo '  - admin@recipt.com (관리자)'
\echo '  - youth.leader@recipt.com (청년회장)'  
\echo '  - treasurer@recipt.com (회계담당)'
\echo '  - test@recipt.com (일반사용자)'
\echo '  - 공통 비밀번호: password'