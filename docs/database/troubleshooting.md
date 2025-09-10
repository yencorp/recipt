# 데이터베이스 트러블슈팅 가이드

## 개요

본 문서는 광남동성당 청소년위원회 예결산 관리 시스템 운영 중 발생할 수 있는 데이터베이스 관련 문제들의 진단 및 해결 방법을 제공합니다.

**대상 독자**:
- 백엔드 개발자
- DevOps 엔지니어
- 시스템 관리자
- 기술 지원팀

**시스템 환경**:
- PostgreSQL 15+
- TypeORM 0.3+
- Node.js + NestJS
- Docker (선택적)

**작성일**: 2025년 1월 11일  
**최종 업데이트**: Task 2.16 완료 기준

---

## 목차

1. [데이터베이스 연결 문제](#1-데이터베이스-연결-문제)
2. [성능 문제](#2-성능-문제)
3. [데이터 무결성 문제](#3-데이터-무결성-문제)
4. [TypeORM 관련 문제](#4-typeorm-관련-문제)
5. [마이그레이션 문제](#5-마이그레이션-문제)
6. [OCR 및 파일 처리 문제](#6-ocr-및-파일-처리-문제)
7. [백업/복구 문제](#7-백업복구-문제)
8. [모니터링 및 진단 도구](#8-모니터링-및-진단-도구)
9. [응급 상황 대응](#9-응급-상황-대응)

---

## 1. 데이터베이스 연결 문제

### 1.1 연결 거부 오류 (ECONNREFUSED)

#### 증상
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

#### 원인 분석
1. PostgreSQL 서비스가 중단됨
2. 네트워크 연결 문제
3. 방화벽 차단
4. 잘못된 호스트/포트 설정

#### 해결 방법

**Step 1: 서비스 상태 확인**
```bash
# PostgreSQL 서비스 상태
sudo systemctl status postgresql

# 포트 리스닝 확인
sudo netstat -tlnp | grep 5432

# 프로세스 확인
ps aux | grep postgres
```

**Step 2: 서비스 재시작**
```bash
# 서비스 재시작
sudo systemctl restart postgresql

# 서비스 활성화 (부팅 시 자동 시작)
sudo systemctl enable postgresql

# 로그 확인
sudo journalctl -u postgresql -n 50
```

**Step 3: 방화벽 설정**
```bash
# 방화벽 상태 확인
sudo ufw status

# PostgreSQL 포트 허용
sudo ufw allow 5432/tcp

# 특정 IP만 허용 (보안 강화)
sudo ufw allow from 192.168.1.0/24 to any port 5432
```

### 1.2 인증 실패 (authentication failed)

#### 증상
```
FATAL: password authentication failed for user "recipt_user"
```

#### 해결 방법

**Step 1: 사용자 존재 여부 확인**
```sql
-- PostgreSQL에 슈퍼유저로 연결
sudo -u postgres psql

-- 사용자 목록 확인
\du

-- 사용자가 없다면 생성
CREATE USER recipt_user WITH PASSWORD 'secure_password_2025';
```

**Step 2: 권한 부여**
```sql
-- 데이터베이스 접근 권한
GRANT CONNECT ON DATABASE recipt_production TO recipt_user;

-- 스키마 사용 권한
GRANT USAGE ON SCHEMA public TO recipt_user;

-- 테이블 권한
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO recipt_user;

-- 시퀀스 권한
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO recipt_user;

-- 향후 생성될 객체에 대한 기본 권한
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO recipt_user;
```

**Step 3: pg_hba.conf 설정 확인**
```bash
# 설정 파일 위치 확인
sudo -u postgres psql -c "SHOW hba_file;"

# 설정 파일 편집
sudo nano /etc/postgresql/15/main/pg_hba.conf

# 다음 라인 추가 또는 수정
local   recipt_production   recipt_user                     md5
host    recipt_production   recipt_user   127.0.0.1/32      md5
host    recipt_production   recipt_user   ::1/128           md5

# 설정 적용
sudo systemctl reload postgresql
```

### 1.3 연결 풀 고갈 (connection pool exhausted)

#### 증상
```
Error: Connection pool exhausted. Maximum connections: 10
```

#### 해결 방법

**Step 1: 현재 연결 상태 확인**
```sql
-- 현재 연결 수 확인
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- 유휴 연결 확인
SELECT count(*) as idle_connections 
FROM pg_stat_activity 
WHERE state = 'idle';

-- 오래된 연결 확인
SELECT pid, usename, application_name, client_addr, state,
       now() - state_change as idle_duration
FROM pg_stat_activity 
WHERE state = 'idle'
ORDER BY state_change;
```

**Step 2: TypeORM 연결 풀 설정 최적화**
```typescript
// data-source.ts
export const AppDataSource = new DataSource({
    // ... 기타 설정
    
    // 연결 풀 설정
    extra: {
        max: 20,                    // 최대 연결 수
        min: 5,                     // 최소 연결 수
        acquireTimeoutMillis: 30000, // 연결 획득 타임아웃
        idleTimeoutMillis: 600000,   // 유휴 연결 타임아웃 (10분)
        reapIntervalMillis: 1000,    // 연결 정리 간격
        createRetryIntervalMillis: 200, // 재시도 간격
        
        // 연결 생성 타임아웃
        createTimeoutMillis: 30000,
    }
});
```

**Step 3: PostgreSQL 설정 조정**
```sql
-- 최대 연결 수 증가 (재시작 필요)
ALTER SYSTEM SET max_connections = 200;

-- 설정 적용
SELECT pg_reload_conf();

-- 또는 postgresql.conf 직접 수정
-- max_connections = 200
```

---

## 2. 성능 문제

### 2.1 느린 쿼리 진단

#### 증상
- API 응답 시간이 5초 이상
- 데이터베이스 CPU 사용률 90% 초과
- 동시 접속자 증가 시 성능 급격히 저하

#### 진단 방법

**Step 1: 현재 실행 중인 쿼리 확인**
```sql
-- 오래 실행되는 쿼리 찾기
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
    AND state = 'active'
ORDER BY duration DESC;

-- 락 대기 중인 쿼리
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Step 2: 쿼리 실행 계획 분석**
```sql
-- 실행 계획 확인
EXPLAIN ANALYZE
SELECT u.name, uo.role, o.name as org_name
FROM users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.status = 'ACTIVE'
ORDER BY u.created_at DESC
LIMIT 100;

-- 버퍼 사용량까지 포함
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM budgets WHERE status = 'APPROVED';
```

**Step 3: 인덱스 사용률 확인**
```sql
-- 인덱스 사용 통계
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_tup_read / NULLIF(idx_tup_fetch, 0) as ratio
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- 사용되지 않는 인덱스
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

#### 해결 방법

**인덱스 최적화**
```sql
-- 복합 인덱스 생성 (자주 함께 조회되는 컬럼)
CREATE INDEX CONCURRENTLY idx_user_organizations_active 
ON user_organizations(user_id, status) 
WHERE status = 'ACTIVE';

-- 부분 인덱스 (특정 조건의 데이터만)
CREATE INDEX CONCURRENTLY idx_budgets_approved 
ON budgets(created_at DESC) 
WHERE status = 'APPROVED';

-- 전문 검색 인덱스
CREATE INDEX CONCURRENTLY idx_events_name_search 
ON events USING gin(name gin_trgm_ops);
```

**쿼리 최적화**
```sql
-- N+1 문제 해결 (TypeORM)
-- Before: 각 예산마다 개별 쿼리
const budgets = await budgetRepository.find();
for (const budget of budgets) {
    budget.organization = await organizationRepository.findOne(budget.organizationId);
}

-- After: JOIN을 사용한 단일 쿼리
const budgets = await budgetRepository.find({
    relations: ['organization']
});
```

### 2.2 메모리 문제

#### 증상
```
FATAL: out of memory
DETAIL: Failed on request of size 134217728.
```

#### 해결 방법

**Step 1: 메모리 사용량 확인**
```sql
-- 현재 메모리 설정 확인
SELECT name, setting, unit, context 
FROM pg_settings 
WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem', 'effective_cache_size');

-- 메모리 사용 통계
SELECT 
    datname,
    temp_files,
    temp_bytes,
    pg_size_pretty(temp_bytes) as temp_size
FROM pg_stat_database
WHERE temp_files > 0;
```

**Step 2: PostgreSQL 메모리 설정 최적화**
```bash
# postgresql.conf 편집
sudo nano /etc/postgresql/15/main/postgresql.conf

# 메모리 설정 (시스템 RAM의 약 25%)
shared_buffers = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB
effective_cache_size = 1GB

# 설정 적용
sudo systemctl restart postgresql
```

### 2.3 디스크 공간 부족

#### 증상
```
ERROR: could not extend file "base/16384/16389": No space left on device
```

#### 해결 방법

**Step 1: 디스크 사용량 확인**
```bash
# 디스크 공간 확인
df -h

# PostgreSQL 데이터 디렉토리 크기
sudo du -sh /var/lib/postgresql/15/main/

# 데이터베이스별 크기
sudo -u postgres psql -c "
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;
"
```

**Step 2: 불필요한 데이터 정리**
```sql
-- 오래된 감사 로그 삭제 (6개월 이전)
DELETE FROM audit_trails 
WHERE created_at < NOW() - INTERVAL '6 months';

-- VACUUM으로 디스크 공간 회수
VACUUM FULL audit_trails;

-- 자동 VACUUM 설정 확인
SELECT name, setting FROM pg_settings WHERE name LIKE '%vacuum%';
```

**Step 3: 로그 파일 정리**
```bash
# PostgreSQL 로그 파일 정리
sudo find /var/log/postgresql -name "*.log" -mtime +30 -delete

# 로그 로테이션 설정 확인
sudo nano /etc/logrotate.d/postgresql-common
```

---

## 3. 데이터 무결성 문제

### 3.1 외래키 제약조건 위반

#### 증상
```
ERROR: insert or update on table "user_organizations" violates foreign key constraint "FK_user_organizations_user_id"
DETAIL: Key (user_id)=(550e8400-e29b-41d4-a716-446655440000) is not present in table "users".
```

#### 해결 방법

**Step 1: 고아 레코드 확인**
```sql
-- 고아 레코드 찾기
SELECT uo.id, uo.user_id
FROM user_organizations uo
LEFT JOIN users u ON uo.user_id = u.id
WHERE u.id IS NULL;

-- 참조되지 않는 조직 찾기
SELECT o.id, o.name
FROM organizations o
LEFT JOIN user_organizations uo ON o.id = uo.organization_id
WHERE uo.organization_id IS NULL;
```

**Step 2: 데이터 정리**
```sql
-- 고아 레코드 삭제 (주의: 백업 후 실행)
DELETE FROM user_organizations 
WHERE user_id NOT IN (SELECT id FROM users);

-- 또는 안전하게 비활성화
UPDATE user_organizations 
SET is_active = false 
WHERE user_id NOT IN (SELECT id FROM users);
```

**Step 3: 제약조건 재생성**
```sql
-- 기존 제약조건 삭제
ALTER TABLE user_organizations 
DROP CONSTRAINT IF EXISTS FK_user_organizations_user_id;

-- 새 제약조건 추가
ALTER TABLE user_organizations 
ADD CONSTRAINT FK_user_organizations_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### 3.2 중복 데이터 문제

#### 증상
```
ERROR: duplicate key value violates unique constraint "users_email_key"
DETAIL: Key (email)=(test@example.com) already exists.
```

#### 해결 방법

**Step 1: 중복 데이터 확인**
```sql
-- 중복 이메일 찾기
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- 중복 레코드 상세 확인
SELECT id, email, name, created_at
FROM users
WHERE email IN (
    SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1
)
ORDER BY email, created_at;
```

**Step 2: 중복 데이터 정리**
```sql
-- 가장 오래된 레코드만 남기고 삭제
DELETE FROM users u1
USING users u2
WHERE u1.id > u2.id 
    AND u1.email = u2.email;

-- 또는 최신 레코드만 남기고 삭제
DELETE FROM users
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id
    FROM users
    ORDER BY email, created_at DESC
);
```

### 3.3 체크 제약조건 위반

#### 증상
```
ERROR: new row for relation "users" violates check constraint "users_email_check"
DETAIL: Failing row contains (..., invalid-email, ...).
```

#### 해결 방법

**Step 1: 잘못된 데이터 확인**
```sql
-- 이메일 형식이 잘못된 사용자
SELECT id, email
FROM users
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- 전화번호 형식 확인
SELECT id, phone
FROM users
WHERE phone IS NOT NULL 
    AND phone !~ '^[0-9-]{10,15}$';

-- 날짜 유효성 확인
SELECT id, start_date, end_date
FROM events
WHERE start_date > end_date;
```

**Step 2: 데이터 정정**
```sql
-- 이메일 주소 정정 (임시 방법)
UPDATE users 
SET email = CONCAT('temp_', id, '@example.com')
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- 전화번호 정정
UPDATE users 
SET phone = REGEXP_REPLACE(phone, '[^0-9-]', '', 'g')
WHERE phone IS NOT NULL;
```

---

## 4. TypeORM 관련 문제

### 4.1 Entity 동기화 문제

#### 증상
```
EntityMetadataNotFoundError: No metadata for "User" was found.
```

#### 해결 방법

**Step 1: Entity 등록 확인**
```typescript
// data-source.ts
export const AppDataSource = new DataSource({
    // Entity 경로 확인
    entities: [
        __dirname + '/../**/*.entity{.ts,.js}',
        // 또는 명시적 등록
        User,
        Organization,
        UserOrganization,
        // ... 다른 Entity들
    ],
});
```

**Step 2: 임포트 경로 확인**
```typescript
// 잘못된 예
import { User } from './user.entity'; // 상대 경로 문제

// 올바른 예
import { User } from '@/entities/user.entity';
```

### 4.2 트랜잭션 문제

#### 증상
```
QueryFailedError: current transaction is aborted, commands ignored until end of transaction block
```

#### 해결 방법

**Step 1: 트랜잭션 상태 확인**
```typescript
// 트랜잭션 안전하게 처리
async function safeTransaction() {
    const queryRunner = AppDataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        // 트랜잭션 작업
        await queryRunner.manager.save(user);
        await queryRunner.manager.save(userOrganization);
        
        await queryRunner.commitTransaction();
    } catch (error) {
        // 롤백
        await queryRunner.rollbackTransaction();
        console.error('Transaction failed:', error);
        throw error;
    } finally {
        // 연결 해제
        await queryRunner.release();
    }
}
```

**Step 2: 데드락 처리**
```typescript
// 재시도 로직 포함
async function executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (error.code === '40P01' && i < maxRetries - 1) {
                // 데드락 발생 시 재시도
                console.warn(`Deadlock detected, retrying... (${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
                continue;
            }
            throw error;
        }
    }
}
```

### 4.3 커넥션 리크 문제

#### 증상
- 연결 풀이 계속 증가
- "too many clients" 오류
- 메모리 사용량 지속 증가

#### 해결 방법

**Step 1: 연결 추적**
```typescript
// 커넥션 리크 디버깅
class ConnectionTracker {
    private static connections = new Map<string, Date>();
    
    static track(id: string) {
        this.connections.set(id, new Date());
        console.log(`Connection created: ${id} (Total: ${this.connections.size})`);
    }
    
    static untrack(id: string) {
        this.connections.delete(id);
        console.log(`Connection released: ${id} (Total: ${this.connections.size})`);
    }
    
    static getActiveConnections() {
        return Array.from(this.connections.entries());
    }
}
```

**Step 2: Repository 패턴 올바른 사용**
```typescript
// 잘못된 예 - 새 연결 생성
const repository = new Repository(User, manager); // ❌

// 올바른 예 - 기존 연결 재사용
const repository = AppDataSource.getRepository(User); // ✅

// 또는 의존성 주입 사용
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) {}
}
```

---

## 5. 마이그레이션 문제

### 5.1 마이그레이션 롤백 실패

#### 증상
```
Error during revert migration: column "old_column" does not exist
```

#### 해결 방법

**Step 1: 마이그레이션 상태 확인**
```sql
-- 마이그레이션 테이블 확인
SELECT * FROM typeorm_migrations ORDER BY timestamp DESC;

-- 수동으로 마이그레이션 기록 삭제 (주의!)
DELETE FROM typeorm_migrations 
WHERE name = 'FailedMigration1757400000000';
```

**Step 2: 스키마 수동 복구**
```sql
-- 테이블 구조 확인
\d+ users

-- 컬럼이 이미 삭제되었다면 다시 생성
ALTER TABLE users ADD COLUMN old_column VARCHAR(255);

-- 그 후 정상적인 롤백 실행
npm run migration:revert
```

### 5.2 마이그레이션 교착상태

#### 증상
```
Error: Migration is already running
```

#### 해결 방법

**Step 1: 실행 중인 마이그레이션 확인**
```sql
-- 장시간 실행되는 쿼리 확인
SELECT pid, query, state, now() - query_start as duration
FROM pg_stat_activity
WHERE query LIKE '%CREATE%' OR query LIKE '%ALTER%'
ORDER BY query_start;

-- 필요시 강제 종료 (매우 주의!)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE pid = [문제_프로세스_PID];
```

**Step 2: 마이그레이션 락 해제**
```sql
-- TypeORM 마이그레이션 락 확인
SELECT * FROM pg_locks 
WHERE locktype = 'advisory' 
AND classid = 1573240463;

-- 락 강제 해제 (응급 상황에만)
SELECT pg_advisory_unlock_all();
```

---

## 6. OCR 및 파일 처리 문제

### 6.1 OCR 처리 실패

#### 증상
- OCR 작업이 `PROCESSING` 상태에서 멈춤
- 에러 메시지: "Tesseract failed to process image"
- 영수증 텍스트 추출 결과가 부정확

#### 진단 방법

**Step 1: OCR 작업 상태 확인**
```sql
-- 오래된 처리 중 작업 확인
SELECT id, receipt_scan_id, engine, processing_stage, 
       created_at, updated_at,
       EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stuck
FROM ocr_results
WHERE status = 'PROCESSING'
    AND updated_at < NOW() - INTERVAL '30 minutes'
ORDER BY updated_at;

-- 실패율 통계
SELECT 
    engine,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
    ROUND(
        100.0 * SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) / COUNT(*), 
        2
    ) as success_rate
FROM ocr_results
GROUP BY engine;
```

#### 해결 방법

**Step 1: 멈춘 작업 재처리**
```sql
-- 멈춘 작업을 PENDING 상태로 되돌리기
UPDATE ocr_results 
SET status = 'PENDING', 
    processing_started_at = NULL,
    error_message = 'Reset due to timeout'
WHERE status = 'PROCESSING'
    AND updated_at < NOW() - INTERVAL '30 minutes';
```

**Step 2: OCR 엔진 설정 최적화**
```typescript
// OCR 서비스 설정
export class OCRService {
    private readonly tesseractConfig = {
        lang: 'kor+eng',
        oem: 1,
        psm: 3,
        timeout: 30000, // 30초 타임아웃
    };
    
    private readonly easyOCRConfig = {
        gpu: false,
        languages: ['ko', 'en'],
        width_ths: 0.7,
        height_ths: 0.7,
    };
    
    async processWithFallback(imagePath: string): Promise<OCRResult> {
        try {
            // 1차: Tesseract
            return await this.processTesseract(imagePath);
        } catch (error) {
            console.warn('Tesseract failed, trying EasyOCR:', error);
            
            try {
                // 2차: EasyOCR
                return await this.processEasyOCR(imagePath);
            } catch (error2) {
                console.error('All OCR engines failed:', error2);
                throw new Error('OCR processing failed');
            }
        }
    }
}
```

### 6.2 파일 업로드 문제

#### 증상
```
Error: File upload failed - ENOSPC: no space left on device
```

#### 해결 방법

**Step 1: 디스크 공간 확인**
```bash
# 업로드 디렉토리 용량 확인
df -h /var/www/recipt/uploads/

# 큰 파일들 찾기
find /var/www/recipt/uploads/ -type f -size +10M -exec ls -lh {} \;

# 오래된 임시 파일 정리
find /var/www/recipt/uploads/temp/ -type f -mtime +7 -delete
```

**Step 2: 파일 정리 자동화**
```bash
# 크론잡 설정
crontab -e

# 매일 새벽 2시에 오래된 파일 정리
0 2 * * * find /var/www/recipt/uploads/temp/ -type f -mtime +7 -delete

# 매주 일요일에 썸네일 재생성
0 3 * * 0 /home/recipt/scripts/cleanup_thumbnails.sh
```

### 6.3 이미지 처리 메모리 부족

#### 증상
```
Error: Image processing failed - Cannot allocate memory
```

#### 해결 방법

**Step 1: 이미지 크기 제한**
```typescript
// 이미지 업로드 미들웨어
export const imageUploadConfig = {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files allowed'), false);
        }
        cb(null, true);
    },
};

// 이미지 리사이징
async function resizeImage(inputPath: string, outputPath: string) {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // 큰 이미지는 리사이징
    if (metadata.width > 2048 || metadata.height > 2048) {
        await image
            .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(outputPath);
    } else {
        // 작은 이미지는 그대로 복사
        await fs.copyFile(inputPath, outputPath);
    }
}
```

---

## 7. 백업/복구 문제

### 7.1 백업 실패

#### 증상
```
pg_dump: error: connection to database "recipt_production" failed: FATAL: remaining connection slots are reserved
```

#### 해결 방법

**Step 1: 전용 백업 사용자 생성**
```sql
-- 백업 전용 사용자 생성
CREATE USER backup_user WITH PASSWORD 'backup_password_2025';

-- 최소 권한 부여
GRANT CONNECT ON DATABASE recipt_production TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;

-- 향후 생성될 테이블에 대한 권한
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO backup_user;
```

**Step 2: 백업 스크립트 개선**
```bash
#!/bin/bash
# backup-database.sh

set -e  # 오류 시 스크립트 중단

BACKUP_DIR="/backup/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="recipt_backup_${TIMESTAMP}.sql"

# 디스크 공간 확인
AVAILABLE_SPACE=$(df $BACKUP_DIR | tail -1 | awk '{print $4}')
if [ $AVAILABLE_SPACE -lt 1000000 ]; then  # 1GB 미만
    echo "❌ Insufficient disk space: ${AVAILABLE_SPACE}KB"
    exit 1
fi

# 백업 실행
echo "🔄 Starting backup at $(date)"
pg_dump -h localhost -U backup_user -d recipt_production \
    --verbose --clean --no-owner --no-privileges \
    --exclude-table=audit_trails \
    --exclude-table=session_data \
    > "${BACKUP_DIR}/${BACKUP_FILE}"

# 압축
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# 백업 검증
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}.gz" ]; then
    SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)
    echo "✅ Backup completed: ${BACKUP_FILE}.gz (${SIZE})"
    
    # Slack 알림 (선택적)
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Database backup completed: ${SIZE}\"}" \
        https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
else
    echo "❌ Backup failed"
    exit 1
fi

# 오래된 백업 정리 (30일 이전)
find $BACKUP_DIR -name "recipt_backup_*.sql.gz" -mtime +30 -delete

echo "🎉 Backup process completed at $(date)"
```

### 7.2 복구 실패

#### 증상
```
psql: error: connection to server failed: FATAL: database "recipt_production" does not exist
```

#### 해결 방법

**Step 1: 데이터베이스 재생성**
```sql
-- 슈퍼유저로 연결
sudo -u postgres psql

-- 데이터베이스 생성
CREATE DATABASE recipt_production
WITH OWNER = recipt_prod
     ENCODING = 'UTF8'
     LC_COLLATE = 'ko_KR.UTF-8'
     LC_CTYPE = 'ko_KR.UTF-8';

-- 필수 확장 설치
\c recipt_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

**Step 2: 복구 실행**
```bash
# 백업 파일 압축 해제
gunzip recipt_backup_20250111_143000.sql.gz

# 데이터베이스 복구
psql -h localhost -U recipt_prod -d recipt_production \
    < recipt_backup_20250111_143000.sql

# 복구 검증
psql -h localhost -U recipt_prod -d recipt_production -c "
SELECT 
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public'
GROUP BY schemaname;
"
```

---

## 8. 모니터링 및 진단 도구

### 8.1 성능 모니터링 쿼리

```sql
-- 데이터베이스 전체 통계
SELECT 
    datname,
    numbackends as connections,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    round(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) as cache_hit_ratio
FROM pg_stat_database
WHERE datname = 'recipt_production';

-- 테이블별 사용량
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 효율성
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE WHEN idx_tup_read > 0 
         THEN round(100.0 * idx_tup_fetch / idx_tup_read, 2)
         ELSE 0 
    END as selectivity
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

### 8.2 시스템 헬스 체크

```bash
#!/bin/bash
# health-check.sh

echo "=== Database Health Check $(date) ==="

# 1. 서비스 상태
echo "📊 Service Status:"
systemctl is-active postgresql || echo "❌ PostgreSQL not running"

# 2. 연결 테스트
echo "🔗 Connection Test:"
timeout 5 psql -h localhost -U recipt_prod -d recipt_production -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection OK"
else
    echo "❌ Database connection failed"
fi

# 3. 디스크 공간
echo "💾 Disk Space:"
df -h /var/lib/postgresql | tail -1 | awk '{
    if ($5+0 > 90) 
        print "❌ Disk usage critical: " $5
    else if ($5+0 > 80)
        print "⚠️  Disk usage high: " $5
    else
        print "✅ Disk usage OK: " $5
}'

# 4. 활성 연결 수
echo "🔌 Active Connections:"
CONNECTIONS=$(psql -h localhost -U recipt_prod -d recipt_production -t -c "SELECT count(*) FROM pg_stat_activity;")
if [ $CONNECTIONS -gt 80 ]; then
    echo "❌ Too many connections: $CONNECTIONS"
elif [ $CONNECTIONS -gt 50 ]; then
    echo "⚠️  High connection count: $CONNECTIONS"
else
    echo "✅ Connection count OK: $CONNECTIONS"
fi

# 5. 느린 쿼리
echo "🐌 Slow Queries:"
SLOW_QUERIES=$(psql -h localhost -U recipt_prod -d recipt_production -t -c "
SELECT count(*) 
FROM pg_stat_activity 
WHERE state = 'active' 
    AND now() - query_start > interval '30 seconds';
")
if [ $SLOW_QUERIES -gt 0 ]; then
    echo "⚠️  Slow queries detected: $SLOW_QUERIES"
else
    echo "✅ No slow queries"
fi

echo "=== Health Check Completed ==="
```

### 8.3 성능 대시보드 생성

```sql
-- 실시간 성능 대시보드 쿼리
WITH database_stats AS (
    SELECT 
        datname,
        round(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) as cache_hit_ratio,
        xact_commit,
        xact_rollback
    FROM pg_stat_database
    WHERE datname = 'recipt_production'
),
connection_stats AS (
    SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
    FROM pg_stat_activity
),
table_stats AS (
    SELECT 
        sum(n_tup_ins) as total_inserts,
        sum(n_tup_upd) as total_updates,
        sum(n_tup_del) as total_deletes
    FROM pg_stat_user_tables
)
SELECT 
    'Database Performance Dashboard' as title,
    d.cache_hit_ratio,
    c.total_connections,
    c.active_connections,
    c.idle_connections,
    t.total_inserts,
    t.total_updates,
    t.total_deletes,
    d.xact_commit,
    d.xact_rollback
FROM database_stats d, connection_stats c, table_stats t;
```

---

## 9. 응급 상황 대응

### 9.1 서비스 중단 대응

#### 단계별 대응 절차

**1단계: 즉시 대응 (5분 이내)**
1. 서비스 상태 확인
2. 에러 로그 수집
3. 기술팀 긴급 연락
4. 사용자 공지 준비

```bash
# 응급 진단 스크립트
#!/bin/bash
# emergency-diagnosis.sh

echo "🚨 EMERGENCY DIAGNOSIS STARTED $(date)"

# PostgreSQL 상태
echo "1. PostgreSQL Status:"
systemctl status postgresql --no-pager

# 연결 테스트
echo "2. Connection Test:"
timeout 3 psql -h localhost -U recipt_prod -d recipt_production -c "SELECT 1;"

# 디스크 공간
echo "3. Disk Space:"
df -h | grep -E '(Filesystem|/var/lib/postgresql|/)'

# 메모리 사용량
echo "4. Memory Usage:"
free -h

# 활성 연결
echo "5. Active Connections:"
psql -h localhost -U recipt_prod -d recipt_production -c "
SELECT count(*), state 
FROM pg_stat_activity 
GROUP BY state;
" 2>/dev/null || echo "Connection failed"

# 최근 에러 로그
echo "6. Recent Errors:"
tail -20 /var/log/postgresql/postgresql-*.log | grep ERROR

echo "🚨 EMERGENCY DIAGNOSIS COMPLETED $(date)"
```

**2단계: 상황 분석 (15분 이내)**
```bash
# 상세 분석
echo "📊 DETAILED ANALYSIS:"

# 오래 실행되는 쿼리
psql -h localhost -U recipt_prod -d recipt_production -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 minutes'
ORDER BY duration DESC;
"

# 락 상황
psql -h localhost -U recipt_prod -d recipt_production -c "
SELECT 
    l.mode,
    l.locktype,
    l.pid,
    a.query,
    a.state
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted;
"

# 시스템 리소스
echo "System Load: $(uptime)"
echo "Top processes:"
ps aux --sort=-%cpu | head -10
```

**3단계: 복구 시도 (30분 이내)**

```bash
# 복구 시도 스크립트
#!/bin/bash
# emergency-recovery.sh

echo "🔧 EMERGENCY RECOVERY STARTED $(date)"

# 1. 서비스 재시작 시도
echo "Restarting PostgreSQL service..."
sudo systemctl restart postgresql

sleep 10

# 2. 연결 테스트
if timeout 5 psql -h localhost -U recipt_prod -d recipt_production -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL restarted successfully"
else
    echo "❌ PostgreSQL restart failed"
    
    # 3. 응급 복구 시도
    echo "Attempting emergency recovery..."
    
    # 백업에서 복구
    LATEST_BACKUP=$(ls -t /backup/database/recipt_backup_*.sql.gz | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        echo "Found backup: $LATEST_BACKUP"
        
        # 데이터베이스 재생성
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS recipt_production;"
        sudo -u postgres psql -c "CREATE DATABASE recipt_production WITH OWNER recipt_prod;"
        
        # 백업 복구
        gunzip -c $LATEST_BACKUP | psql -h localhost -U recipt_prod -d recipt_production
        
        echo "✅ Recovery from backup completed"
    else
        echo "❌ No backup found for recovery"
    fi
fi

# 4. 상태 확인
./health-check.sh

echo "🔧 EMERGENCY RECOVERY COMPLETED $(date)"
```

### 9.2 에스컬레이션 절차

#### 연락망 및 역할

**Tier 1 - 운영팀 (24/7)**
- 초기 대응 및 상황 파악
- 기본 진단 및 로그 수집
- 서비스 재시작 등 기본 복구 시도

**Tier 2 - 기술팀 (평일 9-18시, 주말 온콜)**
- 상세 기술 분석
- 복잡한 복구 작업
- 임시 해결책 구현

**Tier 3 - 전문가 (온디맨드)**
- 핵심 시스템 설계자
- 외부 전문가
- 벤더 기술 지원

#### 에스컬레이션 기준

| 시간 | 상황 | 에스컬레이션 |
|------|------|-------------|
| 즉시 | 전체 서비스 중단 | Tier 1 → Tier 2 |
| 15분 | 기본 복구 실패 | Tier 2 → Tier 3 |
| 30분 | 데이터 손실 위험 | 모든 Tier 동원 |
| 1시간 | 복구 불가 | 경영진 보고 |

### 9.3 사후 분석 및 개선

#### 사후 분석 템플릿

```markdown
# 장애 사후 분석 보고서

## 장애 개요
- **발생일시**: 2025-01-11 14:30:00 ~ 15:15:00 (45분)
- **영향 범위**: 전체 사용자
- **장애 심각도**: Critical
- **최초 감지**: 모니터링 시스템 알림

## 타임라인
| 시간 | 이벤트 | 대응자 | 조치 |
|------|-------|--------|------|
| 14:30 | 서비스 응답 없음 감지 | 모니터링 | 자동 알림 |
| 14:32 | 기술팀 상황 확인 | 개발팀 | 로그 확인 |
| 14:35 | DB 연결 불가 확인 | DevOps | 서비스 재시작 |
| 14:50 | 백업으로 복구 결정 | 기술팀장 | 백업 복구 |
| 15:15 | 서비스 정상화 | 전체팀 | 상태 모니터링 |

## 근본 원인
- **직접 원인**: PostgreSQL 프로세스 메모리 부족으로 종료
- **근본 원인**: 느린 쿼리 누적으로 메모리 사용량 급증
- **기여 요인**: 인덱스 누락, 비효율적 쿼리

## 영향 분석
- **사용자**: 45분간 서비스 접근 불가
- **데이터**: 최근 30분 데이터 손실 (백업 시점 차이)
- **비즈니스**: 예산 승인 업무 지연

## 개선 계획
1. **즉시 조치** (1주일)
   - 문제 쿼리에 인덱스 추가
   - 메모리 설정 최적화
   - 모니터링 임계값 조정

2. **단기 개선** (1개월)
   - 쿼리 성능 자동 분석 도구 도입
   - 백업 주기 단축 (4시간 → 1시간)
   - 장애 대응 매뉴얼 업데이트

3. **장기 개선** (3개월)
   - 고가용성 구성 (복제 서버 구축)
   - 자동 페일오버 시스템 구축
   - 성능 모니터링 대시보드 구축

## 예방책
- 정기적인 성능 리뷰 (월 1회)
- 쿼리 성능 기준 수립
- 용량 계획 프로세스 정비

## 학습 사항
- 사전 모니터링의 중요성 재확인
- 백업/복구 절차 개선 필요
- 팀 간 커뮤니케이션 프로세스 개선
```

---

## 10. 추가 리소스 및 참고 자료

### 10.1 유용한 명령어 모음

```bash
# PostgreSQL 관련
sudo systemctl status postgresql          # 서비스 상태
sudo systemctl restart postgresql         # 서비스 재시작
sudo -u postgres psql                     # 슈퍼유저로 접속
pg_isready -h localhost -p 5432          # 연결 가능 여부 확인

# 로그 관련
tail -f /var/log/postgresql/postgresql-*.log    # 실시간 로그
journalctl -u postgresql -f                     # systemd 로그
grep ERROR /var/log/postgresql/postgresql-*.log # 에러 로그만

# 백업/복구
pg_dump -h localhost -U user db > backup.sql    # 백업
psql -h localhost -U user db < backup.sql       # 복구
pg_basebackup -D /backup/base -Ft -z -P         # 물리적 백업

# 성능 분석
pgbench -c 10 -T 60 recipt_production           # 벤치마크
explain analyze SELECT * FROM users LIMIT 10;    # 쿼리 분석
```

### 10.2 모니터링 도구

#### Prometheus + Grafana 설정 예시
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    scrape_interval: 30s
```

#### 핵심 메트릭
- **연결 수**: active_connections, idle_connections
- **쿼리 성능**: avg_query_time, slow_query_count
- **리소스**: cpu_usage, memory_usage, disk_io
- **에러율**: connection_errors, query_errors

### 10.3 관련 문서
- [데이터베이스 스키마 종합 문서](./schema-documentation.md)
- [마이그레이션 실행 가이드](./migration-guide.md)
- [API 데이터 모델](./api-data-models.md)

### 10.4 외부 참조
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [TypeORM 트러블슈팅](https://typeorm.io/troubleshooting)
- [PostgreSQL Wiki](https://wiki.postgresql.org/)
- [PostgreSQL 성능 튜닝 가이드](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**긴급 연락처**
- **기술팀장**: 010-0000-0000
- **DB 관리자**: 010-0000-0001  
- **DevOps 담당**: 010-0000-0002
- **비상 Slack**: #db-emergency

**문서 정보**
- **버전**: 1.0
- **작성일**: 2025-01-11
- **작성자**: Backend Development Team
- **검토자**: DevOps Team, Database Administrator
- **승인자**: Technical Lead
- **다음 검토 예정일**: 2025-02-11

---

> ⚠️ **주의사항**: 이 문서의 모든 명령어는 테스트 환경에서 먼저 검증한 후 프로덕션에 적용하시기 바랍니다.

> 🆘 **응급 상황**: 문제 해결이 어려운 경우 즉시 기술팀에 연락하고, 이 문서를 참조하여 상황을 설명해 주세요.