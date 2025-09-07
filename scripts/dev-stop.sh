#!/bin/bash

# =================================================================
# 개발환경 중지 스크립트
# 프로젝트: 광남동성당 청소년위원회 예결산 관리 시스템
# 설명: Docker Compose 기반 개발환경 안전한 중지
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

# Docker Compose 파일 존재 확인
if [ ! -f docker-compose.dev.yml ]; then
    log_error "docker-compose.dev.yml 파일을 찾을 수 없습니다."
    exit 1
fi

log_info "🛑 개발환경을 중지합니다..."

# 실행 중인 컨테이너 표시
log_info "현재 실행 중인 서비스:"
docker-compose -f docker-compose.dev.yml ps

# 서비스 중지 옵션에 따른 처리
case "${1:-default}" in
    "--clean"|"-c")
        log_warning "🧹 모든 컨테이너와 볼륨을 삭제합니다..."
        docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
        
        # 개발용 이미지 정리
        log_info "개발용 Docker 이미지를 정리합니다..."
        docker images | grep -E "recipt-(frontend|backend|ocr)" | awk '{print $3}' | xargs -r docker rmi -f
        
        log_success "모든 리소스가 정리되었습니다."
        ;;
        
    "--volumes"|"-v")
        log_warning "🗃️ 볼륨과 함께 서비스를 중지합니다..."
        docker-compose -f docker-compose.dev.yml down --volumes
        log_success "서비스와 볼륨이 중지되었습니다."
        ;;
        
    "--force"|"-f")
        log_warning "⚡ 강제로 서비스를 중지합니다..."
        docker-compose -f docker-compose.dev.yml kill
        docker-compose -f docker-compose.dev.yml down --remove-orphans
        log_success "서비스가 강제로 중지되었습니다."
        ;;
        
    "default")
        log_info "📥 서비스를 안전하게 중지합니다..."
        docker-compose -f docker-compose.dev.yml stop
        
        # 컨테이너 제거 여부 확인
        echo ""
        read -p "컨테이너를 제거하시겠습니까? [y/N]: " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f docker-compose.dev.yml down --remove-orphans
            log_success "서비스가 중지되고 컨테이너가 제거되었습니다."
        else
            log_info "서비스만 중지되었습니다. 컨테이너는 유지됩니다."
            log_info "다시 시작하려면: docker-compose -f docker-compose.dev.yml start"
        fi
        ;;
        
    "--help"|"-h")
        echo "사용법: $0 [옵션]"
        echo ""
        echo "옵션:"
        echo "  (기본값)     서비스 중지 및 컨테이너 제거 여부 확인"
        echo "  --clean, -c  모든 컨테이너, 볼륨, 이미지 삭제"
        echo "  --volumes, -v 볼륨과 함께 서비스 중지"
        echo "  --force, -f  강제로 서비스 중지"
        echo "  --help, -h   이 도움말 표시"
        echo ""
        echo "예시:"
        echo "  $0              # 일반 중지"
        echo "  $0 --clean      # 완전 정리"
        echo "  $0 --volumes    # 볼륨까지 삭제"
        exit 0
        ;;
        
    *)
        log_error "알 수 없는 옵션입니다: $1"
        log_info "도움말: $0 --help"
        exit 1
        ;;
esac

# 남은 컨테이너 확인
remaining_containers=$(docker-compose -f docker-compose.dev.yml ps -q 2>/dev/null | wc -l)
if [ "$remaining_containers" -gt 0 ]; then
    log_info "남은 서비스:"
    docker-compose -f docker-compose.dev.yml ps
else
    log_success "모든 서비스가 중지되었습니다."
fi

echo ""
log_info "🎯 개발환경 중지가 완료되었습니다."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛠️ 유용한 명령어:"
echo "  • 개발환경 시작: ./scripts/dev-start.sh"
echo "  • 로그 확인: docker-compose -f docker-compose.dev.yml logs"
echo "  • 시스템 정리: docker system prune"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"