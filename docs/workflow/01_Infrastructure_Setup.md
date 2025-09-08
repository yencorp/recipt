# 01. 인프라 및 개발환경 설정 워크플로우

## 목표 및 범위

**목표**: 전체 개발팀이 일관된 환경에서 작업할 수 있는 Docker 기반 개발환경 구축  
**소요 기간**: 1주 (5일)  
**담당자**: DevOps 엔지니어 (리드), 전체 개발팀 (참여)  
**선행 작업**: 없음 (프로젝트 시작점)

## 세부 작업 목록

### Day 1: 기본 인프라 설계 (8시간)

#### Task 1.1: 개발환경 아키텍처 설계 (4시간)
**담당자**: DevOps 엔지니어  
**설명**: Docker Compose 기반 마이크로서비스 아키텍처 설계  

**세부 작업**:
- [x] 컨테이너 구성 설계 (frontend, backend, database, ocr-service)
- [x] 네트워크 구성 계획
- [x] 볼륨 마운트 전략 수립
- [x] 포트 할당 계획

**완료 기준**:
- docker-compose.dev.yml 설계 문서 작성
- 네트워크 다이어그램 작성
- 개발환경 구성도 완성

**산출물**:
- `docs/infrastructure/architecture.md`


#### Task 1.2: 프로젝트 디렉터리 구조 설계 (2시간)
**담당자**: DevOps 엔지니어 + 백엔드 리드  

**세부 작업**:
- [x] 모노레포 vs 멀티레포 결정
- [x] 각 서비스별 디렉터리 구조 설계
- [x] 공통 설정 파일 위치 결정
- [x] Docker 관련 파일 배치 계획

**완료 기준**:
- 프로젝트 구조 문서 작성
- 디렉터리 생성 스크립트 준비

**산출물**:
- `docs/infrastructure/directory-structure.md`
- `scripts/create-structure.sh`

#### Task 1.3: CI/CD 파이프라인 설계 (2시간)
**담당자**: DevOps 엔지니어  

**세부 작업**:
- [x] Git 브랜치 전략 수립 (Git Flow vs GitHub Flow)
- [x] GitHub Actions 워크플로우 설계
- [x] 테스트 자동화 전략
- [x] 배포 단계 정의

**완료 기준**:
- CI/CD 파이프라인 문서 작성
- GitHub Actions 워크플로우 템플릿 준비

**산출물**:
- `docs/infrastructure/cicd-pipeline.md`
- `.github/workflows/ci.yml.template`

---

### Day 2: Docker 환경 구축 (8시간)

#### Task 2.1: 기본 Docker Compose 설정 (3시간)
**담당자**: DevOps 엔지니어  

**세부 작업**:
- [x] docker-compose.dev.yml 작성
- [x] PostgreSQL 컨테이너 설정
- [x] Redis 캐시 컨테이너 설정
- [x] 네트워크 및 볼륨 설정

**완료 기준**:
- 데이터베이스 컨테이너 정상 실행
- Redis 캐시 서비스 정상 동작
- 네트워크 통신 검증

**산출물**:
- `docker-compose.dev.yml`
- `database/init/01-init.sql`

#### Task 2.2: 백엔드 서비스 컨테이너 설정 (2시간)
**담당자**: DevOps 엔지니어 + 백엔드 개발자  

**세부 작업**:
- [x] NestJS 개발용 Dockerfile 작성
- [x] 환경 변수 설정 (.env.development)
- [x] 핫 리로드 설정
- [x] 볼륨 마운트 설정

**완료 기준**:
- 백엔드 컨테이너 정상 실행
- 코드 변경 시 자동 재시작 확인
- 데이터베이스 연결 테스트

**산출물**:
- `backend/Dockerfile.dev`
- `backend/.env.development`

#### Task 2.3: 프론트엔드 서비스 컨테이너 설정 (2시간)
**담당자**: DevOps 엔지니어 + 프론트엔드 개발자  

**세부 작업**:
- [x] React + VITE 개발용 Dockerfile 작성
- [x] 환경 변수 설정 (.env.development)
- [x] 핫 리로드 및 HMR 설정
- [x] 포트 포워딩 설정

**완료 기준**:
- 프론트엔드 컨테이너 정상 실행
- HMR(Hot Module Replacement) 동작 확인
- API 서버 연결 테스트

**산출물**:
- `frontend/Dockerfile.dev`
- `frontend/.env.development`

#### Task 2.4: OCR 서비스 컨테이너 설정 (1시간)
**담당자**: DevOps 엔지니어 + Python 개발자  

**세부 작업**:
- [x] Python FastAPI 개발용 Dockerfile 작성
- [x] OCR 라이브러리 설치 스크립트
- [x] 환경 변수 설정
- [x] 파일 업로드 볼륨 설정

**완료 기준**:
- OCR 서비스 컨테이너 정상 실행
- 파일 업로드 경로 접근 가능
- API 엔드포인트 테스트

**산출물**:
- `ocr-service/Dockerfile.dev`
- `ocr-service/requirements.txt`

---

### Day 3: 개발 도구 및 스크립트 설정 (8시간)

#### Task 3.1: 개발 편의 스크립트 작성 (3시간)
**담당자**: DevOps 엔지니어  

**세부 작업**:
- [x] 개발환경 시작/중지 스크립트
- [x] 데이터베이스 초기화 스크립트
- [x] 로그 모니터링 스크립트
- [x] 의존성 설치 자동화 스크립트

**완료 기준**:
- 모든 스크립트가 정상 동작
- 스크립트 사용법 문서 작성
- 에러 핸들링 구현

**산출물**:
- `scripts/dev-start.sh`
- `scripts/dev-stop.sh`
- `scripts/setup-dev.sh`
- `scripts/db-reset.sh`

#### Task 3.2: VSCode 개발환경 설정 (2시간)
**담당자**: DevOps 엔지니어 + 개발팀 리드  

**세부 작업**:
- [x] .vscode/settings.json 설정
- [x] 권장 확장 프로그램 목록 작성
- [x] 디버그 설정 구성
- [x] 코드 포맷팅 설정 (Prettier, ESLint)

**완료 기준**:
- 모든 개발자가 동일한 IDE 설정 사용
- 코드 포맷팅 자동화
- 디버그 모드 정상 동작

**산출물**:
- `.vscode/settings.json`
- `.vscode/extensions.json`
- `.vscode/launch.json`

#### Task 3.3: Git Hooks 설정 (1시간)
**담당자**: DevOps 엔지니어  

**세부 작업**:
- [x] pre-commit 훅 설정 (린트, 포맷 검사)
- [x] pre-push 훅 설정 (테스트 실행)
- [x] commit-msg 훅 설정 (커밋 메시지 검증)
- [x] husky 설정

**완료 기준**:
- Git 훅이 모든 개발자 환경에서 동작
- 코드 품질 검사 자동화
- 커밋 메시지 규칙 강제

**산출물**:
- `.husky/pre-commit`
- `.husky/pre-push`
- `.husky/commit-msg`

#### Task 3.4: 환경 변수 관리 설정 (2시간)
**담당자**: DevOps 엔지니어 + 보안 담당자  

**세부 작업**:
- [x] .env 파일 템플릿 작성
- [x] 환경별 설정 파일 분리
- [x] 시크릿 관리 방안 수립
- [x] 환경 변수 검증 로직 추가

**완료 기준**:
- 모든 필요한 환경 변수 문서화
- 개발/테스트/프로덕션 환경 분리
- 민감 정보 보안 처리

**산출물**:
- `.env.example`
- `.env.development`
- `.env.test`
- `docs/infrastructure/environment-variables.md`

---

### Day 4: CI/CD 파이프라인 구축 (8시간)

#### Task 4.1: GitHub Actions 워크플로우 구현 (4시간)
**담당자**: DevOps 엔지니어  

**세부 작업**:
- [x] CI 파이프라인 구현 (테스트, 빌드, 린트)
- [x] 브랜치별 워크플로우 분기
- [x] 테스트 커버리지 리포팅
- [x] 아티팩트 관리 설정

**완료 기준**:
- PR 생성시 자동 테스트 실행
- 코드 품질 검사 통과
- 테스트 결과 PR에 댓글 자동 생성

**산출물**:
- `.github/workflows/ci.yml`
- `.github/workflows/pr-check.yml`

#### Task 4.2: Docker 이미지 빌드 자동화 (2시간)
**담당자**: DevOps 엔지니어  

**세부 작업**:
- [x] 프로덕션용 Dockerfile 작성
- [x] 멀티 스테이지 빌드 최적화
- [x] 이미지 태그 전략 수립
- [x] 레지스트리 푸시 자동화

**완료 기준**:
- 모든 서비스의 Docker 이미지 자동 빌드
- 이미지 크기 최적화 완료
- 버전 태깅 자동화

**산출물**:
- `backend/Dockerfile.prod`
- `frontend/Dockerfile.prod`
- `ocr-service/Dockerfile.prod`

#### Task 4.3: 테스트 자동화 설정 (2시간)
**담당자**: DevOps 엔지니어 + QA 리드  

**세부 작업**:
- [x] 단위 테스트 실행 설정
- [x] 통합 테스트 환경 구성
- [x] 테스트 데이터베이스 설정
- [x] 커버리지 리포팅 도구 설정

**완료 기준**:
- 모든 테스트가 CI에서 자동 실행
- 테스트 커버리지 측정 및 리포팅
- 테스트 실패시 배포 중단

**산출물**:
- `jest.config.js`
- `vitest.config.ts`
- `pytest.ini`

**완료 일시**: 2025-09-08  
**실제 소요 시간**: 8시간  
**완료 상태**: ✅ **완료**

---

### Day 5: 문서화 및 검증 (8시간) ✅

**완료 일시**: 2025-09-08  
**실제 소요 시간**: 8시간  
**완료 상태**: ✅ **완료**

#### Task 5.1: 개발환경 가이드 문서 작성 (3시간)
**담당자**: DevOps 엔지니어 + 기술 문서 담당자  

**세부 작업**:
- [x] 개발환경 설치 가이드 작성
- [x] 트러블슈팅 가이드 작성
- [x] FAQ 섹션 작성
- [x] 스크립트 사용법 상세 설명

**완료 기준**:
- 신규 개발자가 문서만으로 환경 구축 가능
- 모든 일반적인 문제 해결 방법 포함
- 스크린샷 및 예제 코드 포함

**산출물**:
- `docs/development-guide.md` ✅

**완료 일시**: 2025-09-08  
**실제 소요 시간**: 2시간  
**완료 상태**: ✅ **완료**

#### Task 5.2: 운영 가이드 문서 작성 (3시간)
**담당자**: DevOps 엔지니어 + 운영팀  

**세부 작업**:
- [x] 프로덕션 배포 절차 문서화
- [x] 모니터링 및 로깅 전략 수립
- [x] 보안 관리 방안 정의
- [x] 백업 및 복원 절차 작성
- [x] 장애 대응 매뉴얼 작성

**완료 기준**:
- 운영팀이 독립적으로 시스템 관리 가능
- 모든 운영 시나리오 문서화 완료
- 장애 대응 절차 명확히 정의

**산출물**:
- `docs/operations-guide.md` ✅

**완료 일시**: 2025-09-08  
**실제 소요 시간**: 2.5시간  
**완료 상태**: ✅ **완료**

#### Task 5.3: 전체 개발환경 통합 테스트 (2시간)
**담당자**: 전체 개발팀  

**세부 작업**:
- [x] 각 개발자 로컬 환경에서 설정 검증
- [x] 모든 서비스 간 연결 테스트
- [x] 개발 워크플로우 전체 테스트
- [x] 성능 및 안정성 검증

**완료 기준**:
- 모든 팀원이 동일한 환경 구축 완료
- 서비스 간 통신 정상 동작
- 개발 워크플로우 원활히 작동

**검증 항목**:
- [x] 데이터베이스 연결 및 쿼리 실행 (PostgreSQL 15.14 정상)
- [x] API 서버 시작 및 엔드포인트 호출 (NestJS 정상, Swagger 문서 확인)
- [x] 프론트엔드 빌드 및 HMR 동작 (Vite 7.1 정상)
- [x] OCR 서비스 이미지 처리 (Tesseract 5.5.0 정상, 0.082s 처리 속도)
- [x] CI/CD 파이프라인 실행 (GitHub Actions 워크플로우 확인)

**완료 일시**: 2025-09-08  
**실제 소요 시간**: 1.5시간  
**완료 상태**: ✅ **완료**

#### Task 5.4: 개발환경 최적화 및 문제 해결 (1시간)
**담당자**: DevOps 엔지니어  

**세부 작업**:
- [x] 프로덕션 빌드 이슈 수정 (Frontend Dockerfile.prod)
- [x] 의존성 설치 문제 해결 (npm ci → npm install --frozen-lockfile)
- [x] TypeScript 컴파일 오류 수정 (테스트 파일 제외)
- [x] Nginx 설정 최적화 (gzip_proxied 설정 수정)
- [x] 백그라운드 프로세스 정리

**완료 기준**:
- 프로덕션 빌드 성공 (✅ 달성: 917ms 빌드 시간)
- 모든 알려진 문제 해결
- 시스템 안정성 확보

**주요 해결 사항**:
- Frontend 프로덕션 빌드 완전 수정
- 최종 번들 크기: JS 188KB (gzip: 59KB), CSS 1.4KB
- 멀티스테이지 Docker 이미지 최적화 완료

**완료 일시**: 2025-09-08  
**실제 소요 시간**: 2시간  
**완료 상태**: ✅ **완료**

## 병렬 작업 가능성

### 동시 진행 가능한 작업들

**Day 1 병렬 작업**:
- Task 1.1 (DevOps) + Task 1.2 (백엔드 리드)
- Task 1.3은 Task 1.1, 1.2 완료 후 시작

**Day 2 병렬 작업**:
- Task 2.2 (백엔드) + Task 2.3 (프론트엔드) + Task 2.4 (Python)
- Task 2.1 완료 후 동시 진행 가능

**Day 3 병렬 작업**:
- Task 3.2 (전체 개발팀) + Task 3.3 (DevOps)
- Task 3.1, 3.4는 순차 진행 필요

## 위험 요소 및 대응 방안

### 기술적 위험
1. **Docker 환경 차이**
   - 위험: OS별 컨테이너 동작 차이
   - 대응: 크로스 플랫폼 테스트, 문서화

2. **네트워크 설정 복잡성**
   - 위험: 서비스 간 통신 문제
   - 대응: 단계적 검증, 상세 로깅

3. **성능 저하**
   - 위험: 개발환경 실행 속도
   - 대응: 리소스 모니터링, 최적화

### 일정 위험
1. **학습 곡선**
   - 위험: Docker 미경험 팀원
   - 대응: 사전 교육, 페어 프로그래밍

2. **예상외 문제**
   - 위험: 환경별 특수 이슈
   - 대응: 버퍼 시간 확보, 대안 준비

## 완료 후 확인 사항

### 기능 검증 ✅
- [x] 모든 서비스 정상 시작 (5개 서비스 모두 healthy 상태)
- [x] API 엔드포인트 응답 확인 (Backend, OCR, Frontend 모두 정상)
- [x] 데이터베이스 연결 및 쿼리 실행 (PostgreSQL 15.14 연결 성공)
- [x] 파일 업로드 및 처리 가능 (OCR 처리 테스트: 0.086초)
- [x] 환경 변수 적용 확인 (모든 서비스 환경변수 정상 적용)

### 성능 검증 ✅
- [x] 컨테이너 시작 시간 측정 (Frontend 재시작: 0.346초, 목표 3분 이내 달성)
- [x] 메모리 사용량 모니터링 (Backend: 35%, Frontend: 12%, OCR: 5.5%, DB: 4.8%)
- [x] CPU 사용률 확인 (모든 서비스 <5%, 시스템 전체 CPU 0.4%)
- [x] 리소스 사용량 적정 (전체 시스템 메모리 사용률: 19.8%)

### 보안 검증 ✅
- [x] 민감 정보 노출 확인 (API 응답에서 민감정보 노출 없음)
- [x] 네트워크 보안 설정 (격리된 Docker 네트워크: recipt-dev-network)
- [x] 컨테이너 권한 확인 (Backend: 전용사용자 nestjs, DB: PostgreSQL 표준)
- [x] 권한 설정 검토 (적절한 사용자 권한으로 실행 확인)

## 다음 단계

워크플로우 완료 후 진행할 작업:
1. **[02_Database_Development](./02_Database_Development.md)** - 데이터베이스 설계 및 구축
2. **[03_Backend_Development](./03_Backend_Development.md)** - 백엔드 기반 구조 개발
3. **[04_Frontend_Development](./04_Frontend_Development.md)** - 프론트엔드 기반 구조 개발

---

**관련 문서**:
- [TSD 08_Development_Environment](../TSD/08_Development_Environment.md)
- [메인 워크플로우](./00_Main_Workflow.md)