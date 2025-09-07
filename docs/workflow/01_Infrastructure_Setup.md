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
- [ ] 개발환경 시작/중지 스크립트
- [ ] 데이터베이스 초기화 스크립트
- [ ] 로그 모니터링 스크립트
- [ ] 의존성 설치 자동화 스크립트

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
- [ ] .vscode/settings.json 설정
- [ ] 권장 확장 프로그램 목록 작성
- [ ] 디버그 설정 구성
- [ ] 코드 포맷팅 설정 (Prettier, ESLint)

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
- [ ] pre-commit 훅 설정 (린트, 포맷 검사)
- [ ] pre-push 훅 설정 (테스트 실행)
- [ ] commit-msg 훅 설정 (커밋 메시지 검증)
- [ ] husky 설정

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
- [ ] .env 파일 템플릿 작성
- [ ] 환경별 설정 파일 분리
- [ ] 시크릿 관리 방안 수립
- [ ] 환경 변수 검증 로직 추가

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
- [ ] CI 파이프라인 구현 (테스트, 빌드, 린트)
- [ ] 브랜치별 워크플로우 분기
- [ ] 테스트 커버리지 리포팅
- [ ] 아티팩트 관리 설정

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
- [ ] 프로덕션용 Dockerfile 작성
- [ ] 멀티 스테이지 빌드 최적화
- [ ] 이미지 태그 전략 수립
- [ ] 레지스트리 푸시 자동화

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
- [ ] 단위 테스트 실행 설정
- [ ] 통합 테스트 환경 구성
- [ ] 테스트 데이터베이스 설정
- [ ] 커버리지 리포팅 도구 설정

**완료 기준**:
- 모든 테스트가 CI에서 자동 실행
- 테스트 커버리지 측정 및 리포팅
- 테스트 실패시 배포 중단

**산출물**:
- `jest.config.js`
- `vitest.config.ts`
- `pytest.ini`

---

### Day 5: 문서화 및 검증 (8시간)

#### Task 5.1: 개발환경 가이드 문서 작성 (3시간)
**담당자**: DevOps 엔지니어 + 기술 문서 담당자  

**세부 작업**:
- [ ] 개발환경 설치 가이드 작성
- [ ] 트러블슈팅 가이드 작성
- [ ] FAQ 섹션 작성
- [ ] 스크립트 사용법 상세 설명

**완료 기준**:
- 신규 개발자가 문서만으로 환경 구축 가능
- 모든 일반적인 문제 해결 방법 포함
- 스크린샷 및 예제 코드 포함

**산출물**:
- `docs/setup/development-guide.md`
- `docs/setup/troubleshooting.md`
- `docs/setup/faq.md`

#### Task 5.2: 코딩 컨벤션 및 가이드라인 수립 (2시간)
**담당자**: 개발팀 리드 + DevOps 엔지니어  

**세부 작업**:
- [ ] JavaScript/TypeScript 코딩 스타일 가이드
- [ ] Python 코딩 스타일 가이드  
- [ ] Git 커밋 메시지 컨벤션
- [ ] PR 템플릿 작성

**완료 기준**:
- 모든 언어별 코딩 컨벤션 문서화
- 자동 포맷팅 도구 설정
- PR 템플릿 적용

**산출물**:
- `docs/conventions/coding-style.md`
- `docs/conventions/git-conventions.md`
- `.github/pull_request_template.md`

#### Task 5.3: 전체 개발환경 통합 테스트 (2시간)
**담당자**: 전체 개발팀  

**세부 작업**:
- [ ] 각 개발자 로컬 환경에서 설정 검증
- [ ] 모든 서비스 간 연결 테스트
- [ ] 개발 워크플로우 전체 테스트
- [ ] 성능 및 안정성 검증

**완료 기준**:
- 모든 팀원이 동일한 환경 구축 완료
- 서비스 간 통신 정상 동작
- 개발 워크플로우 원활히 작동

**검증 항목**:
- [ ] 데이터베이스 연결 및 쿼리 실행
- [ ] API 서버 시작 및 엔드포인트 호출
- [ ] 프론트엔드 빌드 및 HMR 동작
- [ ] OCR 서비스 이미지 처리
- [ ] CI/CD 파이프라인 실행

#### Task 5.4: 개발환경 최적화 및 문제 해결 (1시간)
**담당자**: DevOス 엔지니어  

**세부 작업**:
- [ ] 성능 최적화 (빌드 시간, 시작 시간)
- [ ] 리소스 사용량 최적화
- [ ] 발견된 문제점 수정
- [ ] 문서 업데이트

**완료 기준**:
- 개발환경 시작 시간 3분 이내
- 메모리 사용량 합리적 수준
- 모든 알려진 문제 해결

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

### 기능 검증
- [ ] 모든 서비스 정상 시작
- [ ] API 엔드포인트 응답 확인
- [ ] 데이터베이스 연결 및 쿼리 실행
- [ ] 파일 업로드 및 처리 가능
- [ ] 환경 변수 적용 확인

### 성능 검증
- [ ] 컨테이너 시작 시간 측정
- [ ] 메모리 사용량 모니터링
- [ ] CPU 사용률 확인
- [ ] 디스크 I/O 성능 측정

### 보안 검증
- [ ] 민감 정보 노출 확인
- [ ] 네트워크 보안 설정
- [ ] 컨테이너 보안 스캔
- [ ] 권한 설정 검토

## 다음 단계

워크플로우 완료 후 진행할 작업:
1. **[02_Database_Development](./02_Database_Development.md)** - 데이터베이스 설계 및 구축
2. **[03_Backend_Development](./03_Backend_Development.md)** - 백엔드 기반 구조 개발
3. **[04_Frontend_Development](./04_Frontend_Development.md)** - 프론트엔드 기반 구조 개발

---

**관련 문서**:
- [TSD 08_Development_Environment](../TSD/08_Development_Environment.md)
- [메인 워크플로우](./00_Main_Workflow.md)