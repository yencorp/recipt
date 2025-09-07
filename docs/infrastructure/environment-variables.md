# 환경 변수 관리 가이드

## 개요

광남동성당 청소년위원회 예결산 관리 시스템의 환경 변수 설정 및 관리 방법을 설명합니다.

## 파일 구조

```
📁 프로젝트 루트/
├── .env.example          # 환경 변수 템플릿 (Git 추적)
├── .env.development      # 개발 환경 설정 (Git 무시)
├── .env.test            # 테스트 환경 설정 (Git 추적)
└── .env.production      # 프로덕션 환경 설정 (Git 무시, 수동 생성)
```

## 환경 파일 설명

### `.env.example`
- **목적**: 모든 필요한 환경 변수의 템플릿
- **Git 추적**: ✅ 예 (템플릿이므로 안전)
- **사용법**: 새로운 개발자가 환경 설정 시 참조

### `.env.development`
- **목적**: 로컬 개발 환경 설정
- **Git 추적**: ❌ 아니오 (.gitignore에 포함)
- **생성법**: `.env.example`을 복사하여 실제 값으로 수정

### `.env.test`
- **목적**: 자동화 테스트 환경 설정
- **Git 추적**: ✅ 예 (테스트용 더미 값 사용)
- **특징**: 빠른 테스트를 위한 최적화된 설정

### `.env.production`
- **목적**: 프로덕션 환경 설정
- **Git 추적**: ❌ 아니오 (보안 위험)
- **생성법**: 서버에서 수동으로 생성 및 관리

## 주요 환경 변수 카테고리

### 1. 기본 애플리케이션 설정

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `NODE_ENV` | 실행 환경 | `development`, `test`, `production` | ✅ |
| `PORT` | 서버 포트 | `8000` | ✅ |
| `API_PREFIX` | API 경로 접두사 | `api` | ✅ |

### 2. 데이터베이스 설정

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `DB_HOST` | 데이터베이스 호스트 | `localhost`, `database` | ✅ |
| `DB_PORT` | 데이터베이스 포트 | `5432` | ✅ |
| `DB_NAME` | 데이터베이스 이름 | `recipt_dev` | ✅ |
| `DB_USER` | 데이터베이스 사용자 | `recipt_dev` | ✅ |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | `password123` | ✅ |
| `DATABASE_URL` | 완전한 데이터베이스 URL | `postgresql://user:pass@host:port/db` | ✅ |

### 3. Redis 캐시 설정

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `REDIS_HOST` | Redis 서버 호스트 | `localhost`, `redis` | ✅ |
| `REDIS_PORT` | Redis 서버 포트 | `6379` | ✅ |
| `REDIS_PASSWORD` | Redis 비밀번호 | `""` (빈 값 가능) | ❌ |
| `REDIS_URL` | 완전한 Redis URL | `redis://localhost:6379` | ✅ |

### 4. 인증 및 보안 설정

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `JWT_SECRET` | JWT 토큰 서명 키 | `your-super-secret-jwt-key` | ✅ |
| `JWT_EXPIRES_IN` | JWT 토큰 만료 시간 | `1d`, `24h` | ✅ |
| `ENCRYPTION_KEY` | 데이터 암호화 키 | `32자 길이의 랜덤 문자열` | ✅ |
| `BCRYPT_ROUNDS` | 비밀번호 해시 라운드 | `10` | ✅ |

### 5. OCR 서비스 설정

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `OCR_SERVICE_URL` | OCR 서비스 URL | `http://ocr-service:8001` | ✅ |
| `TESSERACT_LANG` | OCR 언어 설정 | `kor+eng` | ✅ |
| `MAX_FILE_SIZE` | 최대 파일 크기 (바이트) | `10485760` (10MB) | ✅ |
| `ALLOWED_EXTENSIONS` | 허용 파일 확장자 | `["jpg","jpeg","png","pdf"]` | ✅ |

## 환경별 설정 가이드

### 개발 환경 설정

```bash
# 1. 템플릿 복사
cp .env.example .env.development

# 2. 개발용 값으로 수정
# - 로컬 데이터베이스 설정
# - 디버그 모드 활성화
# - 모든 로깅 활성화
# - 테스트 데이터 활성화
```

### 테스트 환경 설정

```bash
# 테스트 환경은 이미 제공됨
# - 빠른 실행을 위한 최적화
# - 외부 서비스 모킹
# - 격리된 테스트 데이터베이스
```

### 프로덕션 환경 설정

```bash
# 1. 서버에서 직접 생성
nano .env.production

# 2. 보안 고려사항
# - 강력한 비밀번호 사용
# - 실제 도메인으로 CORS 제한
# - 로그 레벨을 'info' 또는 'warn'으로 설정
# - Swagger 비활성화
# - 디버그 모드 비활성화
```

## 보안 고려사항

### 1. 시크릿 관리

#### 개발 환경
- 로컬 `.env` 파일 사용
- Git에 커밋하지 않음
- 팀 공유 시 안전한 채널 사용

#### 프로덕션 환경
- 환경 변수를 서버에 직접 설정
- Docker secrets 또는 Kubernetes secrets 사용
- 클라우드 서비스의 시크릿 관리 도구 활용

### 2. 보안 체크리스트

- [ ] `.env*` 파일들이 `.gitignore`에 포함되어 있는가?
- [ ] 프로덕션 JWT 시크릿이 충분히 강력한가? (32자 이상)
- [ ] 데이터베이스 비밀번호가 기본값이 아닌가?
- [ ] CORS 설정이 실제 도메인으로 제한되어 있는가?
- [ ] 프로덕션에서 디버그 모드가 비활성화되어 있는가?
- [ ] 로그 레벨이 프로덕션에 적합한가?

### 3. 금지 사항

❌ **하지 말아야 할 것들**
- `.env` 파일을 Git에 커밋
- 실제 비밀번호를 코드나 문서에 기록
- 프로덕션 설정을 개발 환경에서 사용
- 기본 비밀번호나 시크릿을 프로덕션에서 사용

✅ **해야 할 것들**
- 템플릿 파일 유지 관리
- 정기적인 시크릿 로테이션
- 환경별 분리된 설정
- 보안 스캔 정기 실행

## 문제 해결

### 1. 환경 변수 로드 실패

```bash
# 파일 존재 확인
ls -la .env*

# 권한 확인
chmod 600 .env.development

# 문법 오류 확인
cat .env.development | grep -E "^[A-Z_]+"
```

### 2. 데이터베이스 연결 실패

```bash
# 데이터베이스 컨테이너 확인
docker-compose -f docker-compose.dev.yml ps database

# 연결 테스트
docker-compose -f docker-compose.dev.yml exec database \
  psql -U recipt_dev -d recipt_dev -c "SELECT 1"
```

### 3. Redis 연결 실패

```bash
# Redis 컨테이너 확인
docker-compose -f docker-compose.dev.yml ps redis

# 연결 테스트
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping
```

## 모범 사례

### 1. 환경 변수 네이밍

```bash
# 좋은 예
DATABASE_URL=postgresql://...
JWT_SECRET=...
OCR_SERVICE_TIMEOUT=30000

# 나쁜 예
dbUrl=...
jwtSecret=...
ocrTimeout=...
```

### 2. 기본값 설정

```typescript
// 애플리케이션에서 기본값 제공
const port = process.env.PORT || 8000;
const logLevel = process.env.LOG_LEVEL || 'info';
```

### 3. 환경 변수 검증

```typescript
// 필수 환경 변수 검증
const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'];
for (const env of requiredEnvs) {
  if (!process.env[env]) {
    throw new Error(`환경 변수 ${env}가 설정되지 않았습니다.`);
  }
}
```

## 관련 문서

- [개발환경 설정 가이드](../setup/development-guide.md)
- [Docker 환경 구성](./architecture.md)
- [보안 가이드](../security/security-guidelines.md)

---

**작성일**: 2025-09-08  
**버전**: 1.0  
**담당자**: DevOps 엔지니어