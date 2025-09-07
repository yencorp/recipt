#!/bin/bash

# =================================================================
# 데이터베이스 초기화 스크립트
# 프로젝트: 광남동성당 청소년위원회 예결산 관리 시스템
# 설명: PostgreSQL 데이터베이스 완전 초기화 및 스키마 재생성
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

# 데이터베이스 컨테이너 실행 확인
if ! docker-compose -f docker-compose.dev.yml ps -q database | grep -q .; then
    log_error "데이터베이스 컨테이너가 실행되지 않았습니다."
    log_info "먼저 개발환경을 시작하세요: ./scripts/dev-start.sh"
    exit 1
fi

# 옵션 처리
force_reset=false
backup_data=false
load_seed_data=true

while [[ $# -gt 0 ]]; do
    case $1 in
        "--force"|"-f")
            force_reset=true
            shift
            ;;
        "--backup"|"-b")
            backup_data=true
            shift
            ;;
        "--no-seed")
            load_seed_data=false
            shift
            ;;
        "--help"|"-h")
            echo "사용법: $0 [옵션]"
            echo ""
            echo "옵션:"
            echo "  --force, -f    강제로 데이터베이스 초기화 (확인 없이)"
            echo "  --backup, -b   초기화 전 데이터베이스 백업"
            echo "  --no-seed     시드 데이터 로드 건너뛰기"
            echo "  --help, -h    이 도움말 표시"
            echo ""
            echo "예시:"
            echo "  $0              # 일반 초기화 (확인 후)"
            echo "  $0 --force      # 강제 초기화"
            echo "  $0 --backup     # 백업 후 초기화"
            exit 0
            ;;
        *)
            log_error "알 수 없는 옵션입니다: $1"
            log_info "도움말: $0 --help"
            exit 1
            ;;
    esac
done

# 데이터베이스 연결 정보
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="recipt_dev"
DB_USER="recipt_dev"
DB_PASSWORD="password123"

# 데이터베이스 연결 테스트
test_connection() {
    if docker-compose -f docker-compose.dev.yml exec -T database pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 사용자 확인 (force 모드가 아닌 경우)
if [ "$force_reset" = false ]; then
    echo ""
    log_warning "⚠️  데이터베이스를 완전히 초기화합니다."
    log_warning "   모든 데이터가 삭제되며 복구할 수 없습니다."
    echo ""
    read -p "계속 진행하시겠습니까? [y/N]: " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "작업이 취소되었습니다."
        exit 0
    fi
fi

log_info "🗃️ 데이터베이스 초기화를 시작합니다..."

# 데이터베이스 연결 확인
if ! test_connection; then
    log_error "데이터베이스에 연결할 수 없습니다."
    exit 1
fi

# 데이터베이스 백업 (옵션)
if [ "$backup_data" = true ]; then
    backup_dir="backups"
    backup_file="$backup_dir/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p $backup_dir
    
    log_info "💾 데이터베이스를 백업합니다: $backup_file"
    docker-compose -f docker-compose.dev.yml exec -T database pg_dump \
        -U $DB_USER -d $DB_NAME > $backup_file
    
    if [ -f $backup_file ]; then
        log_success "백업이 완료되었습니다: $backup_file"
    else
        log_error "백업에 실패했습니다."
        exit 1
    fi
fi

# 백엔드 서비스 임시 중지 (데이터베이스 연결 해제)
log_info "📥 백엔드 서비스를 임시 중지합니다..."
if docker-compose -f docker-compose.dev.yml ps -q backend | grep -q .; then
    docker-compose -f docker-compose.dev.yml stop backend
    backend_was_running=true
else
    backend_was_running=false
fi

# 데이터베이스 초기화
log_info "🧹 데이터베이스를 초기화합니다..."

# 모든 테이블 삭제
docker-compose -f docker-compose.dev.yml exec -T database psql -U $DB_USER -d $DB_NAME -c "
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL ON SCHEMA public TO public;
"

log_success "기존 스키마가 삭제되었습니다."

# 초기화 SQL 스크립트 실행 (있는 경우)
if [ -d "database/init" ]; then
    log_info "📄 초기화 스크립트를 실행합니다..."
    for sql_file in database/init/*.sql; do
        if [ -f "$sql_file" ]; then
            log_info "실행 중: $(basename $sql_file)"
            docker-compose -f docker-compose.dev.yml exec -T database psql \
                -U $DB_USER -d $DB_NAME -f "/docker-entrypoint-initdb.d/$(basename $sql_file)"
        fi
    done
    log_success "초기화 스크립트 실행 완료"
fi

# 백엔드 서비스 재시작 및 마이그레이션
if [ "$backend_was_running" = true ]; then
    log_info "🔄 백엔드 서비스를 재시작합니다..."
    docker-compose -f docker-compose.dev.yml start backend
    
    # 백엔드 서비스 준비 대기
    log_info "⏳ 백엔드 서비스 준비를 기다립니다..."
    sleep 10
    
    # TypeORM 마이그레이션 실행 (백엔드가 NestJS + TypeORM 사용 시)
    log_info "📊 데이터베이스 마이그레이션을 실행합니다..."
    if docker-compose -f docker-compose.dev.yml exec -T backend npm run migration:run 2>/dev/null; then
        log_success "마이그레이션이 완료되었습니다."
    else
        log_warning "마이그레이션을 실행할 수 없습니다. 수동으로 실행해주세요."
    fi
fi

# 시드 데이터 로드
if [ "$load_seed_data" = true ]; then
    log_info "🌱 시드 데이터를 로드합니다..."
    
    # 시드 데이터 디렉터리 확인
    if [ -d "database/seeds" ]; then
        for seed_file in database/seeds/*.sql; do
            if [ -f "$seed_file" ]; then
                log_info "로딩: $(basename $seed_file)"
                docker-compose -f docker-compose.dev.yml exec -T database psql \
                    -U $DB_USER -d $DB_NAME -f "/docker-entrypoint-initdb.d/seeds/$(basename $seed_file)"
            fi
        done
    fi
    
    # NestJS 시드 명령어 실행 (있는 경우)
    if [ "$backend_was_running" = true ]; then
        if docker-compose -f docker-compose.dev.yml exec -T backend npm run seed 2>/dev/null; then
            log_success "시드 데이터 로드 완료"
        else
            log_info "NestJS 시드 명령어를 찾을 수 없습니다."
        fi
    fi
fi

# 데이터베이스 상태 확인
log_info "🔍 데이터베이스 상태를 확인합니다..."

# 연결 테스트
if test_connection; then
    log_success "데이터베이스 연결이 정상입니다."
else
    log_error "데이터베이스 연결에 문제가 있습니다."
    exit 1
fi

# 테이블 목록 확인
table_count=$(docker-compose -f docker-compose.dev.yml exec -T database psql \
    -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' \n')

log_info "생성된 테이블 수: $table_count"

if [ "$table_count" -gt 0 ]; then
    log_info "테이블 목록:"
    docker-compose -f docker-compose.dev.yml exec -T database psql \
        -U $DB_USER -d $DB_NAME -c "\dt"
fi

# Redis 캐시 초기화 (선택적)
log_info "🧹 Redis 캐시를 초기화합니다..."
if docker-compose -f docker-compose.dev.yml exec -T redis redis-cli FLUSHALL > /dev/null 2>&1; then
    log_success "Redis 캐시가 초기화되었습니다."
else
    log_warning "Redis 캐시 초기화에 실패했습니다."
fi

echo ""
log_success "🎉 데이터베이스 초기화가 완료되었습니다!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 데이터베이스 정보:"
echo "  • 호스트: $DB_HOST:$DB_PORT"
echo "  • 데이터베이스: $DB_NAME"
echo "  • 사용자: $DB_USER"
echo "  • 생성된 테이블: $table_count개"
if [ "$backup_data" = true ] && [ -f "$backup_file" ]; then
echo "  • 백업 파일: $backup_file"
fi
echo ""
echo "🛠️ 유용한 명령어:"
echo "  • 데이터베이스 접속: docker-compose -f docker-compose.dev.yml exec database psql -U $DB_USER -d $DB_NAME"
echo "  • 백엔드 로그 확인: docker-compose -f docker-compose.dev.yml logs backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"