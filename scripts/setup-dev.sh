#!/bin/bash

# =================================================================
# 개발환경 의존성 설치 자동화 스크립트
# 프로젝트: 광남동성당 청소년위원회 예결산 관리 시스템
# 설명: 모든 서비스의 의존성을 컨테이너 내에서 설치
# =================================================================

set -e  # 에러 발생 시 즉시 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
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

# 프로젝트 루트 디렉터리로 이동
cd "$(dirname "$0")/.."

# Docker 및 Docker Compose 확인
if ! command -v docker &> /dev/null; then
    log_error "Docker가 설치되지 않았습니다."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose가 설치되지 않았습니다."
    exit 1
fi

log_info "🏗️ 개발환경 의존성 설치를 시작합니다..."

# 컨테이너 실행 상태 확인
check_container_running() {
    local service=$1
    if ! docker-compose -f docker-compose.dev.yml ps -q $service | grep -q .; then
        log_error "$service 컨테이너가 실행되지 않았습니다."
        log_info "먼저 개발환경을 시작하세요: ./scripts/dev-start.sh"
        exit 1
    fi
}

# 옵션 처리
install_frontend=true
install_backend=true
install_ocr=true

case "${1:-all}" in
    "frontend"|"fe")
        install_backend=false
        install_ocr=false
        ;;
    "backend"|"be")
        install_frontend=false
        install_ocr=false
        ;;
    "ocr")
        install_frontend=false
        install_backend=false
        ;;
    "all")
        # 모든 서비스 설치 (기본값)
        ;;
    "--help"|"-h")
        echo "사용법: $0 [서비스]"
        echo ""
        echo "서비스:"
        echo "  all (기본값)  모든 서비스의 의존성 설치"
        echo "  frontend, fe  프론트엔드만 설치"
        echo "  backend, be   백엔드만 설치"
        echo "  ocr          OCR 서비스만 설치"
        echo ""
        echo "예시:"
        echo "  $0           # 모든 서비스"
        echo "  $0 frontend  # 프론트엔드만"
        exit 0
        ;;
    *)
        log_error "알 수 없는 서비스입니다: $1"
        log_info "도움말: $0 --help"
        exit 1
        ;;
esac

# 프론트엔드 의존성 설치
if [ "$install_frontend" = true ]; then
    log_info "📦 프론트엔드 의존성을 설치합니다..."
    check_container_running frontend
    
    # Node.js 버전 확인
    node_version=$(docker-compose -f docker-compose.dev.yml exec -T frontend node --version 2>/dev/null || echo "unknown")
    log_info "Node.js 버전: $node_version"
    
    # npm 의존성 설치
    docker-compose -f docker-compose.dev.yml exec -T frontend npm ci
    
    # 패키지 보안 취약점 확인
    log_info "보안 취약점을 확인합니다..."
    docker-compose -f docker-compose.dev.yml exec -T frontend npm audit --audit-level=high || log_warning "보안 취약점이 발견되었습니다."
    
    log_success "프론트엔드 의존성 설치 완료"
fi

# 백엔드 의존성 설치
if [ "$install_backend" = true ]; then
    log_info "📦 백엔드 의존성을 설치합니다..."
    check_container_running backend
    
    # Node.js 버전 확인
    node_version=$(docker-compose -f docker-compose.dev.yml exec -T backend node --version 2>/dev/null || echo "unknown")
    log_info "Node.js 버전: $node_version"
    
    # npm 의존성 설치
    docker-compose -f docker-compose.dev.yml exec -T backend npm ci
    
    # NestJS CLI 전역 설치 확인
    if ! docker-compose -f docker-compose.dev.yml exec -T backend npx @nestjs/cli --version &>/dev/null; then
        log_warning "NestJS CLI를 전역 설치합니다..."
        docker-compose -f docker-compose.dev.yml exec -T backend npm install -g @nestjs/cli
    fi
    
    # TypeScript 컴파일 테스트
    log_info "TypeScript 컴파일을 테스트합니다..."
    docker-compose -f docker-compose.dev.yml exec -T backend npm run build
    
    # 패키지 보안 취약점 확인
    log_info "보안 취약점을 확인합니다..."
    docker-compose -f docker-compose.dev.yml exec -T backend npm audit --audit-level=high || log_warning "보안 취약점이 발견되었습니다."
    
    log_success "백엔드 의존성 설치 완료"
fi

# OCR 서비스 의존성 설치
if [ "$install_ocr" = true ]; then
    log_info "📦 OCR 서비스 의존성을 설치합니다..."
    check_container_running ocr-service
    
    # Python 버전 확인
    python_version=$(docker-compose -f docker-compose.dev.yml exec -T ocr-service python --version 2>/dev/null || echo "unknown")
    log_info "Python 버전: $python_version"
    
    # pip 업그레이드
    docker-compose -f docker-compose.dev.yml exec -T ocr-service pip install --upgrade pip
    
    # 운영 의존성 설치
    docker-compose -f docker-compose.dev.yml exec -T ocr-service pip install -r requirements.txt
    
    # 개발 의존성 설치 (있는 경우)
    if docker-compose -f docker-compose.dev.yml exec -T ocr-service test -f requirements-dev.txt; then
        docker-compose -f docker-compose.dev.yml exec -T ocr-service pip install -r requirements-dev.txt
    fi
    
    # Tesseract 설치 확인
    if docker-compose -f docker-compose.dev.yml exec -T ocr-service tesseract --version &>/dev/null; then
        tesseract_version=$(docker-compose -f docker-compose.dev.yml exec -T ocr-service tesseract --version | head -1)
        log_info "Tesseract 버전: $tesseract_version"
    else
        log_warning "Tesseract OCR이 설치되지 않았습니다."
    fi
    
    # 패키지 보안 취약점 확인
    log_info "보안 취약점을 확인합니다..."
    docker-compose -f docker-compose.dev.yml exec -T ocr-service safety check || log_warning "보안 취약점이 발견되었거나 safety 도구가 없습니다."
    
    log_success "OCR 서비스 의존성 설치 완료"
fi

# 의존성 설치 후 검증
log_info "🔍 설치된 의존성을 검증합니다..."

# 컨테이너 재시작
log_info "변경사항 적용을 위해 컨테이너를 재시작합니다..."
if [ "$install_frontend" = true ]; then
    docker-compose -f docker-compose.dev.yml restart frontend
fi
if [ "$install_backend" = true ]; then
    docker-compose -f docker-compose.dev.yml restart backend
fi
if [ "$install_ocr" = true ]; then
    docker-compose -f docker-compose.dev.yml restart ocr-service
fi

# 서비스 헬스체크
log_info "⏳ 서비스 재시작을 기다립니다..."
sleep 15

# 헬스체크 함수
check_health() {
    local service_name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        log_success "$service_name 서비스가 정상 동작합니다."
    else
        log_warning "$service_name 서비스 확인이 필요합니다."
    fi
}

if [ "$install_backend" = true ]; then
    check_health "백엔드 API" "http://localhost:8000/api/health"
fi

if [ "$install_frontend" = true ]; then
    check_health "프론트엔드" "http://localhost:3000"
fi

if [ "$install_ocr" = true ]; then
    check_health "OCR 서비스" "http://localhost:8001/health"
fi

echo ""
log_success "🎉 의존성 설치가 완료되었습니다!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛠️ 다음 단계:"
echo "  • 개발 시작: 브라우저에서 http://localhost:3000 접속"
echo "  • API 문서: http://localhost:8000/api/docs"
echo "  • 로그 확인: docker-compose -f docker-compose.dev.yml logs -f"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"