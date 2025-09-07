# 08. 개발 환경 설정

## 1. 개발 환경 개요

### 1.1 개발 도구 스택
- **Node.js**: v18.x LTS
- **Python**: v3.11+
- **PostgreSQL**: v15+
- **Docker**: v24.0+
- **Docker Compose**: v2.20+

### 1.2 IDE 및 편집기
- **권장**: VSCode with Extensions
  - TypeScript Hero
  - Prettier
  - ESLint
  - Docker
  - PostgreSQL

## 2. Docker 개발 환경

### 2.1 Docker Compose 구성

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # PostgreSQL 데이터베이스
  database:
    image: postgres:15
    container_name: receipt-db
    environment:
      POSTGRES_DB: receipt_management
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - receipt-network

  # Redis 캐시
  redis:
    image: redis:7-alpine
    container_name: receipt-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - receipt-network

  # 백엔드 API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: receipt-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=database
      - DB_PORT=5432
      - DB_USERNAME=dev_user
      - DB_PASSWORD=dev_password
      - DB_DATABASE=receipt_management
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=dev-jwt-secret-key
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - database
      - redis
    networks:
      - receipt-network
    command: npm run start:dev

  # 프론트엔드
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: receipt-frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - receipt-network
    command: npm run dev

  # OCR 마이크로서비스
  ocr-service:
    build:
      context: ./ocr-service
      dockerfile: Dockerfile.dev
    container_name: receipt-ocr
    ports:
      - "8000:8000"
    environment:
      - PYTHON_ENV=development
    volumes:
      - ./ocr-service:/app
      - ./uploads:/app/uploads
    networks:
      - receipt-network
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  postgres_data:
  redis_data:

networks:
  receipt-network:
    driver: bridge
```

### 2.2 개발용 Dockerfile

#### 백엔드 Dockerfile.dev
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# 개발 모드 실행
EXPOSE 3001
CMD ["npm", "run", "start:dev"]
```

#### 프론트엔드 Dockerfile.dev
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# 개발 서버 실행
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

#### OCR 서비스 Dockerfile.dev
```dockerfile
FROM python:3.11

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-kor \
    libgl1-mesa-glx \
    libglib2.0-0

# Python 의존성 설치
COPY requirements.txt .
RUN pip install -r requirements.txt

# 소스 코드 복사
COPY . .

# 개발 서버 실행
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

## 3. 로컬 개발 설정

### 3.1 환경 변수 설정

#### 백엔드 `.env.development`
```env
NODE_ENV=development
PORT=3001

# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dev_user
DB_PASSWORD=dev_password
DB_DATABASE=receipt_management

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OCR 서비스
OCR_SERVICE_URL=http://localhost:8000

# 파일 업로드
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

#### 프론트엔드 `.env.development`
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_TITLE=영수증 관리 시스템
VITE_UPLOAD_MAX_SIZE=10485760
```

#### OCR 서비스 `.env.development`
```env
PYTHON_ENV=development
LOG_LEVEL=DEBUG
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### 3.2 데이터베이스 초기화

```sql
-- database/init/01-init.sql
-- 확장 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 개발용 사용자 생성
CREATE USER dev_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE receipt_management TO dev_user;

-- 테스트 데이터 삽입
INSERT INTO organizations (id, name, description) VALUES 
  (uuid_generate_v4(), '청년위원회', '광남동 성당 청년위원회'),
  (uuid_generate_v4(), '꿈나무회', '광남동 성당 꿈나무회'),
  (uuid_generate_v4(), '성가대', '광남동 성당 성가대'),
  (uuid_generate_v4(), '사목회', '광남동 성당 사목회');
```

## 4. 개발 스크립트

### 4.1 package.json 스크립트

#### 루트 프로젝트
```json
{
  "scripts": {
    "dev": "docker-compose -f docker-compose.dev.yml up --build",
    "dev:logs": "docker-compose -f docker-compose.dev.yml logs -f",
    "dev:down": "docker-compose -f docker-compose.dev.yml down",
    "dev:clean": "docker-compose -f docker-compose.dev.yml down -v --remove-orphans",
    "setup": "npm run setup:backend && npm run setup:frontend && npm run setup:ocr",
    "setup:backend": "cd backend && npm install",
    "setup:frontend": "cd frontend && npm install",
    "setup:ocr": "cd ocr-service && pip install -r requirements.txt",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm run test",
    "test:frontend": "cd frontend && npm run test"
  }
}
```

#### 백엔드 스크립트
```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "migration:generate": "typeorm-ts-node-esm migration:generate",
    "migration:run": "typeorm-ts-node-esm migration:run",
    "migration:revert": "typeorm-ts-node-esm migration:revert",
    "seed": "ts-node -r tsconfig-paths/register src/database/seeds/run-seed.ts"
  }
}
```

#### 프론트엔드 스크립트
```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 4.2 유틸리티 스크립트

#### 개발 환경 설정 스크립트
```bash
#!/bin/bash
# scripts/setup-dev.sh

echo "🚀 개발 환경 설정을 시작합니다..."

# Docker가 실행 중인지 확인
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker가 실행되고 있지 않습니다. Docker를 시작해주세요."
    exit 1
fi

# Node.js 버전 확인
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js 18 이상이 필요합니다. 현재 버전: $(node --version)"
    exit 1
fi

# Python 버전 확인
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f2)
if [ "$PYTHON_VERSION" -lt "11" ]; then
    echo "❌ Python 3.11 이상이 필요합니다. 현재 버전: $(python3 --version)"
    exit 1
fi

# 의존성 설치
echo "📦 의존성을 설치합니다..."
npm run setup

# 환경 변수 파일 생성
echo "🔧 환경 변수 파일을 생성합니다..."
if [ ! -f backend/.env.development ]; then
    cp backend/.env.example backend/.env.development
fi

if [ ! -f frontend/.env.development ]; then
    cp frontend/.env.example frontend/.env.development
fi

if [ ! -f ocr-service/.env.development ]; then
    cp ocr-service/.env.example ocr-service/.env.development
fi

# Docker 컨테이너 시작
echo "🐳 Docker 컨테이너를 시작합니다..."
docker-compose -f docker-compose.dev.yml up -d database redis

# 데이터베이스 준비 대기
echo "⏳ 데이터베이스가 준비될 때까지 기다립니다..."
sleep 10

# 마이그레이션 실행
echo "🗄️ 데이터베이스 마이그레이션을 실행합니다..."
cd backend && npm run migration:run && cd ..

# 시드 데이터 삽입
echo "🌱 시드 데이터를 삽입합니다..."
cd backend && npm run seed && cd ..

echo "✅ 개발 환경 설정이 완료되었습니다!"
echo "📝 개발 서버를 시작하려면 'npm run dev' 명령어를 실행하세요."
```

## 5. 코딩 컨벤션

### 5.1 TypeScript/JavaScript

#### ESLint 설정
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### Prettier 설정
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 5.2 명명 규칙

#### 파일명
```
PascalCase: React 컴포넌트 (UserProfile.tsx)
kebab-case: 일반 파일 (user-service.ts)
camelCase: 유틸리티 (dateHelper.ts)
```

#### 변수 및 함수명
```typescript
// 변수명: camelCase
const userName = 'john';
const isLoggedIn = true;

// 함수명: camelCase, 동사로 시작
const getUserProfile = () => {};
const calculateTotal = () => {};

// 상수명: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 1024 * 1024;
const API_ENDPOINTS = {
  USERS: '/api/users',
};

// 타입/인터페이스: PascalCase
interface UserProfile {
  id: string;
  name: string;
}

// 클래스명: PascalCase
class UserService {
  private apiClient: ApiClient;
}
```

### 5.3 Git 커밋 규칙

#### 커밋 메시지 형식
```
<타입>(<범위>): <제목>

<본문>

<푸터>
```

#### 타입
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 코드
- `chore`: 빌드, 패키지 매니저 설정

#### 예시
```
feat(auth): JWT 토큰 갱신 기능 구현

사용자 토큰이 만료되기 전에 자동으로 갱신하는 기능을 추가했습니다.

Closes #123
```

## 6. 디버깅 및 모니터링

### 6.1 로깅 설정

#### 백엔드 로거 설정
```typescript
// src/common/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
        new winston.transports.File({
          filename: 'logs/app.log',
          level: 'info',
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }
}
```

### 6.2 성능 모니터링

#### 헬스 체크 엔드포인트
```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
```

## 7. 테스트 환경

### 7.1 Jest 설정

#### 백엔드 테스트 설정
```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

#### 프론트엔드 테스트 설정
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

## 8. 프로덕션 배포

### 8.1 Docker Compose 프로덕션

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - receipt-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    networks:
      - receipt-network
    depends_on:
      - database
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    networks:
      - receipt-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - receipt-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  receipt-network:
    driver: bridge
```

### 8.2 CI/CD 파이프라인

#### GitHub Actions 설정
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm run setup
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /app/receipt-management
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --build
```

이상으로 개발 환경 설정 명세서를 완료했습니다. Docker 기반의 개발 환경, 코딩 컨벤션, 테스트 설정, 배포 파이프라인까지 포함하여 개발팀이 일관된 환경에서 작업할 수 있도록 구성했습니다.