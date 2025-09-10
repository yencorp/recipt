# 데이터베이스 마이그레이션 실행 가이드

## 개요

본 문서는 광남동성당 청소년위원회 예결산 관리 시스템의 데이터베이스 마이그레이션을 안전하고 올바르게 실행하기 위한 종합 가이드입니다.

**적용 대상**:
- 백엔드 개발자
- DevOps 엔지니어  
- 시스템 관리자

**기술 스택**:
- PostgreSQL 15+
- TypeORM 0.3+
- Node.js + TypeScript

**문서 작성일**: 2025년 1월 11일  
**마이그레이션 버전**: v1.0 (Task 2.15 완료 기준)

---

## 1. 마이그레이션 시스템 이해

### 1.1 TypeORM 마이그레이션 개념

**마이그레이션이란?**
- 데이터베이스 스키마의 변경사항을 순차적으로 적용하는 방법
- 버전 관리를 통해 데이터베이스 상태를 추적
- 팀 협업 시 스키마 동기화 보장

**주요 특징**:
- **순차 실행**: 타임스탬프 순서대로 실행
- **상태 추적**: `typeorm_migrations` 테이블에 실행 이력 저장
- **롤백 지원**: down 메서드로 변경사항 되돌리기 가능
- **환경별 적용**: 개발/테스트/프로덕션 환경 독립 실행

### 1.2 현재 마이그레이션 현황

#### 적용 완료된 마이그레이션 (13개)
```
1. 1757331860358-CreateUsersTable.ts
2. 1757332045857-CreateOrganizationsTable.ts  
3. 1757332257934-CreateUserOrganizationsTable.ts
4. 1757332260435-CreateEventsTable.ts
5. 1757332263014-CreateBudgetsTable.ts
6. 1757332265611-CreateBudgetIncomesTable.ts
7. 1757332277135-CreateBudgetExpensesTable.ts
8. 1757332280000-CreateSettlementsTable.ts
9. 1757332285000-CreateSettlementItemsTable.ts
10. 1757332290000-CreateAuditTrailsTable.ts
11. 1757332295000-CreateReceiptScansTable.ts
12. 1757332300000-CreateOcrResultsTable.ts  
13. 1757332305000-CreateReceiptValidationsTable.ts
```

#### 디렉토리 구조
```
apps/backend/
├── src/
│   ├── database/
│   │   ├── data-source.ts           # 데이터소스 설정
│   │   ├── database.service.ts      # 데이터베이스 서비스
│   │   └── migrations/              # 마이그레이션 파일들
│   └── entities/                    # Entity 클래스들
├── .env.development                 # 개발환경 설정
├── .env.test                       # 테스트환경 설정  
├── .env.production                 # 프로덕션환경 설정
└── package.json                    # npm 스크립트
```

---

## 2. 환경 설정 및 준비

### 2.1 환경 변수 설정

#### 개발 환경 (.env.development)
```bash
# 데이터베이스 연결
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=recipt_dev
DB_PASSWORD=dev_password_2025
DB_NAME=recipt_development
DB_SCHEMA=public

# TypeORM 설정
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=true
TYPEORM_MIGRATIONS_RUN=true
```

#### 테스트 환경 (.env.test)
```bash
# 데이터베이스 연결
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=recipt_test
DB_PASSWORD=test_password_2025
DB_NAME=recipt_test
DB_SCHEMA=public

# TypeORM 설정
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=false
TYPEORM_MIGRATIONS_RUN=true
TYPEORM_DROP_SCHEMA=true    # 테스트 시작 전 스키마 초기화
```

#### 프로덕션 환경 (.env.production)
```bash
# 데이터베이스 연결
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_USERNAME=recipt_prod
DB_PASSWORD=${DB_PASSWORD}  # 환경 변수에서 주입
DB_NAME=recipt_production
DB_SCHEMA=public

# TypeORM 설정
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=false
TYPEORM_MIGRATIONS_RUN=false  # 수동 실행
```

### 2.2 필수 권한 확인

#### 데이터베이스 사용자 권한
```sql
-- 개발/테스트 환경
GRANT ALL PRIVILEGES ON DATABASE recipt_development TO recipt_dev;
GRANT ALL PRIVILEGES ON DATABASE recipt_test TO recipt_test;

-- 프로덕션 환경 (최소 권한)
GRANT CONNECT ON DATABASE recipt_production TO recipt_prod;
GRANT USAGE ON SCHEMA public TO recipt_prod;
GRANT CREATE ON SCHEMA public TO recipt_prod;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO recipt_prod;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO recipt_prod;
```

### 2.3 PostgreSQL 확장 설치

```sql
-- 필수 확장 프로그램 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID 생성
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- 암호화
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- 전문 검색
```

---

## 3. 마이그레이션 실행 절차

### 3.1 사전 점검 체크리스트

#### ✅ 실행 전 필수 확인사항

**환경 점검**
- [ ] 올바른 환경 변수 파일 로드 확인
- [ ] 데이터베이스 연결 테스트 성공
- [ ] 백업 완료 (프로덕션 환경)
- [ ] 충분한 디스크 공간 (최소 2GB)
- [ ] 네트워크 연결 안정성 확인

**코드 점검**  
- [ ] 최신 코드 pull 완료
- [ ] 마이그레이션 파일 존재 확인
- [ ] 의존성 패키지 설치 완료 (`npm install`)
- [ ] TypeScript 컴파일 성공 (`npm run build`)

**권한 점검**
- [ ] 데이터베이스 연결 권한 확인
- [ ] 테이블 생성/수정/삭제 권한 확인
- [ ] 시스템 테이블 접근 권한 확인

### 3.2 개발 환경 실행

#### Step 1: 환경 설정
```bash
# 개발 환경으로 설정
export NODE_ENV=development

# 또는 .env.development 파일 사용
cp .env.development .env
```

#### Step 2: 마이그레이션 상태 확인
```bash
# 현재 마이그레이션 상태 확인
npm run migration:show

# 결과 예시:
# [X] CreateUsersTable1757331860358
# [X] CreateOrganizationsTable1757332045857  
# [ ] NewMigration1757400000000
```

#### Step 3: 마이그레이션 실행
```bash
# 모든 pending 마이그레이션 실행
npm run migration:run

# 성공 시 출력:
# Migration CreateUsersTable1757331860358 has been executed successfully.
# Migration CreateOrganizationsTable1757332045857 has been executed successfully.
```

#### Step 4: 실행 결과 확인
```bash
# 다시 상태 확인
npm run migration:show

# 데이터베이스에서 직접 확인
psql -h localhost -U recipt_dev -d recipt_development -c "
SELECT * FROM typeorm_migrations ORDER BY timestamp;
"
```

### 3.3 테스트 환경 실행

#### Step 1: 테스트 데이터베이스 초기화
```bash
# 테스트 환경 설정
export NODE_ENV=test

# 기존 테스트 데이터 정리
npm run test:db:reset

# 마이그레이션 실행
npm run migration:run

# 시드 데이터 삽입
npm run seed
```

#### Step 2: 테스트 실행으로 검증
```bash
# 데이터베이스 관련 테스트 실행
npm run test:e2e

# 특정 모듈 테스트
npm run test -- --testNamePattern="Migration"
```

### 3.4 프로덕션 환경 실행

#### Step 1: 사전 백업 (필수)
```bash
# 데이터베이스 전체 백업
pg_dump -h prod-db.example.com -U recipt_prod -d recipt_production \
  --verbose --clean --no-owner --no-privileges \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# 백업 파일 압축
gzip backup_$(date +%Y%m%d_%H%M%S).sql

# 백업 파일 안전한 위치로 이동
mv backup_*.sql.gz /backup/database/
```

#### Step 2: 점검 모드 실행
```bash
# 프로덕션 환경 설정
export NODE_ENV=production

# 마이그레이션 상태만 확인 (실행하지 않음)
npm run migration:show

# 실행될 마이그레이션 미리 확인
npm run migration:show -- --check-only
```

#### Step 3: 실제 실행
```bash
# ⚠️ 중요: 점검 완료 후에만 실행
npm run migration:run

# 실행 로그 저장
npm run migration:run 2>&1 | tee migration_$(date +%Y%m%d_%H%M%S).log
```

#### Step 4: 실행 후 검증
```bash
# 마이그레이션 완료 확인
npm run migration:show

# 기본 데이터 조회 테스트
psql -h prod-db.example.com -U recipt_prod -d recipt_production -c "
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
"

# 애플리케이션 헬스 체크
curl -f http://localhost:3000/health/database || echo "❌ Database health check failed"
```

---

## 4. 마이그레이션 롤백

### 4.1 롤백 시나리오

#### 언제 롤백이 필요한가?
- 마이그레이션 실행 중 오류 발생
- 새로운 스키마로 인한 애플리케이션 오류
- 성능 문제 발생
- 데이터 무결성 문제 발견

### 4.2 롤백 실행

#### Step 1: 현재 상태 확인
```bash
# 현재 적용된 마이그레이션 확인
npm run migration:show

# 최근 마이그레이션 확인
psql -d recipt_production -c "
SELECT * FROM typeorm_migrations 
ORDER BY timestamp DESC LIMIT 5;
"
```

#### Step 2: 개별 마이그레이션 롤백
```bash
# 최신 마이그레이션 1개 롤백
npm run migration:revert

# 특정 마이그레이션까지 롤백 (타임스탬프 지정)
npm run migration:revert -- --to=1757332260435
```

#### Step 3: 롤백 검증
```bash
# 롤백 완료 확인
npm run migration:show

# 테이블 구조 확인
psql -d recipt_production -c "
\dt public.*
"

# 애플리케이션 동작 확인
npm run test:e2e
```

### 4.3 응급 복구

#### 전체 데이터베이스 복구
```bash
# 애플리케이션 중지
sudo systemctl stop recipt-backend

# 데이터베이스 복원
psql -h prod-db.example.com -U recipt_prod -d recipt_production \
  < backup_20250111_143000.sql

# 애플리케이션 재시작
sudo systemctl start recipt-backend

# 복구 확인
curl -f http://localhost:3000/health
```

---

## 5. 새로운 마이그레이션 생성

### 5.1 마이그레이션 생성 명령

```bash
# 새 마이그레이션 생성 (타임스탬프 자동 생성)
npm run migration:generate -- --name=AddUserProfileTable

# 빈 마이그레이션 생성 (수동 작성용)
npm run migration:create -- --name=CustomDataUpdate
```

### 5.2 마이그레이션 파일 작성 가이드

#### 기본 템플릿
```typescript
import { MigrationInterface, QueryRunner } from "typeorm"

export class AddUserProfileTable1757400000000 implements MigrationInterface {
    name = 'AddUserProfileTable1757400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 스키마 변경 사항 (Forward)
        await queryRunner.query(`
            CREATE TABLE "user_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "user_id" uuid NOT NULL, 
                "avatar_url" character varying(255), 
                "bio" text, 
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
                CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id"),
                CONSTRAINT "FK_user_profiles_user_id" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_user_profiles_user_id" 
            ON "user_profiles" ("user_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 변경 사항 되돌리기 (Backward)
        await queryRunner.query(`DROP INDEX "IDX_user_profiles_user_id"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
    }
}
```

### 5.3 마이그레이션 작성 베스트 프랙티스

#### DO ✅
- **원자성 보장**: 하나의 마이그레이션은 하나의 논리적 변경만 포함
- **롤백 고려**: 항상 down 메서드 구현
- **데이터 검증**: 데이터 변경 후 검증 쿼리 포함
- **인덱스 최적화**: 대용량 테이블은 인덱스 생성 시간 고려
- **명확한 이름**: 마이그레이션 이름을 명확하게 작성

```typescript
// 좋은 예시: 데이터 검증 포함
public async up(queryRunner: QueryRunner): Promise<void> {
    // 컬럼 추가
    await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "email_verified" boolean DEFAULT false
    `);
    
    // 기존 사용자 검증 상태 업데이트
    await queryRunner.query(`
        UPDATE "users" 
        SET "email_verified" = true 
        WHERE "created_at" < NOW() - INTERVAL '30 days'
    `);
    
    // 검증: NULL 값이 없는지 확인
    const result = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM "users" 
        WHERE "email_verified" IS NULL
    `);
    
    if (result[0].count > 0) {
        throw new Error('마이그레이션 실패: email_verified에 NULL 값이 존재합니다.');
    }
}
```

#### DON'T ❌
- **대용량 데이터 직접 처리**: 대용량 UPDATE/DELETE 직접 실행 금지
- **동기화 의존**: synchronize 옵션에 의존하지 않기
- **프로덕션 데이터 직접 수정**: 백업 없이 프로덕션 데이터 변경 금지
- **복잡한 로직 포함**: 비즈니스 로직을 마이그레이션에 포함 금지

```typescript
// 나쁜 예시: 복잡한 로직과 대용량 처리
public async up(queryRunner: QueryRunner): Promise<void> {
    // ❌ 복잡한 비즈니스 로직 포함
    const users = await queryRunner.query(`SELECT * FROM users`);
    
    for (const user of users) {
        // ❌ 대용량 데이터 반복 처리
        await queryRunner.query(`
            INSERT INTO user_profiles (user_id, bio) 
            VALUES ('${user.id}', '자동 생성된 프로필')
        `);
    }
}
```

---

## 6. 문제 해결 및 트러블슈팅

### 6.1 일반적인 오류 및 해결

#### 연결 오류
```bash
# 오류: connection refused
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**해결 방법**:
1. PostgreSQL 서비스 상태 확인: `sudo systemctl status postgresql`
2. 포트 확인: `netstat -an | grep 5432`
3. 방화벽 설정 확인: `sudo ufw status`
4. 환경변수 확인: `echo $DB_HOST $DB_PORT`

#### 권한 오류
```bash
# 오류: permission denied
Error: permission denied for table users
```

**해결 방법**:
```sql
-- 권한 부여
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO recipt_dev;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO recipt_dev;

-- 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO recipt_dev;
```

#### 마이그레이션 중복 실행 오류
```bash
# 오류: Migration already exists
QueryFailedError: duplicate key value violates unique constraint
```

**해결 방법**:
```sql
-- 마이그레이션 테이블에서 중복 항목 제거
DELETE FROM typeorm_migrations 
WHERE timestamp = '1757332260435' 
AND name = 'CreateEventsTable1757332260435';

-- 테이블이 존재한다면 DROP 후 재실행
DROP TABLE IF EXISTS events CASCADE;
```

### 6.2 데이터 무결성 검사

#### 외래키 제약조건 확인
```sql
-- 외래키 제약조건 위반 확인
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE contype = 'f' AND NOT convalidated;

-- 고아 레코드 확인
SELECT u.id, u.name 
FROM user_organizations uo
LEFT JOIN users u ON uo.user_id = u.id
WHERE u.id IS NULL;
```

#### 데이터 타입 검증
```sql
-- 날짜 형식 검증
SELECT id, birth_date 
FROM users 
WHERE birth_date IS NOT NULL 
  AND birth_date::text !~ '^\d{4}-\d{2}-\d{2}$';

-- 이메일 형식 검증
SELECT id, email 
FROM users 
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
```

### 6.3 성능 문제 해결

#### 마이그레이션 속도 최적화
```typescript
// 대용량 테이블 인덱스 생성 시
public async up(queryRunner: QueryRunner): Promise<void> {
    // 동시 실행으로 락 최소화
    await queryRunner.query(`
        CREATE INDEX CONCURRENTLY "idx_users_email" 
        ON "users" ("email")
    `);
}
```

#### 락 문제 방지
```sql
-- 현재 락 상태 확인
SELECT 
    l.mode,
    l.locktype,
    l.database,
    l.relation,
    l.page,
    l.tuple,
    l.classid,
    l.granted,
    l.objid,
    l.objsubid,
    l.pid,
    l.virtualtransaction,
    l.virtualxid,
    l.transactionid
FROM pg_locks l
LEFT JOIN pg_class t ON l.relation = t.oid
LEFT JOIN pg_database d ON l.database = d.oid;

-- 오래 실행되는 쿼리 확인
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 minutes';
```

---

## 7. 모니터링 및 로깅

### 7.1 마이그레이션 로그 관리

#### 로그 설정
```typescript
// data-source.ts
export const AppDataSource = new DataSource({
    // ... 다른 설정
    logging: process.env.NODE_ENV === 'production' ? ['error', 'migration'] : true,
    logger: 'file',
    maxQueryExecutionTime: 30000, // 30초 초과 쿼리 로깅
});
```

#### 로그 파일 위치
```
logs/
├── migration-2025-01-11.log      # 마이그레이션 로그
├── typeorm-2025-01-11.log        # TypeORM 쿼리 로그  
├── error-2025-01-11.log          # 에러 로그
└── application.log               # 전체 애플리케이션 로그
```

### 7.2 성능 모니터링

#### 마이그레이션 실행 시간 측정
```typescript
export class CreateUsersTable1757331860358 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const startTime = Date.now();
        
        // 마이그레이션 실행
        await queryRunner.query(`CREATE TABLE users (...)`);
        
        const executionTime = Date.now() - startTime;
        console.log(`Migration executed in ${executionTime}ms`);
        
        // 실행 시간이 1분 초과 시 경고
        if (executionTime > 60000) {
            console.warn(`⚠️ Long running migration: ${executionTime}ms`);
        }
    }
}
```

### 7.3 알림 시스템

#### Slack 알림 (선택사항)
```bash
# 마이그레이션 완료 알림
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"✅ Database migration completed successfully on PRODUCTION"}' \
https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# 마이그레이션 실패 알림
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"❌ Database migration FAILED on PRODUCTION - Check logs immediately"}' \
https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

---

## 8. 환경별 배포 전략

### 8.1 개발 환경
- **자동 실행**: 서버 시작 시 자동으로 마이그레이션 실행
- **빠른 복구**: 언제든지 데이터베이스 리셋 가능
- **자유로운 실험**: 새로운 마이그레이션 자유롭게 테스트

### 8.2 스테이징 환경
- **프로덕션 미러링**: 프로덕션 환경과 동일한 절차 적용
- **사전 검증**: 프로덕션 배포 전 최종 검증
- **자동 테스트**: CI/CD 파이프라인에서 자동 실행

### 8.3 프로덕션 환경
- **수동 실행**: 반드시 수동으로 승인 후 실행
- **백업 필수**: 실행 전 반드시 전체 백업
- **점진적 배포**: Blue-Green 또는 Rolling 배포 전략
- **모니터링**: 실행 중/후 시스템 모니터링 강화

---

## 9. 체크리스트 및 템플릿

### 9.1 마이그레이션 실행 체크리스트

#### 사전 점검 ✅
- [ ] 코드 리뷰 완료
- [ ] 로컬 환경 테스트 완료  
- [ ] 스테이징 환경 테스트 완료
- [ ] 롤백 계획 수립
- [ ] 백업 완료 (프로덕션)
- [ ] 팀원 알림 완료
- [ ] 점검 시간 확보

#### 실행 중 ✅
- [ ] 마이그레이션 상태 확인
- [ ] 실행 로그 모니터링
- [ ] 에러 발생 시 즉시 중단
- [ ] 실행 시간 모니터링

#### 실행 후 ✅
- [ ] 마이그레이션 완료 확인
- [ ] 데이터 무결성 검증
- [ ] 애플리케이션 헬스 체크
- [ ] 성능 모니터링
- [ ] 팀원 완료 알림

### 9.2 커밋 메시지 템플릿

```
feat(database): 사용자 프로필 테이블 추가

- user_profiles 테이블 생성
- users 테이블과 1:1 관계 설정  
- 프로필 이미지 및 소개글 컬럼 추가
- 관련 인덱스 생성

Migration: 1757400000000-AddUserProfileTable
Breaking Change: No
Rollback: Available

Co-Authored-By: Database Team <db-team@example.com>
```

---

## 10. 참고 자료

### 10.1 관련 문서
- [데이터베이스 스키마 종합 문서](./schema-documentation.md)
- [트러블슈팅 가이드](./troubleshooting.md)
- [API 데이터 모델](./api-data-models.md)

### 10.2 외부 리소스
- [TypeORM Migration Documentation](https://typeorm.io/migrations)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
- [Database Migration Best Practices](https://martinfowler.com/articles/evodb.html)

### 10.3 유용한 명령어 모음

```bash
# 마이그레이션 관련
npm run migration:show          # 마이그레이션 상태 확인
npm run migration:run           # 마이그레이션 실행
npm run migration:revert        # 최신 마이그레이션 롤백
npm run migration:generate      # 새 마이그레이션 생성
npm run migration:create        # 빈 마이그레이션 생성

# 데이터베이스 관련
npm run db:create              # 데이터베이스 생성
npm run db:drop                # 데이터베이스 삭제
npm run db:reset               # 데이터베이스 리셋
npm run seed                   # 시드 데이터 삽입

# 백업/복구 관련
pg_dump -U user db_name > backup.sql     # 백업
psql -U user db_name < backup.sql        # 복구
```

---

## 11. 응급 상황 대응

### 11.1 응급 연락망
- **기술팀장**: [전화번호]
- **DB 관리자**: [전화번호]  
- **DevOps 담당**: [전화번호]
- **비상 Slack 채널**: #db-emergency

### 11.2 응급 복구 절차
1. **즉시 대응** (5분 이내)
   - 서비스 중단 여부 확인
   - 에러 로그 확인 및 저장
   - 기술팀 비상 연락

2. **상황 분석** (15분 이내)  
   - 원인 파악 및 영향 범위 확인
   - 롤백 가능성 검토
   - 복구 시간 예상

3. **복구 실행** (30분 이내)
   - 롤백 또는 핫픽스 적용
   - 데이터 무결성 검증
   - 서비스 정상화 확인

4. **사후 분석** (24시간 이내)
   - 근본 원인 분석
   - 재발 방지 대책 수립
   - 문서 업데이트

---

**문서 정보**
- **버전**: 1.0
- **작성일**: 2025-01-11
- **작성자**: Backend Development Team  
- **검토자**: Database Administrator, DevOps Team
- **승인자**: Technical Lead
- **다음 검토 예정일**: 2025-02-11

**긴급 상황 시 연락처**: [기술팀 비상 연락망]