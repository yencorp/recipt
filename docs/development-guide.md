# 광남동성당 청소년위원회 예결산 관리 시스템 - 개발환경 가이드

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [개발환경 설치](#개발환경-설치)
3. [서비스 시작 방법](#서비스-시작-방법)
4. [개발 워크플로우](#개발-워크플로우)
5. [테스트 실행](#테스트-실행)
6. [트러블슈팅](#트러블슈팅)
7. [FAQ](#faq)

---

## 🏗️ 시스템 개요

### 아키텍처 구성
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   OCR Service   │
│   React + Vite  │◄──►│   NestJS        │◄──►│   FastAPI       │
│   Port: 5173    │    │   Port: 8000    │    │   Port: 8001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┬─────┴─────┬─────────────────┐
         │   PostgreSQL    │   Redis   │   File Storage  │
         │   Port: 5432    │   Port:   │   Docker Vols   │
         └─────────────────┘   6379    └─────────────────┘
```

### 기술 스택
- **Frontend**: React 19 + Vite 7.1 + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript + TypeORM + PostgreSQL
- **OCR Service**: FastAPI + Python 3.11 + Tesseract 5.5
- **Database**: PostgreSQL 15.14 + Redis 7
- **Infrastructure**: Docker + Docker Compose + GitHub Actions

### 서비스 포트 매핑
| 서비스 | 개발용 포트 | 프로덕션용 포트 | 상태 |
|--------|-------------|-----------------|------|
| Frontend (Vite) | 5173 | - | 개발전용 |
| Frontend (Container) | 3000 | 3000 | 운영환경 |
| Backend API | 8000 | 8000 | 공통 |
| OCR Service | 8001 | 8001 | 공통 |
| PostgreSQL | 5432 | 5432 | 공통 |
| Redis | 6379 | 6379 | 공통 |

---

## 💻 개발환경 설치

### 필수 요구사항

#### 시스템 요구사항
- **OS**: macOS, Linux, Windows 10+ (WSL2 권장)
- **CPU**: 2코어 이상 (권장: 4코어 이상)
- **RAM**: 8GB 이상 (권장: 16GB 이상)
- **Storage**: 20GB 이상 여유 공간

#### 필수 소프트웨어
1. **Docker Desktop**
   ```bash
   # macOS (Homebrew)
   brew install --cask docker
   
   # Linux
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Windows
   # Docker Desktop for Windows 다운로드 및 설치
   ```

2. **Docker Compose** (Docker Desktop에 포함)
   ```bash
   # 설치 확인
   docker-compose --version
   docker compose version  # 최신 버전
   ```

3. **Git**
   ```bash
   # macOS
   brew install git
   
   # Linux
   sudo apt-get install git  # Ubuntu/Debian
   sudo yum install git      # CentOS/RHEL
   ```

4. **Node.js 20** (Frontend 개발용, 선택사항)
   ```bash
   # nvm 사용 권장
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20
   ```

### 프로젝트 클론 및 설정

```bash
# 1. 프로젝트 클론
git clone https://github.com/your-org/recipt-management.git
cd recipt-management

# 2. 환경변수 설정 (선택사항)
cp .env.development.example .env.development

# 3. Docker 데몬 확인
docker info

# 4. 개발환경 시작
./scripts/dev-start.sh
```

---

## 🚀 서비스 시작 방법

### 방법 1: 스크립트 사용 (권장)

#### 전체 환경 시작
```bash
# 개발환경 시작
./scripts/dev-start.sh

# 로그 확인
./scripts/dev-start.sh && docker-compose -f docker-compose.dev.yml logs -f
```

#### 개별 서비스 의존성 설치
```bash
# 모든 서비스
./scripts/setup-dev.sh

# 개별 서비스
./scripts/setup-dev.sh frontend
./scripts/setup-dev.sh backend  
./scripts/setup-dev.sh ocr
```

#### 환경 중지
```bash
# 일반 중지
./scripts/dev-stop.sh

# 완전 정리 (볼륨 포함)
./scripts/dev-stop.sh --clean
```

### 방법 2: Docker Compose 직접 사용

```bash
# 환경 시작
docker-compose -f docker-compose.dev.yml up -d

# 상태 확인
docker-compose -f docker-compose.dev.yml ps

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f

# 환경 중지
docker-compose -f docker-compose.dev.yml down
```

### 방법 3: 하이브리드 개발 (Frontend만 로컬)

```bash
# Backend 서비스들만 Docker로 시작
docker-compose -f docker-compose.dev.yml up -d database redis backend ocr-service

# Frontend는 로컬에서 개발 서버 실행
cd apps/frontend
npm install
npm run dev  # http://localhost:5173
```

---

## 🔄 개발 워크플로우

### 일반적인 개발 절차

```bash
# 1. 개발환경 시작
./scripts/dev-start.sh

# 2. 서비스 상태 확인
curl http://localhost:8000/api/health    # Backend API
curl http://localhost:5173/              # Frontend (Vite)
curl http://localhost:8001/              # OCR Service

# 3. 개발 작업...

# 4. 테스트 실행
npm run test:unit --workspace=apps/frontend
npm run test:unit --workspace=apps/backend
cd apps/ocr-service && python -m pytest

# 5. 변경사항 커밋
git add .
git commit -m "feat: 새로운 기능 추가"

# 6. 개발환경 정리
./scripts/dev-stop.sh
```

### 브랜치 전략

```bash
# 새 기능 개발
git checkout -b feature/receipt-upload
git push -u origin feature/receipt-upload

# 버그 수정
git checkout -b bugfix/ocr-accuracy
git push -u origin bugfix/ocr-accuracy

# 긴급 수정
git checkout -b hotfix/critical-security-fix
git push -u origin hotfix/critical-security-fix
```

### 코드 스타일 및 린팅

```bash
# Frontend 코드 검사
cd apps/frontend
npm run lint
npm run format

# Backend 코드 검사  
cd apps/backend
npm run lint
npm run format

# OCR Service 코드 검사
cd apps/ocr-service  
black app/
isort app/
flake8 app/
```

---

## 🧪 테스트 실행

### Frontend 테스트 (Vitest)
```bash
cd apps/frontend

# 단위 테스트 실행
npm run test:unit

# 테스트 커버리지
npm run test:coverage

# 테스트 감시 모드
npm run test:watch
```

### Backend 테스트 (Jest)
```bash
cd apps/backend

# 단위 테스트
npm run test:unit

# 통합 테스트  
npm run test:integration

# E2E 테스트
npm run test:e2e

# 커버리지 리포트
npm run test:cov
```

### OCR Service 테스트 (pytest)
```bash
cd apps/ocr-service

# 모든 테스트
python -m pytest

# 커버리지와 함께
python -m pytest --cov=app

# 특정 테스트 파일
python -m pytest tests/test_ocr.py

# 마커별 테스트
python -m pytest -m unit    # 단위 테스트만
python -m pytest -m integration  # 통합 테스트만
```

### 데이터베이스 테스트
```bash
# PostgreSQL 연결 테스트
docker-compose -f docker-compose.dev.yml exec database pg_isready -U recipt

# SQL 쿼리 실행
docker-compose -f docker-compose.dev.yml exec database psql -U recipt -d recipt_db -c "SELECT version();"

# Redis 연결 테스트  
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping
```

---

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. Docker 관련 문제

**증상**: `docker: command not found`
```bash
# 해결방법
# 1. Docker Desktop 설치 확인
open -a Docker  # macOS

# 2. PATH 설정 확인  
echo $PATH | grep docker

# 3. 재시작 후 확인
docker --version
```

**증상**: `Cannot connect to the Docker daemon`
```bash
# 해결방법
# 1. Docker 데몬 시작
sudo systemctl start docker  # Linux
open -a Docker              # macOS

# 2. 권한 확인
sudo usermod -aG docker $USER  # Linux
newgrp docker
```

**증상**: `port already in use` 오류
```bash
# 해결방법
# 1. 포트 사용 프로세스 확인
lsof -i :8000  # 포트 8000 사용 프로세스 확인
lsof -i :5432  # PostgreSQL 포트 확인

# 2. 프로세스 종료
kill -9 <PID>

# 3. Docker 컨테이너 정리
docker-compose -f docker-compose.dev.yml down
docker system prune -a --volumes  # 주의: 모든 데이터 삭제
```

#### 2. 서비스 시작 실패

**증상**: Backend API가 시작되지 않음
```bash
# 확인 방법
docker-compose -f docker-compose.dev.yml logs backend

# 일반적인 해결방법
# 1. 데이터베이스 대기
docker-compose -f docker-compose.dev.yml up database -d
sleep 10
docker-compose -f docker-compose.dev.yml up backend -d

# 2. 환경변수 확인
docker-compose -f docker-compose.dev.yml exec backend env | grep DATABASE

# 3. 의존성 재설치
./scripts/setup-dev.sh backend
```

**증상**: Frontend 개발 서버 오류
```bash
# 확인 방법
cd apps/frontend
npm run dev

# 일반적인 해결방법
# 1. 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 2. 포트 변경
npm run dev -- --port 5174

# 3. 캐시 정리
npm run dev -- --force
```

**증상**: OCR 서비스 인식 실패
```bash
# 확인 방법
curl http://localhost:8001/api/health

# 일반적인 해결방법  
# 1. Tesseract 설치 확인
docker-compose -f docker-compose.dev.yml exec ocr-service tesseract --version

# 2. 언어팩 확인
docker-compose -f docker-compose.dev.yml exec ocr-service tesseract --list-langs

# 3. 이미지 재빌드
docker-compose -f docker-compose.dev.yml build --no-cache ocr-service
```

#### 3. 성능 관련 문제

**증상**: 빌드가 너무 느림
```bash
# 해결방법
# 1. Docker BuildKit 활성화
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 2. 멀티스테이지 캐시 활용
docker build --target development ...

# 3. .dockerignore 최적화
echo "node_modules" >> .dockerignore
echo ".git" >> .dockerignore
echo "*.log" >> .dockerignore
```

**증상**: 메모리 부족 오류
```bash
# 해결방법
# 1. Docker Desktop 메모리 증설 (8GB 이상 권장)
# 2. 사용하지 않는 컨테이너 정리
docker system prune -a

# 3. Node.js 메모리 제한 해제
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### 로그 확인 방법

```bash
# 전체 서비스 로그
docker-compose -f docker-compose.dev.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.dev.yml logs -f backend

# 최근 로그만 (마지막 100라인)
docker-compose -f docker-compose.dev.yml logs --tail=100 -f

# 타임스탬프와 함께
docker-compose -f docker-compose.dev.yml logs -t -f
```

---

## ❓ FAQ

### Q1: 개발환경 설정이 복잡해 보이는데, 간단한 방법은 없나요?
**A**: 네, 스크립트를 사용하세요!
```bash
# 한 번에 모든 것 시작
./scripts/dev-start.sh

# 문제 발생시 정리 후 재시작
./scripts/dev-stop.sh --clean
./scripts/dev-start.sh
```

### Q2: 로컬에서 개발할 때 Docker 없이 할 수 있나요?
**A**: Frontend는 가능하지만 Backend 서비스들은 Docker 권장:
```bash
# Backend 서비스들만 Docker
docker-compose -f docker-compose.dev.yml up -d database redis backend ocr-service

# Frontend만 로컬
cd apps/frontend && npm run dev
```

### Q3: 테스트 실행이 실패합니다.
**A**: 의존성 설치를 확인하세요:
```bash
# 의존성 재설치
./scripts/setup-dev.sh

# 개별 서비스 의존성
./scripts/setup-dev.sh frontend  # Frontend만
./scripts/setup-dev.sh backend   # Backend만
./scripts/setup-dev.sh ocr      # OCR만
```

### Q4: API 호출이 CORS 에러가 발생합니다.
**A**: 개발 환경에서는 프록시 설정이 되어 있어야 합니다:
```bash
# Frontend에서 Backend API 호출시
# http://localhost:8000/api/... 직접 호출

# 또는 vite.config.ts에서 프록시 설정 확인
```

### Q5: 데이터베이스 데이터를 초기화하려면 어떻게 하나요?
**A**: 볼륨을 삭제하면 됩니다:
```bash
# 주의: 모든 데이터가 삭제됩니다!
docker-compose -f docker-compose.dev.yml down --volumes

# 다시 시작
docker-compose -f docker-compose.dev.yml up -d
```

### Q6: Hot Reload가 동작하지 않습니다.
**A**: 파일 감시 설정을 확인하세요:
```bash
# Frontend (Vite)
# vite.config.ts에서 server.watch 설정 확인

# Backend (NestJS)
# Docker Compose 볼륨 마운트 확인
# volumes: - ./apps/backend:/app
```

### Q7: OCR 인식률이 낮습니다.
**A**: 이미지 전처리 설정을 조정하세요:
```bash
# OCR 서비스 설정 확인
curl http://localhost:8001/api/health

# Tesseract 언어팩 확인
docker-compose -f docker-compose.dev.yml exec ocr-service tesseract --list-langs
```

### Q8: 빌드 시간을 단축하려면?
**A**: Docker 캐시를 활용하세요:
```bash
# BuildKit 활성화
export DOCKER_BUILDKIT=1

# 캐시 마운트 사용
docker build --cache-from=recipt-backend:latest ...
```

### Q9: 여러 개발자가 함께 작업할 때 주의사항은?
**A**: 
- 포트 충돌 방지: 각자 다른 포트 사용
- 환경변수 분리: `.env.local` 사용
- 데이터베이스 분리: 개발자별 DB 스키마 또는 컨테이너명 변경

### Q10: CI/CD 파이프라인과 로컬 환경 차이?
**A**: 로컬은 개발용, CI/CD는 프로덕션 빌드:
```bash
# 로컬: 개발용 설정
docker-compose -f docker-compose.dev.yml up

# CI/CD: 프로덕션 빌드 테스트
docker build -f apps/frontend/Dockerfile.prod apps/frontend
```

---

## 📞 지원 및 문의

- **기술 문의**: 개발팀 Slack #dev 채널
- **버그 리포트**: GitHub Issues
- **문서 개선**: Pull Request 생성

---

*마지막 업데이트: 2025-09-08*  
*문서 버전: 1.0.0*