#!/bin/bash

# =================================================================
# 프로젝트 디렉터리 구조 자동 생성 스크립트
# 파일: scripts/create-structure.sh
# 설명: 모노레포 기반 프로젝트 디렉터리 구조를 자동으로 생성
# =================================================================

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수: 로그 출력
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 함수: 디렉터리 생성
create_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log_info "디렉터리 생성: $dir"
    else
        log_warning "디렉터리 이미 존재: $dir"
    fi
}

# 함수: 기본 파일 생성
create_file() {
    local file="$1"
    local content="$2"
    
    if [ ! -f "$file" ]; then
        echo "$content" > "$file"
        log_info "파일 생성: $file"
    else
        log_warning "파일 이미 존재: $file"
    fi
}

# 메인 함수
main() {
    log_info "======================================================="
    log_info "광남동성당 예결산 관리 시스템 디렉터리 구조 생성 시작"
    log_info "======================================================="

    # 루트 디렉터리 확인
    if [ ! -f "package.json" ] && [ ! -f "docs/PRD.md" ]; then
        log_error "프로젝트 루트 디렉터리에서 실행해주세요."
        exit 1
    fi

    # 1. 루트 레벨 디렉터리 생성
    log_info "1. 루트 레벨 디렉터리 생성 중..."
    
    create_directory ".github"
    create_directory ".github/workflows"
    create_directory ".github/ISSUE_TEMPLATE"
    create_directory ".husky"
    create_directory ".vscode"
    create_directory "apps"
    create_directory "packages"
    create_directory "tools"
    create_directory "scripts"
    create_directory "docker"

    # 2. Frontend 애플리케이션 구조
    log_info "2. Frontend 애플리케이션 구조 생성 중..."
    
    create_directory "apps/frontend"
    create_directory "apps/frontend/public"
    create_directory "apps/frontend/public/icons"
    create_directory "apps/frontend/src"
    create_directory "apps/frontend/src/components"
    create_directory "apps/frontend/src/components/common"
    create_directory "apps/frontend/src/components/forms"
    create_directory "apps/frontend/src/components/layouts"
    create_directory "apps/frontend/src/components/ui"
    create_directory "apps/frontend/src/pages"
    create_directory "apps/frontend/src/pages/auth"
    create_directory "apps/frontend/src/pages/budget"
    create_directory "apps/frontend/src/pages/settlement"
    create_directory "apps/frontend/src/pages/blog"
    create_directory "apps/frontend/src/pages/admin"
    create_directory "apps/frontend/src/hooks"
    create_directory "apps/frontend/src/services"
    create_directory "apps/frontend/src/stores"
    create_directory "apps/frontend/src/utils"
    create_directory "apps/frontend/src/constants"
    create_directory "apps/frontend/src/types"
    create_directory "apps/frontend/src/styles"
    create_directory "apps/frontend/src/assets"
    create_directory "apps/frontend/tests"
    create_directory "apps/frontend/tests/__mocks__"
    create_directory "apps/frontend/tests/components"
    create_directory "apps/frontend/tests/utils"

    # 3. Backend 애플리케이션 구조
    log_info "3. Backend 애플리케이션 구조 생성 중..."
    
    create_directory "apps/backend"
    create_directory "apps/backend/src"
    create_directory "apps/backend/src/modules"
    create_directory "apps/backend/src/modules/auth"
    create_directory "apps/backend/src/modules/users"
    create_directory "apps/backend/src/modules/organizations"
    create_directory "apps/backend/src/modules/projects"
    create_directory "apps/backend/src/modules/budgets"
    create_directory "apps/backend/src/modules/settlements"
    create_directory "apps/backend/src/modules/receipts"
    create_directory "apps/backend/src/modules/blog"
    create_directory "apps/backend/src/modules/documents"
    create_directory "apps/backend/src/common"
    create_directory "apps/backend/src/common/decorators"
    create_directory "apps/backend/src/common/filters"
    create_directory "apps/backend/src/common/guards"
    create_directory "apps/backend/src/common/interceptors"
    create_directory "apps/backend/src/common/pipes"
    create_directory "apps/backend/src/common/dto"
    create_directory "apps/backend/src/database"
    create_directory "apps/backend/src/database/entities"
    create_directory "apps/backend/src/database/migrations"
    create_directory "apps/backend/src/database/seeds"
    create_directory "apps/backend/src/config"
    create_directory "apps/backend/src/utils"
    create_directory "apps/backend/src/types"
    create_directory "apps/backend/test"

    # 4. OCR Service 구조
    log_info "4. OCR Service 구조 생성 중..."
    
    create_directory "apps/ocr-service"
    create_directory "apps/ocr-service/app"
    create_directory "apps/ocr-service/app/api"
    create_directory "apps/ocr-service/app/api/endpoints"
    create_directory "apps/ocr-service/app/core"
    create_directory "apps/ocr-service/app/services"
    create_directory "apps/ocr-service/app/services/ocr"
    create_directory "apps/ocr-service/app/services/image"
    create_directory "apps/ocr-service/app/services/ml"
    create_directory "apps/ocr-service/app/models"
    create_directory "apps/ocr-service/app/utils"
    create_directory "apps/ocr-service/tests"
    create_directory "apps/ocr-service/uploads"
    create_directory "apps/ocr-service/models"

    # 5. 공통 패키지 구조
    log_info "5. 공통 패키지 구조 생성 중..."
    
    # Shared Package
    create_directory "packages/shared"
    create_directory "packages/shared/src"
    create_directory "packages/shared/src/types"
    create_directory "packages/shared/src/constants"
    create_directory "packages/shared/src/utils"
    create_directory "packages/shared/src/schemas"

    # UI Components Package
    create_directory "packages/ui-components"
    create_directory "packages/ui-components/src"
    create_directory "packages/ui-components/src/components"
    create_directory "packages/ui-components/src/components/Button"
    create_directory "packages/ui-components/src/components/Input"
    create_directory "packages/ui-components/src/components/Modal"
    create_directory "packages/ui-components/src/components/Table"
    create_directory "packages/ui-components/src/hooks"
    create_directory "packages/ui-components/src/styles"
    create_directory "packages/ui-components/src/styles/themes"
    create_directory "packages/ui-components/storybook"

    # Database Package
    create_directory "packages/database"
    create_directory "packages/database/src"
    create_directory "packages/database/src/entities"
    create_directory "packages/database/src/migrations"
    create_directory "packages/database/src/seeds"
    create_directory "packages/database/src/config"
    create_directory "packages/database/scripts"

    # 6. Docker 관련 디렉터리
    log_info "6. Docker 관련 디렉터리 생성 중..."
    
    create_directory "docker/nginx"
    create_directory "docker/postgres"
    create_directory "docker/scripts"

    # 7. 기본 파일들 생성
    log_info "7. 기본 파일들 생성 중..."

    # .gitignore
    create_file ".gitignore" "# Dependencies
node_modules/
*/node_modules/
*/*/node_modules/

# Build outputs
dist/
build/
*/dist/
*/build/

# Environment files
.env
.env.local
.env.*.local
!.env.example

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.nyc_output

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Docker
.docker/

# OCR uploads
*/uploads/
uploads/

# Database
*.db
*.sqlite

# Misc
*.tgz
*.tar.gz
.cache/
.temp/
temp/"

    # 루트 package.json
    create_file "package.json" '{
  "name": "recipt-management",
  "version": "1.0.0",
  "description": "광남동성당 청소년위원회 예결산 관리 시스템",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\" \"npm run dev:ocr\"",
    "dev:frontend": "npm run dev --workspace=apps/frontend",
    "dev:backend": "npm run dev --workspace=apps/backend",
    "dev:ocr": "npm run dev --workspace=apps/ocr-service",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up -d",
    "docker:down": "docker-compose -f docker-compose.dev.yml down",
    "setup": "npm install && npm run setup:hooks",
    "setup:hooks": "husky install"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "concurrently": "^8.0.0",
    "eslint": "^8.0.0",
    "husky": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/recipt-management.git"
  },
  "author": "광남동성당 청소년위원회 개발팀",
  "license": "MIT"
}'

    # tsconfig.base.json
    create_file "tsconfig.base.json" '{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "moduleDetection": "force",
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["packages/shared/src/*"],
      "@ui/*": ["packages/ui-components/src/*"],
      "@database/*": ["packages/database/src/*"]
    },
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  },
  "include": [
    "apps/**/*",
    "packages/**/*",
    "scripts/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage"
  ]
}'

    # .env.example
    create_file ".env.example" "# Database Configuration
DATABASE_URL=postgresql://recipt:recipt123@localhost:5432/recipt_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=recipt_db
DATABASE_USER=recipt
DATABASE_PASSWORD=recipt123

# Backend Configuration
BACKEND_PORT=8000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Frontend Configuration
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=예결산 관리 시스템

# OCR Service Configuration
OCR_SERVICE_PORT=8001
OCR_SERVICE_URL=http://localhost:8001
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
SUPPORTED_FORMATS=jpg,jpeg,png,pdf

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
FROM_EMAIL=noreply@recipt.com

# External API Keys
GOOGLE_VISION_API_KEY=
NAVER_CLOVA_API_KEY="

    # README.md 업데이트
    create_file "README.md" "# 광남동성당 청소년위원회 예결산 관리 시스템

## 프로젝트 개요

광남동성당 청소년위원회의 4개 단체(청년회, 자모회, 초등부 주일학교, 중고등부 주일학교)를 위한 예결산 관리 시스템입니다.

## 기술 스택

### Frontend
- React 18 + TypeScript
- VITE (빌드 도구)
- Tailwind CSS (스타일링)
- Zustand (상태 관리)

### Backend
- NestJS + TypeScript
- PostgreSQL 15 (데이터베이스)
- TypeORM (ORM)
- JWT (인증)

### OCR Service
- Python FastAPI
- TesseractOCR + easyOCR
- PIL (이미지 처리)

### Infrastructure
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Nginx (리버스 프록시)

## 시작하기

### 1. 저장소 클론
\`\`\`bash
git clone https://github.com/your-org/recipt-management.git
cd recipt-management
\`\`\`

### 2. 의존성 설치
\`\`\`bash
npm run setup
\`\`\`

### 3. 환경 변수 설정
\`\`\`bash
cp .env.example .env.development
# .env.development 파일을 편집하여 필요한 값들을 설정
\`\`\`

### 4. Docker 환경 시작
\`\`\`bash
npm run docker:dev
\`\`\`

### 5. 개발 서버 시작
\`\`\`bash
npm run dev
\`\`\`

## 개발 환경

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **OCR Service**: http://localhost:8001
- **Database**: postgresql://localhost:5432/recipt_db

## 프로젝트 구조

\`\`\`
recipt-management/
├── apps/                       # 애플리케이션 서비스들
│   ├── frontend/               # React 프론트엔드
│   ├── backend/                # NestJS 백엔드
│   └── ocr-service/            # Python OCR 서비스
├── packages/                   # 공통 패키지
│   ├── shared/                 # 공통 타입, 유틸리티
│   ├── ui-components/          # 재사용 UI 컴포넌트
│   └── database/               # 데이터베이스 스키마
├── docs/                       # 프로젝트 문서
└── scripts/                    # 개발 편의 스크립트
\`\`\`

## 주요 기능

1. **사용자 관리**
   - 회원가입/로그인
   - 단체별 권한 관리

2. **예산 관리**
   - 행사별 예산서 작성
   - 예산상세내역서 생성

3. **결산 관리**
   - 영수증 OCR 인식
   - 결산서 자동 생성

4. **문서 관리**
   - A4 양식 인쇄
   - PDF 다운로드

5. **블로그**
   - 공지사항 관리
   - 소식 공유

## 개발 가이드

자세한 개발 가이드는 [docs/setup/development-guide.md](docs/setup/development-guide.md)를 참고하세요.

## 라이선스

MIT License
"

    # GitHub PR 템플릿
    create_file ".github/pull_request_template.md" "## 변경 사항 요약

간략하게 이 PR의 변경 사항을 설명해 주세요.

## 변경 유형

- [ ] 🚀 새로운 기능 (New Feature)
- [ ] 🐛 버그 수정 (Bug Fix)
- [ ] 📚 문서 업데이트 (Documentation)
- [ ] 🎨 코드 스타일 개선 (Code Style)
- [ ] ♻️ 리팩토링 (Refactoring)
- [ ] ⚡ 성능 개선 (Performance)
- [ ] ✅ 테스트 추가/수정 (Test)
- [ ] 🔧 빌드/설정 변경 (Build/Config)

## 테스트

- [ ] 단위 테스트 추가/수정
- [ ] 통합 테스트 추가/수정
- [ ] 수동 테스트 완료

## 체크리스트

- [ ] 코드가 프로젝트의 스타일 가이드를 준수합니다
- [ ] 자체 리뷰를 수행했습니다
- [ ] 코드에 명확한 주석을 추가했습니다
- [ ] 변경 사항에 대한 테스트를 작성했습니다
- [ ] 새로운 테스트와 기존 테스트가 모두 통과합니다
- [ ] 종속성에 대한 변경 사항이 문서화되었습니다

## 관련 이슈

Closes #이슈번호

## 스크린샷 (해당하는 경우)

변경 사항을 보여주는 스크린샷을 첨부해 주세요.

## 추가 정보

리뷰어가 알아야 할 추가 정보가 있다면 작성해 주세요.
"

    # __init__.py 파일들 생성
    find apps/ocr-service -type d -name "*.py" -prune -o -type d -print | while read dir; do
        if [[ "$dir" == *"/app"* ]] || [[ "$dir" == *"/app/"* ]]; then
            create_file "$dir/__init__.py" ""
        fi
    done

    # index.ts 파일들 생성
    create_file "packages/shared/src/index.ts" "export * from './types';
export * from './constants';
export * from './utils';
export * from './schemas';"

    create_file "packages/ui-components/src/index.ts" "export * from './components';"

    create_file "packages/database/src/index.ts" "export * from './entities';
export * from './config';"

    # VSCode 설정
    create_file ".vscode/settings.json" '{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/coverage": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}'

    create_file ".vscode/extensions.json" '{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.flake8",
    "ms-python.black-formatter",
    "ms-vscode.vscode-json",
    "yzhang.markdown-all-in-one",
    "ms-vscode.vscode-docker"
  ]
}'

    # 완료 메시지
    log_success "======================================================="
    log_success "디렉터리 구조 생성이 완료되었습니다!"
    log_success "======================================================="
    
    echo ""
    log_info "다음 단계:"
    log_info "1. npm run setup          # 의존성 설치 및 Git hooks 설정"
    log_info "2. 환경 변수 설정          # .env.development 파일 편집"
    log_info "3. npm run docker:dev     # Docker 개발 환경 시작"
    log_info "4. npm run dev            # 개발 서버 시작"
    echo ""
    log_info "자세한 내용은 README.md와 docs/ 폴더를 참고하세요."
}

# 스크립트 실행
main "$@"