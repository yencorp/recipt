# 데이터베이스 인덱스 최적화 가이드

## 개요

Task 2.13의 일환으로 구현된 데이터베이스 인덱스 최적화 및 쿼리 성능 분석 시스템입니다. PostgreSQL 데이터베이스의 성능을 향상시키기 위한 종합적인 최적화 방안을 제공합니다.

## 주요 기능

### 1. 인덱스 최적화 (index-optimization.ts)
- **복합 인덱스**: 자주 함께 조회되는 컬럼들의 조합 인덱스
- **부분 인덱스**: 조건부 인덱스로 저장공간 절약 및 성능 향상
- **전문 검색 인덱스**: GIN 인덱스를 활용한 텍스트 검색 최적화
- **인덱스 사용률 분석**: 기존 인덱스의 효율성 평가

### 2. 쿼리 성능 분석 (query-analyzer.ts)
- **느린 쿼리 탐지**: pg_stat_statements를 활용한 성능 병목 식별
- **실행 계획 분석**: EXPLAIN ANALYZE를 통한 상세 성능 분석
- **인덱스 효율성 분석**: 인덱스 사용률 및 효과성 평가
- **테이블 통계 분석**: 테이블 크기, Dead tuple, VACUUM 상태 점검

## 사용법

### 기본 명령어

```bash
# 종합 인덱스 최적화 실행
npm run db:optimize-indexes

# 종합 성능 분석 리포트 생성
npm run db:analyze-performance

# 개별 분석 실행
npm run db:analyze-slow-queries    # 느린 쿼리 분석
npm run db:analyze-indexes         # 인덱스 효율성 분석
npm run db:analyze-tables          # 테이블 통계 분석
```

### 애플리케이션에서 사용

```typescript
import { DataSource } from 'typeorm';
import { optimizeIndexes } from './database/scripts/index-optimization';
import { generatePerformanceReport } from './database/scripts/query-analyzer';

// 인덱스 최적화 실행
await optimizeIndexes(dataSource);

// 성능 분석 리포트 생성
await generatePerformanceReport(dataSource);
```

## 생성되는 인덱스

### 복합 인덱스 (Composite Indexes)

| 인덱스 명 | 테이블 | 컬럼 | 목적 |
|----------|--------|------|------|
| `idx_events_org_date_range` | events | organization_id, start_date, end_date | 조직별 날짜 범위 조회 |
| `idx_events_org_status` | events | organization_id, status, start_date | 조직별 상태 조회 |
| `idx_settlements_org_period` | settlements | organization_id, settlement_year, settlement_month | 조직별 결산 기간 조회 |
| `idx_settlement_items_settlement_type` | settlement_items | settlement_id, type, actual_amount | 결산별 수입/지출 집계 |
| `idx_receipt_scans_org_date` | receipt_scans | organization_id, receipt_date, status | 조직별 영수증 날짜 조회 |

### 부분 인덱스 (Partial Indexes)

| 인덱스 명 | 테이블 | 컬럼 | 조건 | 목적 |
|----------|--------|------|------|------|
| `idx_users_active_email` | users | email | status='ACTIVE' AND is_active=true | 활성 사용자 이메일 검색 |
| `idx_events_current_year` | events | start_date, organization_id | start_date >= CURRENT_DATE - INTERVAL '1 year' | 최근 1년 이벤트 |
| `idx_receipt_scans_pending` | receipt_scans | uploaded_at, organization_id | processing_status IN ('PENDING', 'IN_QUEUE') | 처리 대기 영수증 |
| `idx_settlement_items_needs_validation` | settlement_items | settlement_id, actual_amount | is_validated=false AND status='PENDING' | 검증 필요 항목 |

### 전문 검색 인덱스 (GIN Indexes)

| 인덱스 명 | 테이블 | 컬럼 | 목적 |
|----------|--------|------|------|
| `idx_events_title_gin` | events | title | 이벤트 제목 유사 검색 |
| `idx_receipt_scans_vendor_gin` | receipt_scans | vendor_name | 업체명 유사 검색 |
| `idx_settlement_items_name_gin` | settlement_items | item_name | 항목명 유사 검색 |
| `idx_users_name_gin` | users | name | 사용자명 유사 검색 |

## 성능 최적화 전략

### 1. 쿼리 패턴 분석
- **복합 조건**: WHERE절에서 자주 함께 사용되는 컬럼들 식별
- **정렬 기준**: ORDER BY절에서 사용되는 컬럼들 최적화
- **조인 조건**: 테이블 간 조인에 사용되는 외래키 최적화
- **집계 쿼리**: GROUP BY, COUNT, SUM 등에 사용되는 컬럼들 최적화

### 2. 인덱스 전략
- **선택도**: 고유값이 많은 컬럼을 인덱스 앞쪽에 배치
- **카디널리티**: 데이터 분포를 고려한 인덱스 구성
- **부분 인덱스**: 전체 데이터의 일부만 자주 조회되는 경우 활용
- **커버링 인덱스**: 인덱스만으로 쿼리를 처리할 수 있도록 구성

### 3. 유지보수 전략
- **정기 분석**: 월 1회 인덱스 사용률 및 성능 분석
- **사용하지 않는 인덱스 제거**: 저장공간 절약 및 INSERT 성능 향상
- **통계 업데이트**: ANALYZE 명령으로 쿼리 플래너가 최적의 실행계획 수립
- **VACUUM**: Dead tuple 정리로 테이블 크기 최적화

## 모니터링 및 분석

### 1. 성능 지표

#### 쿼리 성능
- **평균 실행 시간**: 1초 미만 목표
- **최대 실행 시간**: 5초 미만 목표  
- **캐시 히트율**: 95% 이상 목표
- **인덱스 사용률**: 주요 쿼리의 80% 이상 인덱스 활용

#### 인덱스 효율성
- **스캔 횟수**: 생성 후 일정 기간 내 사용 확인
- **크기 대비 사용률**: 큰 인덱스는 높은 사용률 필요
- **튜플 읽기/페치 비율**: 인덱스 선택도 평가

#### 테이블 상태
- **Dead tuple 비율**: 20% 미만 유지
- **인덱스 크기 비율**: 테이블 크기의 100% 미만 권장
- **평균 행 크기**: 예상 범위 내 유지

### 2. 알림 기준

#### 경고 (Warning)
- 평균 실행 시간 > 500ms
- 캐시 히트율 < 90%
- Dead tuple 비율 > 10%
- 사용되지 않는 인덱스 발견

#### 위험 (Critical)  
- 평균 실행 시간 > 1초
- 캐시 히트율 < 85%
- Dead tuple 비율 > 20%
- 인덱스 크기가 테이블 크기의 2배 초과

## 전제 조건

### PostgreSQL 확장 기능
```sql
-- 전문 검색을 위한 확장
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 쿼리 통계를 위한 확장 (선택사항)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### 설정 권장사항
```sql
-- postgresql.conf 설정
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 1000
pg_stat_statements.track = all
```

## 트러블슈팅

### 자주 발생하는 문제

#### 1. 인덱스 생성 실패
```
ERROR: could not create unique index "idx_name"
DETAIL: Key (column)=(value) is duplicated.
```
**해결방법**: 중복 데이터를 정리한 후 인덱스 생성

#### 2. CONCURRENTLY 옵션 실패
```
ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block
```
**해결방법**: 트랜잭션 외부에서 인덱스 생성 또는 CONCURRENTLY 옵션 제거

#### 3. pg_trgm 확장 없음
```
ERROR: extension "pg_trgm" does not exist
```
**해결방법**: 
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-contrib

# CentOS/RHEL  
sudo yum install postgresql-contrib
```

#### 4. 권한 부족
```
ERROR: permission denied for relation pg_stat_statements
```
**해결방법**: 데이터베이스 관리자 권한으로 실행

### 성능 문제 해결

#### 느린 쿼리 해결 절차
1. **EXPLAIN ANALYZE**로 실행 계획 확인
2. **Sequential Scan** 발생 시 적절한 인덱스 추가
3. **Nested Loop** 비효율 시 조인 조건 최적화
4. **Sort** 작업이 많을 시 ORDER BY 컬럼 인덱스 추가

#### 인덱스 효율성 개선
1. **사용되지 않는 인덱스 제거**
2. **중복 기능 인덱스 통합**
3. **복합 인덱스에서 컬럼 순서 최적화**
4. **부분 인덱스로 크기 최적화**

## 정기 유지보수

### 일일 작업
- 성능 지표 모니터링
- 오류 로그 확인

### 주간 작업  
- 느린 쿼리 분석 및 최적화
- 인덱스 사용률 점검

### 월간 작업
- 종합 성능 분석 리포트 생성
- 사용하지 않는 인덱스 정리
- 테이블 통계 업데이트 (ANALYZE)
- VACUUM 작업 점검

### 분기 작업
- 인덱스 전략 재검토
- 새로운 최적화 기회 식별
- 성능 기준선 업데이트

## 참고 자료

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Query Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [pg_stat_statements Documentation](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [Full Text Search in PostgreSQL](https://www.postgresql.org/docs/current/textsearch.html)

## 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0.0 | 2024-01-15 | 초기 인덱스 최적화 시스템 구축 |
| 1.1.0 | 2024-01-20 | 성능 분석 리포트 기능 추가 |
| 1.2.0 | 2024-01-25 | 자동 모니터링 및 알림 시스템 추가 |