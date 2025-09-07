# 광남동성당 청소년위원회 예결산 관리 시스템 - 기술명세서 (TSD)

## 문서 개요

이 기술명세서는 광남동성당 청소년위원회 예결산 관리 시스템의 구체적인 구현 방법을 제시하는 개발자 중심 문서입니다. PRD.md에서 정의된 비즈니스 요구사항을 바탕으로 실제 개발에 필요한 기술적 세부사항을 다룹니다.

## 문서 구성

### 📋 **01. API 명세서** (`01_API_Specification.md`)
- REST API 엔드포인트 상세 정의
- 요청/응답 스키마
- 인증 및 권한 처리 방식
- 에러 코드 및 처리

### 🗄️ **02. 데이터베이스 스키마** (`02_Database_Schema.md`)
- PostgreSQL 테이블 구조 상세 설계
- ERD 다이어그램
- 인덱스 최적화 전략
- 마이그레이션 스크립트

### 🎨 **03. 프론트엔드 아키텍처** (`03_Frontend_Architecture.md`)
- React + VITE 프로젝트 구조
- 컴포넌트 계층구조
- 상태 관리 (Redux/Zustand)
- 라우팅 및 레이아웃

### ⚙️ **04. 백엔드 아키텍처** (`04_Backend_Architecture.md`)
- NestJS 모듈 구조
- 서비스 레이어 설계
- DTO 및 엔티티 정의
- 미들웨어 및 가드 구현

### 🔍 **05. OCR 시스템** (`05_OCR_System.md`)
- Python OCR 서비스 아키텍처
- TesseractOCR + easyOCR 통합
- 이미지 전처리 파이프라인
- 머신러닝 학습 시스템

### 🔒 **06. 보안 구현** (`06_Security_Implementation.md`)
- JWT 인증 시스템
- 권한 기반 접근 제어
- 데이터 암호화
- 보안 미들웨어

### ⚡ **07. 성능 최적화** (`07_Performance_Optimization.md`)
- 데이터베이스 최적화
- 캐싱 전략
- 이미지 처리 최적화
- API 응답 최적화

### 🐳 **08. 개발환경 설정** (`08_Development_Environment.md`)
- Docker 컨테이너 구성
- 개발 도구 설정
- CI/CD 파이프라인
- 코딩 컨벤션

## 기술 스택 요약

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: VITE 5.x
- **State Management**: Redux Toolkit
- **UI Library**: Tailwind CSS + shadcn/ui
- **HTTP Client**: Axios

### Backend  
- **Framework**: NestJS 10 + TypeScript
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: Class Validator
- **Documentation**: Swagger/OpenAPI

### Database
- **RDBMS**: PostgreSQL 15
- **Migration**: TypeORM Migrations
- **Connection Pool**: TypeORM Built-in

### OCR & ML
- **Language**: Python 3.11
- **OCR Engines**: TesseractOCR, easyOCR
- **ML Framework**: scikit-learn, OpenCV
- **API Framework**: FastAPI

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **File Storage**: Local Filesystem
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx

## 개발 우선순위

### Phase 1: 핵심 인프라 (2주)
1. Docker 개발환경 구축
2. PostgreSQL 데이터베이스 설계
3. NestJS 백엔드 기본 구조
4. React 프론트엔드 기본 구조

### Phase 2: 사용자 인증 및 기본 CRUD (3주)
1. JWT 인증 시스템
2. 사용자 관리 API
3. 단체 및 행사 관리
4. 기본 UI 컴포넌트

### Phase 3: 예결산 핵심 기능 (4주)
1. 예산서 작성 워크플로우
2. 결산서 작성 워크플로우
3. 인쇄 시스템
4. 블로그 시스템

### Phase 4: OCR 시스템 (3주)
1. Python OCR 서비스
2. 영수증 처리 파이프라인
3. 머신러닝 학습 시스템
4. OCR 결과 검토 UI

## 코딩 컨벤션

### TypeScript/JavaScript
```typescript
// 인터페이스 네이밍: PascalCase with I prefix
interface IUser {
  id: string;
  email: string;
}

// 클래스 네이밍: PascalCase
class UserService {
  // 메소드 네이밍: camelCase
  async createUser(userData: CreateUserDto): Promise<User> {
    // 구현
  }
}

// 상수 네이밍: UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
```

### Python
```python
# 클래스 네이밍: PascalCase
class OCRProcessor:
    def __init__(self):
        pass
    
    # 메소드 네이밍: snake_case
    def process_receipt_image(self, image_path: str) -> dict:
        pass

# 상수 네이밍: UPPER_SNAKE_CASE
MAX_IMAGE_SIZE = 10 * 1024 * 1024
```

## 브랜치 전략

```
main (production)
├── develop (integration)
├── feature/auth-system
├── feature/budget-workflow
├── feature/ocr-integration
└── hotfix/security-patch
```

## 문서 사용법

1. **개발 시작 전**: 08_Development_Environment.md로 환경 설정
2. **API 개발 시**: 01_API_Specification.md 참조
3. **DB 작업 시**: 02_Database_Schema.md 참조
4. **프론트엔드 개발 시**: 03_Frontend_Architecture.md 참조
5. **백엔드 개발 시**: 04_Backend_Architecture.md 참조
6. **OCR 개발 시**: 05_OCR_System.md 참조
7. **보안 구현 시**: 06_Security_Implementation.md 참조
8. **성능 이슈 시**: 07_Performance_Optimization.md 참조

## 업데이트 이력

- v1.0 - 초기 TSD 작성 및 구조 설계 (현재)

---

*각 챕터별 상세 문서를 참조하여 구체적인 구현 가이드라인을 확인하세요.*