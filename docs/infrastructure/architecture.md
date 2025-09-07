# 개발환경 아키텍처 설계

## 1. 컨테이너 구성 설계

### 1.1 Docker Compose 서비스 구성

```yaml
# docker-compose.yml 구성 계획
version: '3.8'

services:
  # Frontend Service (React + Vite)
  frontend:
    container_name: recipt-frontend
    build: 
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend
    networks:
      - recipt-network

  # Backend Service (NestJS)
  backend:
    container_name: recipt-backend
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://recipt:recipt123@database:5432/recipt_db
      - OCR_SERVICE_URL=http://ocr-service:8001
    depends_on:
      - database
    networks:
      - recipt-network

  # Database Service (PostgreSQL 15)
  database:
    container_name: recipt-database
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=recipt_db
      - POSTGRES_USER=recipt
      - POSTGRES_PASSWORD=recipt123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - recipt-network

  # OCR Service (Python FastAPI)
  ocr-service:
    container_name: recipt-ocr
    build:
      context: ./ocr-service
      dockerfile: Dockerfile.dev
    ports:
      - "8001:8001"
    volumes:
      - ./ocr-service:/app
      - ocr_uploads:/app/uploads
    environment:
      - PYTHONPATH=/app
      - UPLOAD_DIR=/app/uploads
    networks:
      - recipt-network

volumes:
  postgres_data:
  ocr_uploads:

networks:
  recipt-network:
    driver: bridge
```

### 1.2 컨테이너별 역할 및 의존성

```
Frontend (React) ──→ Backend (NestJS) ──→ Database (PostgreSQL)
                          ↓
                    OCR Service (FastAPI)
```

## 2. 네트워크 구성 계획

### 2.1 네트워크 토폴로지

```
┌─────────────────────────────────────────────────────┐
│                recipt-network (bridge)              │
│                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │   Frontend  │    │   Backend   │    │ Database │ │
│  │   :3000     │◄──►│   :8000     │◄──►│  :5432   │ │
│  └─────────────┘    └─────────────┘    └──────────┘ │
│                            │                        │
│                            ▼                        │
│                     ┌─────────────┐                 │
│                     │ OCR Service │                 │
│                     │    :8001    │                 │
│                     └─────────────┘                 │
└─────────────────────────────────────────────────────┘

Host Machine Ports:
- Frontend: localhost:3000
- Backend API: localhost:8000
- Database: localhost:5432
- OCR Service: localhost:8001
```

### 2.2 통신 패턴

1. **Frontend → Backend**: HTTP REST API 통신
   - Base URL: `http://localhost:8000/api`
   - 인증: JWT Bearer Token

2. **Backend → Database**: PostgreSQL 연결
   - Connection String: `postgresql://recipt:recipt123@database:5432/recipt_db`

3. **Backend → OCR Service**: HTTP API 통신
   - Base URL: `http://ocr-service:8001/api`
   - 파일 업로드: multipart/form-data

## 3. 볼륨 마운트 전략

### 3.1 개발용 볼륨 마운트

```yaml
# 개발 효율성을 위한 볼륨 구성
volumes:
  # Frontend 소스코드 실시간 반영
  frontend_src:
    - ./frontend:/app
    - /app/node_modules  # 익명 볼륨으로 node_modules 보호

  # Backend 소스코드 실시간 반영  
  backend_src:
    - ./backend:/app
    - /app/node_modules

  # OCR Service 소스코드 실시간 반영
  ocr_src:
    - ./ocr-service:/app
    - ./uploads:/app/uploads  # 업로드 파일 영속성

  # Database 데이터 영속성
  database_data:
    - postgres_data:/var/lib/postgresql/data
    - ./database/init:/docker-entrypoint-initdb.d  # 초기화 스크립트
```

### 3.2 데이터 영속성 전략

1. **Database**: Named volume으로 데이터 보존
2. **OCR Uploads**: Bind mount로 호스트와 공유
3. **Source Code**: Bind mount로 실시간 개발 지원
4. **Dependencies**: 익명 볼륨으로 컨테이너 재빌드 방지

## 4. 포트 할당 계획

### 4.1 서비스별 포트 매핑

| 서비스 | 컨테이너 포트 | 호스트 포트 | 프로토콜 | 목적 |
|---------|--------------|------------|---------|------|
| Frontend | 3000 | 3000 | HTTP | React 개발 서버 |
| Backend | 8000 | 8000 | HTTP | NestJS API 서버 |
| Database | 5432 | 5432 | TCP | PostgreSQL 연결 |
| OCR Service | 8001 | 8001 | HTTP | FastAPI OCR 서비스 |

### 4.2 환경별 포트 구성

#### 개발환경 (Development)
```
Frontend:     http://localhost:3000
Backend API:  http://localhost:8000/api
Database:     postgresql://localhost:5432/recipt_db  
OCR Service:  http://localhost:8001/api
```

#### 테스트환경 (Testing)
```
Frontend:     http://localhost:4000
Backend API:  http://localhost:9000/api
Database:     postgresql://localhost:6432/recipt_test_db
OCR Service:  http://localhost:9001/api
```

## 5. 개발환경 설정

### 5.1 환경 변수 관리

```bash
# .env.development
NODE_ENV=development
VITE_API_URL=http://localhost:8000
DATABASE_URL=postgresql://recipt:recipt123@localhost:5432/recipt_db
OCR_SERVICE_URL=http://localhost:8001
JWT_SECRET=dev-secret-key
UPLOAD_DIR=./uploads
```

### 5.2 Hot Reload 설정

1. **Frontend**: Vite HMR 활성화
2. **Backend**: NestJS watch mode (`npm run start:dev`)
3. **OCR Service**: uvicorn reload 모드

## 6. 보안 고려사항

### 6.1 개발환경 보안

1. **네트워크 격리**: 전용 bridge 네트워크 사용
2. **환경 변수**: 개발용 임시 값 사용
3. **포트 접근**: localhost에서만 접근 가능
4. **데이터베이스**: 개발용 임시 계정 사용

### 6.2 향후 프로덕션 고려사항

1. **컨테이너 이미지**: 멀티스테이지 빌드로 최적화
2. **환경 변수**: Secrets 관리 시스템 도입
3. **네트워크**: 프록시 서버(Nginx) 추가
4. **모니터링**: 로그 수집 및 모니터링 시스템

## 7. 성능 최적화

### 7.1 개발환경 최적화

1. **빌드 캐시**: Docker layer 캐싱 활용
2. **의존성 캐시**: node_modules 익명 볼륨
3. **데이터베이스**: 개발용 가벼운 설정
4. **리소스 제한**: 개발 머신 리소스 고려

### 7.2 리소스 할당

```yaml
# 개발환경 리소스 제한 (선택사항)
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
  
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

## 8. 확장성 고려사항

### 8.1 마이크로서비스 아키텍처 준비

```
현재: Monolithic + OCR Service
향후: API Gateway + Multiple Services

┌─────────────┐    ┌─────────────────┐
│   Frontend  │    │  API Gateway    │
│             │◄──►│  (NestJS)       │
└─────────────┘    └─────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Auth Service │    │Receipt Svc  │    │ OCR Service │
└─────────────┘    └─────────────┘    └─────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Users DB   │    │ Receipts DB │    │ Files Store │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 생성 일시
- 작성일: 2025년 9월 7일
- 작성자: 개발팀 아키텍트
- 버전: v1.0
- 다음 업데이트: 인프라 구축 완료 후