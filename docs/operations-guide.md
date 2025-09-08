# 운영 가이드 (Operations Guide)
## 광남동성당 청소년위원회 예결산 관리 시스템

---

## 📋 문서 개요

**작성자**: Claude Code SuperClaude Framework  
**작성일**: 2025-09-08  
**대상 독자**: 시스템 운영자, DevOps 엔지니어, 인프라 관리자  
**문서 버전**: v1.0  

### 🎯 목적
- 프로덕션 환경에서의 시스템 운영 가이드 제공
- 모니터링, 배포, 백업, 장애 대응 절차 정의
- 시스템 유지보수 및 성능 최적화 방안 제시

---

## 🏗️ 시스템 아키텍처 개요

### 서비스 구성
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   OCR Service   │
│   (React+Vite)  │────│   (NestJS)      │────│   (FastAPI)     │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 8001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐
         │   PostgreSQL    │    │   Redis         │
         │   Port: 5432    │    │   Port: 6379    │
         └─────────────────┘    └─────────────────┘
```

### 핵심 기술 스택
- **Frontend**: React 19 + Vite 7.1 + TypeScript
- **Backend**: NestJS + TypeScript + Node.js
- **OCR Service**: FastAPI + Python 3.11 + Tesseract 5.5.0
- **Database**: PostgreSQL 15.14
- **Cache**: Redis 7
- **Container**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

---

## 🚀 프로덕션 배포

### 배포 전 체크리스트
- [ ] **코드 품질 검증**: 모든 테스트 통과 확인
- [ ] **보안 스캔**: 취약점 검사 완료
- [ ] **환경 변수**: 프로덕션 환경 변수 설정
- [ ] **데이터베이스**: 마이그레이션 스크립트 준비
- [ ] **백업**: 현재 운영 데이터 백업 완료

### 프로덕션 배포 절차

#### 1. 환경 준비
```bash
# 프로덕션 환경 변수 설정
cp .env.production.template .env.production
nano .env.production

# Docker 이미지 빌드 (현재 이슈: 프로덕션 빌드 실패)
# ⚠️ 알려진 이슈: Frontend Dockerfile.prod에서 npm ci 실패
# 해결 방안: Task 5.4에서 최적화 예정

# 임시 해결책: 개발 이미지 사용
docker-compose -f docker-compose.prod.yml build
```

#### 2. 데이터베이스 준비
```bash
# 마이그레이션 실행
docker-compose exec backend npm run typeorm:migration:run

# 초기 데이터 설정
docker-compose exec backend npm run seed:production
```

#### 3. 서비스 배포
```bash
# 프로덕션 서비스 시작
docker-compose -f docker-compose.prod.yml up -d

# 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f
```

#### 4. 배포 검증
```bash
# 헬스 체크
curl -f http://localhost:8000/api/health
curl -f http://localhost:8001/api/health
curl -f http://localhost:3000

# 데이터베이스 연결 테스트
docker-compose exec backend npm run db:test
```

---

## 📊 모니터링 및 로깅

### 시스템 모니터링

#### 핵심 메트릭
- **응답 시간**: API < 200ms, Frontend < 3s
- **에러율**: < 0.1% (critical endpoints)
- **가용성**: 99.9% uptime
- **리소스 사용률**: CPU < 80%, Memory < 85%

#### 모니터링 대시보드 설정
```yaml
# prometheus.yml (예시)
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'recipt-backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'

  - job_name: 'recipt-ocr'
    static_configs:
      - targets: ['localhost:8001']
    metrics_path: '/metrics'
```

#### 알림 설정
- **Critical**: 서비스 다운, 데이터베이스 연결 실패
- **Warning**: 응답 시간 증가, 에러율 상승
- **Info**: 배포 완료, 정기 백업 완료

### 로깅 전략

#### 로그 레벨 관리
- **Production**: ERROR, WARN, INFO
- **Staging**: DEBUG 포함
- **Development**: ALL levels

#### 로그 로테이션
```bash
# 로그 디렉토리 구조
/app/logs/
├── backend/
│   ├── application.log      # 애플리케이션 로그
│   ├── error.log           # 에러 로그
│   └── access.log          # 액세스 로그
├── ocr-service/
│   ├── ocr.log            # OCR 처리 로그
│   └── error.log          # 에러 로그
└── nginx/
    ├── access.log         # 웹 서버 액세스 로그
    └── error.log          # 웹 서버 에러 로그
```

---

## 🔒 보안 관리

### 보안 체크리스트
- [ ] **환경 변수**: 민감한 정보는 환경 변수로 관리
- [ ] **네트워크**: 필요한 포트만 외부 노출
- [ ] **인증서**: SSL/TLS 인증서 설정 및 자동 갱신
- [ ] **접근 제어**: 관리자 접근 로그 모니터링
- [ ] **백업 암호화**: 백업 데이터 암호화 저장

### 보안 모니터링
```bash
# 보안 이벤트 모니터링
tail -f /app/logs/backend/security.log | grep "FAILED_LOGIN\|UNAUTHORIZED"

# 시스템 보안 업데이트 확인
docker images | grep -E "postgres|redis|nginx" | awk '{print $1":"$2}'
```

### 취약점 관리
- **정기 스캔**: 주간 보안 취약점 스캔
- **의존성 업데이트**: 월간 의존성 보안 업데이트
- **침입 탐지**: 비정상 접근 패턴 모니터링

---

## 💾 백업 및 복원

### 백업 전략

#### 데이터베이스 백업
```bash
# 일일 자동 백업 (crontab 설정)
0 2 * * * docker exec recipt-database-prod pg_dump -U recipt recipt_db > /backups/daily/recipt_db_$(date +\%Y\%m\%d).sql

# 주간 백업 (압축)
0 3 * * 0 docker exec recipt-database-prod pg_dump -U recipt recipt_db | gzip > /backups/weekly/recipt_db_$(date +\%Y\%m\%d).sql.gz

# 백업 파일 검증
pg_restore --list /backups/daily/recipt_db_$(date +\%Y\%m\%d).sql
```

#### 파일 시스템 백업
```bash
# 업로드 파일 백업
tar -czf /backups/files/uploads_$(date +\%Y\%m\%d).tar.gz /app/uploads

# 설정 파일 백업
tar -czf /backups/config/config_$(date +\%Y\%m\%d).tar.gz \
  docker-compose.prod.yml \
  .env.production \
  nginx.conf
```

### 복원 절차

#### 데이터베이스 복원
```bash
# 1. 서비스 중지
docker-compose -f docker-compose.prod.yml stop backend ocr-service

# 2. 데이터베이스 복원
docker exec recipt-database-prod psql -U recipt -d postgres -c "DROP DATABASE IF EXISTS recipt_db;"
docker exec recipt-database-prod psql -U recipt -d postgres -c "CREATE DATABASE recipt_db;"
docker exec -i recipt-database-prod psql -U recipt -d recipt_db < /backups/daily/recipt_db_20250908.sql

# 3. 서비스 재시작
docker-compose -f docker-compose.prod.yml start backend ocr-service

# 4. 데이터 검증
docker-compose exec backend npm run db:verify
```

### 백업 보존 정책
- **일일 백업**: 30일 보관
- **주간 백업**: 12주 보관
- **월간 백업**: 12개월 보관
- **연간 백업**: 5년 보관

---

## 🚨 장애 대응

### 장애 유형별 대응 절차

#### 1. Frontend 서비스 장애
```bash
# 증상: 웹페이지 접속 불가
# 1. 컨테이너 상태 확인
docker-compose ps frontend

# 2. 로그 확인
docker-compose logs frontend

# 3. 재시작
docker-compose restart frontend

# 4. 네트워크 확인
curl -f http://localhost:3000/health
```

#### 2. Backend API 장애
```bash
# 증상: API 응답 없음 (500, 502 에러)
# 1. 서비스 상태 확인
curl -f http://localhost:8000/api/health

# 2. 데이터베이스 연결 확인
docker-compose exec backend npm run db:ping

# 3. 메모리 사용량 확인
docker stats recipt-backend-prod

# 4. 재시작 및 복구
docker-compose restart backend
docker-compose logs -f backend
```

#### 3. 데이터베이스 장애
```bash
# 증상: 데이터베이스 연결 실패
# 1. PostgreSQL 상태 확인
docker-compose exec database pg_isready -U recipt -d recipt_db

# 2. 연결 수 확인
docker-compose exec database psql -U recipt -d recipt_db -c "SELECT count(*) FROM pg_stat_activity;"

# 3. 디스크 공간 확인
docker-compose exec database df -h

# 4. 로그 분석
docker-compose logs database | grep ERROR

# 5. 긴급 복구
docker-compose restart database
```

#### 4. OCR 서비스 장애
```bash
# 증상: 이미지 처리 실패
# 1. OCR 서비스 헬스 체크
curl -f http://localhost:8001/api/health

# 2. Tesseract 엔진 상태 확인
docker-compose exec ocr-service tesseract --version

# 3. 메모리 사용량 점검
docker stats recipt-ocr-prod

# 4. 임시 파일 정리
docker-compose exec ocr-service rm -rf /tmp/ocr_*

# 5. 서비스 재시작
docker-compose restart ocr-service
```

### 장애 에스컬레이션

#### 심각도 분류
- **P0 (Critical)**: 전체 서비스 중단 → 즉시 대응
- **P1 (High)**: 핵심 기능 장애 → 1시간 내 대응
- **P2 (Medium)**: 부분 기능 장애 → 4시간 내 대응
- **P3 (Low)**: 성능 저하 → 24시간 내 대응

#### 연락처 및 절차
1. **1차 대응**: 온콜 엔지니어
2. **2차 대응**: 시스템 관리자
3. **3차 대응**: 개발팀 리더
4. **최종 대응**: CTO/기술 책임자

---

## 🔧 유지보수

### 정기 유지보수 작업

#### 일일 작업
- [ ] 시스템 상태 점검 (자동화)
- [ ] 로그 모니터링 및 분석
- [ ] 백업 상태 확인
- [ ] 보안 이벤트 검토

#### 주간 작업
- [ ] 성능 메트릭 분석
- [ ] 디스크 공간 정리
- [ ] 보안 업데이트 적용
- [ ] 백업 데이터 검증

#### 월간 작업
- [ ] 의존성 보안 업데이트
- [ ] 시스템 성능 최적화
- [ ] 장애 대응 훈련
- [ ] 문서 업데이트

### 성능 최적화

#### 데이터베이스 최적화
```sql
-- 쿼리 성능 분석
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 인덱스 사용률 확인
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- 테이블 크기 확인
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### 캐시 최적화
```bash
# Redis 성능 메트릭
docker-compose exec redis redis-cli INFO memory
docker-compose exec redis redis-cli INFO stats

# 캐시 히트율 확인
docker-compose exec redis redis-cli INFO stats | grep cache_hits
```

#### 리소스 모니터링
```bash
# 컨테이너 리소스 사용률
docker stats --no-stream

# 디스크 I/O 모니터링
docker-compose exec database iostat -x 1 5

# 네트워크 트래픽 모니터링
docker exec recipt-backend-prod netstat -i
```

---

## 📈 용량 계획

### 현재 리소스 사용량 (기준)
- **CPU**: Backend 0.5 core, OCR 1.0 core, Database 0.5 core
- **Memory**: Backend 512MB, OCR 2GB, Database 512MB
- **Storage**: Database 10GB, Uploads 5GB, Logs 1GB

### 확장성 고려사항

#### 수평 확장 (Scale-Out)
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - CLUSTER_MODE=true
    depends_on:
      - database
      - redis

  ocr-service:
    deploy:
      replicas: 2
    environment:
      - WORKER_PROCESSES=4
```

#### 수직 확장 (Scale-Up)
```yaml
# 리소스 한계 조정
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '2.0'
    reservations:
      memory: 1G
      cpus: '1.0'
```

### 트래픽 예측 모델
- **현재**: ~100 사용자/일
- **6개월**: ~500 사용자/일
- **1년**: ~1,000 사용자/일

---

## 🔄 CI/CD 운영

### GitHub Actions 워크플로우 관리

#### 파이프라인 모니터링
- **빌드 성공률**: >95%
- **테스트 커버리지**: >80%
- **배포 시간**: <10분
- **롤백 시간**: <2분

#### 배포 전략
```yaml
# .github/workflows/production.yml
strategy:
  type: blue-green
  health_check:
    path: "/api/health"
    timeout: 30s
  rollback:
    automatic: true
    threshold: 5% error_rate
```

### 환경별 배포 관리
- **Development**: 매 PR마다 자동 배포
- **Staging**: main 브랜치 머지 시 자동 배포
- **Production**: 수동 승인 후 배포

---

## 📞 운영 연락처

### 긴급 연락처
- **시스템 관리자**: [연락처 정보]
- **개발팀 리더**: [연락처 정보]
- **인프라팀**: [연락처 정보]

### 외부 서비스
- **클라우드 제공업체**: [지원 연락처]
- **도메인 등록업체**: [지원 연락처]
- **SSL 인증서**: [지원 연락처]

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2025-09-08 | v1.0 | 초기 운영 가이드 작성 | Claude Code |

---

## 🔗 관련 문서

- [개발환경 가이드](./development-guide.md)
- [인프라 설정 워크플로우](./workflow/01_Infrastructure_Setup.md)
- [API 문서](http://localhost:8000/api/docs)
- [OCR 서비스 문서](http://localhost:8001/docs)

---

**⚠️ 중요 공지**
- 프로덕션 환경에서는 반드시 백업 후 작업 수행
- 모든 변경 사항은 사전 승인 및 문서화 필수
- 장애 발생 시 즉시 에스컬레이션 절차 준수

---
*이 문서는 Claude Code SuperClaude Framework를 통해 생성되었습니다.*