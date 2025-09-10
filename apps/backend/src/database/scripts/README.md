# 데이터베이스 자동화 스크립트 가이드

Task 2.12에서 개발된 데이터베이스 관리 및 자동화 스크립트들의 사용법을 안내합니다.

## 📁 스크립트 구성

```
src/database/scripts/
├── database-initializer.ts    # 데이터베이스 완전 초기화
├── bulk-data-generator.ts     # 대량 테스트 데이터 생성
├── backup-restore.ts          # 백업/복원 도구
├── database-utils.ts          # 데이터베이스 관리 유틸리티
├── index-optimization.ts      # 인덱스 최적화 및 생성
├── query-analyzer.ts          # 쿼리 성능 분석
├── INDEX_OPTIMIZATION.md      # 인덱스 최적화 가이드
└── README.md                  # 본 문서
```

## 🚀 스크립트 실행 방법

### 1. 데이터베이스 초기화

완전한 데이터베이스 초기화를 수행합니다.

```bash
# 기본 초기화 (시드 데이터 포함)
npm run db:init

# 완전 초기화 (기존 스키마 삭제 + 재생성 + 시드)
npm run db:init:clean
```

**수행 작업:**
- 스키마 동기화 (테이블 생성/수정)
- PostgreSQL 확장 활성화 (uuid-ossp, pgcrypto, pg_trgm)
- 기본 시드 데이터 실행
- 인덱스 최적화
- 데이터 무결성 검증

### 2. 대량 데이터 생성

성능 테스트나 개발용 대량 테스트 데이터를 생성합니다.

```bash
# 기본 대량 데이터 (사용자 1000명, 행사 200개, 영수증 5000개)
npm run bulk-data

# 소량 테스트 데이터 (사용자 100명, 행사 50개, 영수증 500개)
npm run bulk-data:small

# 대량 테스트 데이터 (사용자 5000명, 행사 1000개, 영수증 25000개)  
npm run bulk-data:large

# 커스텀 설정
npm run bulk-data -- --users=2000 --events=300 --receipts=10000 --years=2
```

**옵션:**
- `--users=N`: 생성할 사용자 수
- `--events=N`: 생성할 행사 수  
- `--receipts=N`: 생성할 영수증 수
- `--years=N`: 과거 몇 년까지 데이터 생성
- `--batch=N`: 배치 처리 크기

### 3. 백업 및 복원

데이터베이스 백업과 복원을 수행합니다.

```bash
# 전체 백업
npm run db:backup

# 스키마만 백업
npm run db:backup:schema

# 데이터만 백업
npm run db:backup:data

# 백업 목록 조회
npm run db:list-backups

# 백업 복원
npm run db:restore -- backup-file.sql

# 복원 옵션
npm run db:restore -- backup-file.sql --drop-existing --no-validate
```

**백업 옵션:**
- `--compress`: 백업 파일 압축
- `--encrypt`: 백업 파일 암호화
- `--keep-days=N`: 보존 일수 설정
- `--directory=PATH`: 백업 디렉토리 지정

**복원 옵션:**
- `--drop-existing`: 기존 데이터 삭제
- `--no-validate`: 복원 후 검증 생략
- `--no-backup`: 복원 전 백업 생략

### 4. 데이터베이스 관리 도구

데이터베이스 상태 모니터링 및 관리 기능을 제공합니다.

```bash
# 데이터베이스 상태 조회
npm run db:status

# 성능 통계 조회
npm run db:performance

# 데이터 정리 및 최적화
npm run db:cleanup

# 데이터 무결성 검증
npm run db:validate

# 개발 환경 완전 리셋
npm run db:reset-dev
```

### 5. 인덱스 최적화 및 성능 분석

**Task 2.13**에서 개발된 데이터베이스 성능 최적화 도구입니다.

```bash
# 종합 인덱스 최적화 실행
npm run db:optimize-indexes

# 종합 성능 분석 리포트 생성  
npm run db:analyze-performance

# 개별 분석 도구
npm run db:analyze-slow-queries    # 느린 쿼리 분석
npm run db:analyze-indexes         # 인덱스 효율성 분석
npm run db:analyze-tables          # 테이블 통계 분석
```

**최적화 기능:**
- **복합 인덱스**: 자주 함께 조회되는 컬럼 조합 최적화
- **부분 인덱스**: 조건부 인덱스로 저장공간 절약 및 성능 향상
- **전문 검색 인덱스**: GIN 인덱스를 활용한 텍스트 검색 최적화
- **인덱스 사용률 분석**: 기존 인덱스의 효율성 평가

**성능 분석:**
- **느린 쿼리 탐지**: pg_stat_statements 기반 병목 지점 식별
- **실행 계획 분석**: EXPLAIN ANALYZE를 통한 상세 분석
- **캐시 히트율 분석**: 메모리 사용 효율성 평가
- **테이블 최적화**: Dead tuple, VACUUM 상태 모니터링

자세한 내용은 [인덱스 최적화 가이드](./INDEX_OPTIMIZATION.md)를 참고하세요.

## 📊 기능별 상세 설명

### 데이터베이스 초기화 (`database-initializer.ts`)

**주요 기능:**
- 스키마 삭제/생성 자동화
- PostgreSQL 확장 기능 설정
- 복합 인덱스 생성 최적화
- 부분 인덱스 생성으로 성능 향상
- 데이터 무결성 검증

**최적화된 인덱스:**
```sql
-- 복합 인덱스
CREATE INDEX idx_events_org_date ON events(organization_id, start_date);
CREATE INDEX idx_receipts_settlement_status ON receipt_scans(settlement_id, processing_status);

-- 부분 인덱스  
CREATE INDEX idx_users_active_admin ON users(id) WHERE is_active = TRUE AND role = 'ADMIN';
CREATE INDEX idx_events_in_progress ON events(start_date) WHERE status IN ('PLANNING', 'IN_PROGRESS');
```

### 대량 데이터 생성 (`bulk-data-generator.ts`)

**특징:**
- 한국 로케일 기반 현실적인 데이터 생성
- 조직별 균등 분산 데이터 배치
- 시간별 분산으로 이력 데이터 생성
- OCR 처리 상태 시뮬레이션
- 배치 처리로 메모리 효율성 확보

**생성되는 데이터:**
- 사용자 및 조직 관계
- 다양한 타입의 행사 (수련회, 친교 모임, 예배 등)
- 예산/결산 데이터 (수입/지출 항목 포함)
- OCR 메타데이터를 포함한 영수증 스캔 데이터

### 백업/복원 (`backup-restore.ts`)

**백업 유형:**
- **full**: 스키마 + 데이터 전체 백업
- **schema**: 테이블 구조만 백업
- **data**: 데이터만 백업

**보안 기능:**
- 백업 파일 압축 지원 (gzip)
- 백업 파일 암호화 지원 (AES-256-CBC)
- 백업 파일 보존 정책 (자동 정리)

**복원 안전장치:**
- 복원 전 현재 DB 백업 생성
- 복원 후 데이터 무결성 검증
- 복원 실패 시 롤백 지원

### 데이터베이스 관리 도구 (`database-utils.ts`)

**모니터링 기능:**
- 실시간 연결 상태 및 통계
- 테이블별 데이터 현황
- 데이터베이스 크기 분석
- 성능 통계 (캐시 적중률, 인덱스 사용률)

**최적화 기능:**
- 만료된 토큰/로그 자동 정리
- VACUUM ANALYZE 자동 실행
- 테이블 통계 업데이트

**개발 지원:**
- 개발 환경 완전 리셋
- 테스트 데이터 자동 생성
- 안전장치를 통한 실수 방지

## 🛡️ 보안 및 안전 조치

### 1. 데이터 보호
- 중요 작업 전 자동 백업 생성
- 확인 프롬프트를 통한 실수 방지
- 암호화 백업 지원 (환경변수: `BACKUP_ENCRYPTION_PASSWORD`)

### 2. 권한 관리
- 개발/운영 환경 구분
- PostgreSQL 권한 기반 접근 제어
- 비밀번호 환경변수 관리 (`PGPASSWORD`)

### 3. 오류 처리
- 트랜잭션 기반 작업으로 데이터 일관성 보장
- 상세한 오류 로깅 및 복구 가이드
- Graceful Degradation으로 부분 실패 대응

## 🚨 주의사항

### 운영 환경 사용 시
1. **백업 필수**: 모든 작업 전 백업 생성
2. **점검 시간**: 대량 데이터 작업은 점검 시간 활용
3. **리소스 모니터링**: CPU/메모리 사용량 확인
4. **단계별 검증**: 각 단계별 결과 검증

### 성능 고려사항
- 대량 데이터 생성 시 배치 크기 조정 (`--batch` 옵션)
- 백업 파일 압축으로 저장 공간 절약
- 인덱스 재구성 후 통계 업데이트 필수

## 📈 모니터링 및 로그

모든 스크립트는 상세한 실행 로그를 제공합니다:

```
🚀 데이터베이스 초기화 시작...
📡 데이터베이스 연결 중...
✅ 데이터베이스 연결 성공
🔄 스키마 동기화 중...
✅ 스키마 동기화 완료
🔧 데이터베이스 확장 설정 중...
   ✅ UUID 확장 활성화
   ✅ 암호화 확장 활성화
🌱 기본 시드 데이터 실행 중...
🔍 인덱스 최적화 중...
🔍 데이터 무결성 검증 중...
🎉 데이터베이스 초기화 완료!
⏱️  총 소요 시간: 45.23초
```

## 🔧 문제 해결

### 일반적인 오류
1. **연결 오류**: `.env` 파일의 DB 설정 확인
2. **권한 오류**: PostgreSQL 사용자 권한 확인  
3. **메모리 부족**: 배치 크기 감소 또는 시스템 메모리 확인
4. **디스크 공간 부족**: 백업 파일 정리 또는 디스크 공간 확보

### 복구 방법
1. **초기화 실패**: 백업에서 복원 후 재시도
2. **데이터 오류**: `npm run db:validate`로 문제점 파악
3. **성능 저하**: `npm run db:cleanup`으로 최적화
4. **개발 환경 문제**: `npm run db:reset-dev`로 완전 리셋

---

**개발팀 문의**: 광남동성당 청소년위원회 개발팀  
**문서 버전**: 1.1.0 (Task 2.12 + Task 2.13)  
**최종 업데이트**: 2024년 1월  
**추가 기능**: 인덱스 최적화 및 쿼리 성능 분석 (Task 2.13)