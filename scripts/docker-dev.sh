#!/bin/bash

# =================================================================
# Docker 개발환경 관리 스크립트
# 프로젝트: 광남동성당 청소년위원회 예결산 관리 시스템
# 목적: 개발환경 Docker Compose 관리 자동화
# =================================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Docker Compose 파일 경로
COMPOSE_FILE="docker-compose.dev.yml"
DB_ONLY_FILE="docker-compose.db-only.yml"

# 함수: Docker 및 Docker Compose 확인
check_docker() {
    log_step "Docker 환경 확인 중..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되어 있지 않습니다."
        log_info "Docker Desktop을 설치하세요: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker 데몬이 실행되지 않고 있습니다."
        log_info "Docker Desktop을 실행하고 다시 시도하세요."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose가 설치되어 있지 않습니다."
        exit 1
    fi
    
    log_success "Docker 환경 확인 완료"
}

# 함수: 필요한 디렉터리 생성
create_directories() {
    log_step "필요한 디렉터리 생성 중..."
    
    local directories=(
        "docker/volumes/postgres"
        "docker/volumes/redis"
        "docker/volumes/backend/uploads"
        "docker/volumes/ocr/uploads"
        "docker/volumes/ocr/processed"
        "docker/volumes/ocr/models"
        "database/backups"
        "logs/backend"
        "logs/ocr-service"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "디렉터리 생성: $dir"
        fi
    done
    
    log_success "디렉터리 생성 완료"
}

# 함수: Docker 네트워크 확인 및 생성
setup_network() {
    log_step "Docker 네트워크 설정 중..."
    
    if ! docker network ls | grep -q recipt-dev-network; then
        docker network create recipt-dev-network
        log_success "recipt-dev-network 네트워크 생성 완료"
    else
        log_info "recipt-dev-network 네트워크가 이미 존재합니다"
    fi
}

# 함수: 환경 파일 확인
check_env_files() {
    log_step "환경 파일 확인 중..."
    
    if [ ! -f ".env.development" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.development
            log_success ".env.development 파일 생성됨 (템플릿 기반)"
            log_warning ".env.development 파일을 필요에 맞게 수정하세요"
        else
            log_warning ".env.development 파일이 없습니다. 기본값으로 진행합니다."
        fi
    else
        log_success ".env.development 파일 존재 확인"
    fi
}

# 함수: 서비스 상태 확인
check_services() {
    log_step "서비스 상태 확인 중..."
    
    echo ""
    echo -e "${CYAN}=== 서비스 상태 ===${NC}"
    docker-compose -f "$1" ps
    
    echo ""
    echo -e "${CYAN}=== 헬스체크 상태 ===${NC}"
    docker-compose -f "$1" ps --services | while read service; do
        health_status=$(docker inspect --format='{{.State.Health.Status}}' "recipt-${service}-dev" 2>/dev/null || echo "no-healthcheck")
        if [ "$health_status" = "healthy" ]; then
            echo -e "  ${GREEN}✓${NC} $service: $health_status"
        elif [ "$health_status" = "unhealthy" ]; then
            echo -e "  ${RED}✗${NC} $service: $health_status"
        else
            echo -e "  ${YELLOW}?${NC} $service: $health_status"
        fi
    done
}

# 함수: 로그 표시
show_logs() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        docker-compose -f "$COMPOSE_FILE" logs -f --tail=100 "$service"
    else
        docker-compose -f "$COMPOSE_FILE" logs -f --tail=50
    fi
}

# 함수: 데이터베이스 연결 테스트
test_database() {
    log_step "데이터베이스 연결 테스트 중..."
    
    # PostgreSQL 연결 테스트
    if docker exec recipt-database-dev pg_isready -h localhost -p 5432 -U recipt > /dev/null 2>&1; then
        log_success "PostgreSQL 연결 성공"
        
        # 기본 데이터 확인
        local org_count=$(docker exec recipt-database-dev psql -U recipt -d recipt_db -t -c "SELECT COUNT(*) FROM organizations;" 2>/dev/null | xargs || echo "0")
        log_info "등록된 단체 수: $org_count"
    else
        log_error "PostgreSQL 연결 실패"
        return 1
    fi
    
    # Redis 연결 테스트
    if docker exec recipt-redis-dev redis-cli ping > /dev/null 2>&1; then
        log_success "Redis 연결 성공"
    else
        log_error "Redis 연결 실패"
        return 1
    fi
}

# 함수: 전체 환경 시작
start_full() {
    log_step "전체 개발환경 시작 중..."
    
    check_docker
    create_directories
    setup_network
    check_env_files
    
    log_info "Docker Compose 시작 중... (시간이 소요될 수 있습니다)"
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_info "서비스 시작 대기 중... (30초)"
    sleep 30
    
    check_services "$COMPOSE_FILE"
    
    if test_database; then
        log_success "전체 개발환경 시작 완료!"
        show_access_info
    else
        log_error "일부 서비스에 문제가 있습니다. 로그를 확인하세요."
        return 1
    fi
}

# 함수: 데이터베이스만 시작
start_db_only() {
    log_step "데이터베이스 환경만 시작 중..."
    
    check_docker
    create_directories
    setup_network
    
    log_info "데이터베이스 서비스 시작 중..."
    docker-compose -f "$DB_ONLY_FILE" up -d
    
    log_info "서비스 시작 대기 중... (20초)"
    sleep 20
    
    check_services "$DB_ONLY_FILE"
    
    if test_database; then
        log_success "데이터베이스 환경 시작 완료!"
        show_db_access_info
    else
        log_error "데이터베이스 서비스에 문제가 있습니다."
        return 1
    fi
}

# 함수: 접속 정보 표시
show_access_info() {
    echo ""
    echo -e "${CYAN}=== 🌐 서비스 접속 정보 ===${NC}"
    echo -e "  ${GREEN}Frontend:${NC}     http://localhost:3000"
    echo -e "  ${GREEN}Backend API:${NC}  http://localhost:8000"
    echo -e "  ${GREEN}API Docs:${NC}     http://localhost:8000/api/docs"
    echo -e "  ${GREEN}OCR Service:${NC}  http://localhost:8001"
    echo ""
    show_db_access_info
}

show_db_access_info() {
    echo -e "${CYAN}=== 📊 데이터베이스 접속 정보 ===${NC}"
    echo -e "  ${GREEN}PostgreSQL:${NC}"
    echo -e "    Host: localhost:5432"
    echo -e "    Database: recipt_db"
    echo -e "    User: recipt"
    echo -e "    Password: recipt123"
    echo ""
    echo -e "  ${GREEN}Redis:${NC}"
    echo -e "    Host: localhost:6379"
    echo -e "    Password: redis123"
    echo ""
    echo -e "${CYAN}=== 👥 테스트 계정 ===${NC}"
    echo -e "  ${YELLOW}admin@recipt.com${NC} (관리자)"
    echo -e "  ${YELLOW}youth.leader@recipt.com${NC} (청년회장)"
    echo -e "  ${YELLOW}treasurer@recipt.com${NC} (회계담당)"
    echo -e "  ${YELLOW}test@recipt.com${NC} (일반사용자)"
    echo -e "  공통 비밀번호: ${YELLOW}password${NC}"
    echo ""
}

# 함수: 환경 중지
stop_services() {
    log_step "서비스 중지 중..."
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" stop
        log_success "전체 서비스 중지 완료"
    fi
    
    if [ -f "$DB_ONLY_FILE" ]; then
        docker-compose -f "$DB_ONLY_FILE" stop
        log_success "데이터베이스 서비스 중지 완료"
    fi
}

# 함수: 환경 완전 제거
clean_all() {
    log_warning "모든 컨테이너, 볼륨, 네트워크를 제거합니다."
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_step "환경 완전 정리 중..."
        
        if [ -f "$COMPOSE_FILE" ]; then
            docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
        fi
        
        if [ -f "$DB_ONLY_FILE" ]; then
            docker-compose -f "$DB_ONLY_FILE" down -v --remove-orphans
        fi
        
        # 네트워크 제거
        docker network rm recipt-dev-network 2>/dev/null || true
        docker network rm recipt-test-network 2>/dev/null || true
        
        log_success "환경 정리 완료"
    else
        log_info "정리 작업이 취소되었습니다."
    fi
}

# 함수: 도움말 표시
show_help() {
    echo -e "${CYAN}광남동성당 예결산 관리 시스템 - Docker 개발환경 관리${NC}"
    echo ""
    echo -e "${YELLOW}사용법:${NC}"
    echo "  $0 [command]"
    echo ""
    echo -e "${YELLOW}명령어:${NC}"
    echo -e "  ${GREEN}start${NC}        전체 개발환경 시작 (frontend, backend, database, ocr-service)"
    echo -e "  ${GREEN}start-db${NC}     데이터베이스만 시작 (PostgreSQL, Redis)"
    echo -e "  ${GREEN}stop${NC}         모든 서비스 중지"
    echo -e "  ${GREEN}restart${NC}      모든 서비스 재시작"
    echo -e "  ${GREEN}status${NC}       서비스 상태 확인"
    echo -e "  ${GREEN}logs [service]${NC} 로그 확인 (서비스명 생략시 전체)"
    echo -e "  ${GREEN}test${NC}         데이터베이스 연결 테스트"
    echo -e "  ${GREEN}clean${NC}        모든 컨테이너, 볼륨, 네트워크 제거"
    echo -e "  ${GREEN}help${NC}         이 도움말 표시"
    echo ""
    echo -e "${YELLOW}예시:${NC}"
    echo "  $0 start          # 전체 환경 시작"
    echo "  $0 start-db       # 데이터베이스만 시작"
    echo "  $0 logs backend   # 백엔드 로그 확인"
    echo "  $0 status         # 상태 확인"
    echo ""
}

# 메인 함수
main() {
    case "${1:-help}" in
        "start")
            start_full
            ;;
        "start-db")
            start_db_only
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_full
            ;;
        "status")
            if [ -f "$COMPOSE_FILE" ]; then
                check_services "$COMPOSE_FILE"
            elif [ -f "$DB_ONLY_FILE" ]; then
                check_services "$DB_ONLY_FILE"
            else
                log_error "실행 중인 서비스가 없습니다."
            fi
            ;;
        "logs")
            show_logs "${2:-}"
            ;;
        "test")
            test_database
            ;;
        "clean")
            clean_all
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "알 수 없는 명령어: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"