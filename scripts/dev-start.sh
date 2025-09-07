#!/bin/bash

# =================================================================
# 개발환경 시작 스크립트
# 프로젝트: 광남동성당 청소년위원회 예결산 관리 시스템
# 설명: Docker Compose 기반 개발환경 전체 시작
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

# Docker 및 Docker Compose 설치 확인
if ! command -v docker &> /dev/null; then
    log_error "Docker가 설치되지 않았습니다. Docker를 설치해주세요."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose가 설치되지 않았습니다."
    exit 1
fi

# Docker 데몬 실행 확인
if ! docker info &> /dev/null; then
    log_error "Docker 데몬이 실행되지 않았습니다. Docker를 시작해주세요."
    exit 1
fi

log_info "🚀 개발환경을 시작합니다..."

# 기존 컨테이너 정리 (선택적)
if [ "$1" = "--clean" ]; then
    log_warning "기존 컨테이너를 정리합니다..."
    docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
fi

# 환경 변수 파일 확인
if [ ! -f .env.development ]; then
    log_warning ".env.development 파일이 없습니다. 기본값을 사용합니다."
fi

# Docker 이미지 빌드 (필요시)
log_info "📦 Docker 이미지를 확인/빌드합니다..."
docker-compose -f docker-compose.dev.yml build

# 서비스 시작
log_info "🔧 서비스를 시작합니다..."
docker-compose -f docker-compose.dev.yml up -d

# 서비스 상태 확인
log_info "⏳ 서비스 시작을 기다립니다..."
sleep 10

# 헬스체크
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "$service_name 서비스가 정상적으로 시작되었습니다."
            return 0
        fi
        log_info "$service_name 시작 대기 중... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "$service_name 서비스 시작에 실패했습니다."
    return 1
}

# 각 서비스 헬스체크
log_info "🏥 서비스 상태를 확인합니다..."

# 데이터베이스 연결 확인
if docker-compose -f docker-compose.dev.yml exec -T database pg_isready -U recipt_dev > /dev/null 2>&1; then
    log_success "PostgreSQL 데이터베이스가 준비되었습니다."
else
    log_error "PostgreSQL 데이터베이스 연결에 실패했습니다."
fi

# Redis 연결 확인
if docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    log_success "Redis 캐시가 준비되었습니다."
else
    log_error "Redis 캐시 연결에 실패했습니다."
fi

# 백엔드 API 확인
check_service "백엔드 API" "http://localhost:8000/api/health"

# 프론트엔드 확인
check_service "프론트엔드" "http://localhost:3000"

# OCR 서비스 확인
check_service "OCR 서비스" "http://localhost:8001/health"

# 실행 중인 컨테이너 표시
log_info "📊 현재 실행 중인 서비스:"
docker-compose -f docker-compose.dev.yml ps

# 로그 확인 안내
echo ""
log_info "🎉 개발환경이 성공적으로 시작되었습니다!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 서비스 접속 정보:"
echo "  • 프론트엔드: http://localhost:3000"
echo "  • 백엔드 API: http://localhost:8000"
echo "  • API 문서: http://localhost:8000/api/docs"
echo "  • OCR 서비스: http://localhost:8001"
echo "  • 데이터베이스: localhost:5432 (recipt_dev/password123)"
echo "  • Redis: localhost:6379"
echo ""
echo "🛠️ 유용한 명령어:"
echo "  • 로그 보기: docker-compose -f docker-compose.dev.yml logs -f"
echo "  • 서비스 중지: ./scripts/dev-stop.sh"
echo "  • 데이터베이스 초기화: ./scripts/db-reset.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"