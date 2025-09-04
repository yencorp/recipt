# Receipt OCR Management System - Product Requirements Document (PRD)

## 1. Executive Summary

### 1.1 Product Overview
Receipt OCR Management System은 영수증을 OCR로 읽어서 데이터화하고, 머신러닝을 통해 인식률을 지속적으로 향상시키는 웹 기반 서비스입니다. 사용자는 여러 그룹에 참여할 수 있으며, 각 그룹 내에서 프로젝트별로 체계적인 영수증 관리가 가능합니다.

### 1.2 Target Users
- 개인 가계부 관리자
- 소상공인 및 자영업자
- 중소기업 회계 담당자
- 프리랜서 및 사업자

### 1.3 Key Value Propositions
- 한글 영수증 특화 OCR 기술 (Tesseract + EasyOCR)
- **재사용 가능한 OCR Core Service**: 다른 웹사이트에 이식 가능한 독립적 OCR API
- **지능형 이미지 전처리**: 영수증 영역 자동 감지 및 배경 제거
- 머신러닝 기반 지속적 인식률 향상
- **계층적 데이터 관리**: 사용자 → 그룹(다수) → 프로젝트 → 영수증
- 그룹 기반 협업 및 데이터 공유
- 프로젝트 단위 영수증 분류 및 관리
- 사용자 정의 라벨링 및 엑셀 내보내기

## 2. Product Goals and Objectives

### 2.1 Primary Goals
1. **높은 OCR 정확도**: 한글 영수증 95% 이상 인식률 달성
2. **재사용 가능한 OCR 서비스**: 다른 웹사이트에 쉽게 통합 가능한 독립적 OCR API 제공
3. **사용자 친화적 인터페이스**: 직관적이고 효율적인 UX/UI 제공
4. **확장 가능한 아키텍처**: 사용자 증가에 따른 안정적인 성능 유지
5. **데이터 보안**: 개인정보 및 민감한 영수증 데이터 보호

### 2.2 Success Metrics
- OCR 정확도: 95% 이상
- OCR Core Service API 응답 시간: 평균 2초 이내
- 외부 통합 성공률: 95% 이상 (다른 웹사이트 연동)
- 사용자 만족도: 4.5/5.0 이상
- 시스템 가용성: 99.9% 이상

## 3. User Stories and Use Cases

### 3.1 핵심 사용자 스토리

#### 3.1.1 영수증 업로드 및 OCR 처리
- **As a** 사용자
- **I want to** 영수증 이미지를 업로드하여 자동으로 텍스트 데이터로 변환
- **So that** 수동 입력 없이 효율적으로 영수증 정보를 디지털화

#### 3.1.2 OCR 결과 수정 및 학습
- **As a** 사용자  
- **I want to** OCR 결과를 검토하고 잘못된 부분을 수정
- **So that** 시스템이 학습하여 다음 인식 정확도가 향상됨

#### 3.1.3 그룹 참여 및 관리
- **As a** 사용자
- **I want to** 여러 그룹에 참여하고 각 그룹의 역할에 따라 권한을 갖음
- **So that** 개인용, 사업용, 동아리용 등 다양한 목적별 그룹에서 활동 가능

#### 3.1.4 프로젝트 생성 및 관리 (그룹 내)
- **As a** 그룹 멤버 (권한 있는)
- **I want to** 소속 그룹 내에서 프로젝트를 생성하고 관리
- **So that** 특정 목적(출장비, 행사비, 월별 예산 등)별로 영수증을 체계적으로 분류

#### 3.1.5 데이터 필터링 및 내보내기
- **As a** 사용자
- **I want to** 원하는 라벨/컬럼을 선택하여 필터링된 데이터를 표로 보고 엑셀로 다운로드
- **So that** 회계 처리나 보고서 작성에 필요한 데이터만 추출 가능

#### 3.1.6 외부 시스템 통합 (OCR Core Service)
- **As a** 외부 개발자
- **I want to** OCR Core Service API를 내 웹사이트에 통합
- **So that** 별도 OCR 엔진 개발 없이 한글 문서 인식 기능 사용 가능

### 3.2 상세 Use Cases

#### 3.2.1 영수증 처리 워크플로우 (고도화)
1. 사용자가 영수증 이미지 업로드
2. **영수증 영역 자동 감지** (컴퓨터 비전 기반)
3. **배경 제거 및 영수증 영역 추출**
4. 이미지 전처리 (회전 보정, 크기 조정, 품질 최적화)
5. Tesseract OCR + EasyOCR 병렬 처리
6. 결과 비교 및 최적 결과 선택
7. 원본 이미지와 처리된 이미지 모두 저장
8. 사용자에게 검토/수정 인터페이스 제공
9. 수정 데이터를 학습 데이터로 저장

#### 3.2.2 그룹 및 계층적 권한 관리
1. 사용자 회원가입/로그인
2. 그룹 생성 또는 기존 그룹 참여 신청
3. 그룹 관리자의 참여 승인/거절
4. 그룹 내 역할 설정 (관리자, 편집자, 뷰어)
5. 그룹 내에서만 프로젝트 생성 가능
6. 프로젝트별 세부 접근 권한 관리

#### 3.2.3 OCR Core Service 외부 통합
1. 외부 개발자가 API 키 발급 요청
2. OCR Core Service API 문서 확인
3. 이미지 업로드 API 호출
4. OCR 처리 결과 수신 (JSON 형태)
5. 외부 시스템에서 결과 활용

## 4. Functional Requirements

### 4.1 인증 및 사용자 관리
- **FR-001**: 이메일/패스워드 기반 사용자 회원가입/로그인
- **FR-002**: JWT 기반 인증 시스템
- **FR-003**: 사용자 프로필 관리 (이름, 이메일, 프로필 이미지)
- **FR-004**: 패스워드 재설정 기능

### 4.2 그룹 관리 (다대다 관계)
- **FR-005**: 그룹 생성 및 관리 (그룹명, 설명, 공개/비공개 설정)
- **FR-006**: 그룹 참여 요청 및 승인 시스템
- **FR-007**: 그룹 멤버 권한 관리 (관리자, 편집자, 뷰어)
- **FR-008**: 그룹 탈퇴 및 멤버 추방 기능
- **FR-009**: **핵심**: 사용자는 여러 그룹에 동시 참여 가능 (다대다)
- **FR-010**: 그룹별 멤버 목록 및 역할 표시
- **FR-011**: 그룹 초대 링크 생성 기능

### 4.3 프로젝트 관리 (그룹 종속)
- **FR-012**: 프로젝트 생성 및 관리 (프로젝트명, 설명, 기간)
- **FR-013**: **핵심**: 프로젝트는 반드시 하나의 그룹에만 속함 (일대다)
- **FR-014**: 그룹 멤버만 해당 그룹의 프로젝트에 접근 가능
- **FR-015**: 프로젝트별 세부 접근 권한 설정 (그룹 역할 기반)
- **FR-016**: 프로젝트 상태 관리 (활성, 완료, 보관)
- **FR-017**: 프로젝트 이동 불가 (그룹 간 이동 제한)

### 4.4 영수증 처리 (프로젝트 종속)
- **FR-018**: 영수증 이미지 업로드 (JPG, PNG, PDF 지원)
- **FR-019**: **영수증 영역 자동 감지** (컴퓨터 비전 기반 문서 감지)
- **FR-020**: **배경 제거 및 영수증 추출** (ROI 기반 크로핑)
- **FR-021**: **회전 및 기울기 자동 보정** (문서 정렬)
- **FR-022**: 이미지 전처리 (크기 조정, 품질 최적화, 노이즈 제거)
- **FR-023**: Tesseract OCR 한글 처리
- **FR-024**: EasyOCR 한글 처리
- **FR-025**: 두 OCR 결과 비교 및 최적 결과 선택 알고리즘
- **FR-026**: **영수증 데이터 구조화** (필수/선택 필드 + 품목 분리)
  - **필수 고정 컬럼**: 결제일, 상호명, 결제금액
  - **구매품목 관계 테이블**: 품목명, 수량, 단가, 소계 (일대다 관계)
  - **선택 유연 필드**: 사업자번호, 결제정보, 할인금액 등
- **FR-027**: **이미지 버전 관리** (원본, 처리됨, 최종본)
- **FR-028**: **핵심**: 영수증은 반드시 특정 프로젝트에 할당
- **FR-029**: 프로젝트 선택 없이는 영수증 저장 불가

### 4.5 영수증 데이터 구조 및 검증
- **FR-030**: **필수 필드 고정 스키마**
  - payment_date (결제일) - DATE 타입
  - merchant_name (상호명) - VARCHAR(200)
  - total_amount (결제금액) - DECIMAL(15,2)
- **FR-031**: **선택 필드 유연 저장 방식**
  - JSON 방식: 구조화된 필드별 저장
  - Key-Value 방식: 태그 시스템 활용
  - 하이브리드 방식: 자주 사용되는 필드는 별도 테이블
- **FR-032**: OCR 결과 검토 인터페이스 (필수/선택 필드 구분)
- **FR-033**: **구매품목 OCR 인식 및 구조화**
  - 품목명, 수량, 단가 자동 추출
  - 테이블 형태 데이터 인식 (행/열 구분)
  - 품목별 소계 계산 및 검증
- **FR-034**: 필드 매핑 및 사용자 정의 필드 생성
- **FR-035**: **구매품목 편집 인터페이스**
  - 품목 추가/수정/삭제 기능
  - 품목 순서 변경 기능
  - 소계 자동 계산 및 총합 검증
- **FR-036**: 수정 내역 저장 및 학습 데이터로 활용
- **FR-037**: 영수증 이미지와 추출된 데이터 연결 표시

### 4.6 머신러닝 및 강화학습 시스템

#### 4.6.1 핵심 ML/RL 기능 요구사항
- **FR-038**: **Reinforcement Learning 기반 OCR 선택 시스템**
  - DQN 에이전트가 Tesseract/EasyOCR 결과 중 최적 선택
  - 사용자 피드백을 reward signal로 활용
  - 영수증 유형별 학습된 선택 정책 적용
- **FR-039**: **사용자 피드백 수집 및 학습 파이프라인**
  - OCR 결과 수정 시 자동 피드백 데이터 생성
  - 수정 전/후 비교를 통한 정확도 개선 측정
  - 배치 학습을 위한 피드백 데이터 집계 및 전처리
- **FR-040**: **영수증 유형별 템플릿 학습**
  - 상호명 기반 영수증 포맷 패턴 인식
  - 레이아웃 특성 학습 (품목 위치, 가격 정렬 등)
  - 템플릿별 OCR 파라미터 자동 최적화
- **FR-041**: **개인화된 인식 패턴 학습**
  - 사용자별 자주 방문하는 매장 학습
  - 개인 구매 패턴 기반 품목명 예측
  - 사용자 특화 OCR 보정 모델

#### 4.6.2 ML 인프라 및 모델 관리
- **FR-042**: **모델 버전 관리 및 A/B 테스팅**
  - MLflow를 통한 실험 추적 및 모델 레지스트리
  - 새 모델 성능 검증을 위한 A/B 테스팅 프레임워크
  - 자동 모델 성능 모니터링 및 롤백 시스템
- **FR-043**: **실시간 모델 추론 및 피처 서빙**
  - Redis 기반 실시간 피처 스토어
  - 모델 추론 결과 캐싱 및 최적화
  - GPU/CPU 리소스 기반 동적 모델 로딩
- **FR-044**: **배치 학습 및 온라인 학습**
  - 일별/주별 배치 재학습 스케줄링
  - 실시간 피드백 기반 온라인 학습 (점진적 업데이트)
  - 학습 데이터 품질 검증 및 노이즈 필터링

#### 4.6.3 성능 추적 및 분석
- **FR-045**: **OCR 정확도 추적 및 리포팅**
  - 필드별, 영수증 유형별 정확도 메트릭
  - 시간별 성능 변화 추적 (성능 회귀 감지)
  - ML 모델별 기여도 분석 (attribution analysis)
- **FR-046**: **사용자 피드백 품질 분석**
  - 피드백 신뢰도 스코어링 시스템
  - 노이즈가 많은 피드백 자동 필터링
  - 고품질 피드백 기여자 식별 및 가중치 적용
- **FR-047**: **ML 시스템 모니터링 및 알림**
  - 모델 성능 임계치 기반 자동 알림
  - 데이터 드리프트 감지 (input distribution shift)
  - 모델 추론 지연시간 및 처리량 모니터링

### 4.7 데이터 관리 및 분석
- **FR-029**: 사용자 정의 라벨(컬럼) 생성 및 관리
- **FR-030**: 라벨별 데이터 필터링 및 표시
- **FR-031**: 다중 조건 검색 기능
- **FR-032**: 통계 및 요약 정보 제공
- **FR-033**: 데이터 표 형태 표시

### 4.8 내보내기 기능
- **FR-034**: 선택된 라벨 데이터의 엑셀 내보내기
- **FR-035**: CSV 형식 내보내기
- **FR-036**: PDF 리포트 생성
- **FR-037**: 기간별, 프로젝트별 데이터 필터링 내보내기

### 4.9 OCR Container (Complete Portable Service)
**Backend API 기능:**
- **FR-038**: 독립적인 OCR Container 전체 서비스 제공
- **FR-039**: API 키 기반 인증 시스템
- **FR-040**: 이미지 업로드 및 OCR 처리 API 엔드포인트
- **FR-041**: 표준화된 JSON 응답 형식
- **FR-042**: **지능형 이미지 전처리 파이프라인**
  - 영수증 영역 자동 감지 (컴퓨터 비전)
  - 배경 제거 및 문서 추출
  - 회전 및 기울기 자동 보정
  - 노이즈 제거 및 품질 향상
- **FR-043**: OCR 엔진별 결과 비교 및 최적 결과 선택
- **FR-044**: **다중 이미지 버전 저장 관리**
  - 원본 이미지 보존
  - 처리된 이미지 (배경 제거됨)
  - 최종 OCR용 이미지
- **FR-045**: API 사용량 추적 및 제한
- **FR-046**: 외부 도메인 CORS 설정
- **FR-047**: Webhook을 통한 비동기 결과 전송 (선택사항)
- **FR-048**: 다양한 이미지 형식 지원 (JPG, PNG, PDF, WEBP)
- **FR-049**: OCR 신뢰도 점수 및 처리 과정 메타데이터 제공

**Frontend UI 기능 (Container 내장):**
- **FR-050**: 영수증 업로드 인터페이스 (드래그앤드롭)
- **FR-051**: **이미지 처리 과정 시각화**
  - 실시간 처리 진행률 표시
  - 영수증 영역 감지 결과 표시
  - 배경 제거 전/후 비교
- **FR-052**: **고급 OCR 결과 검토 페이지**
  - 원본/처리됨/최종 이미지 3단계 표시
  - 감지된 영수증 영역 하이라이트
  - 추출 텍스트와 이미지 영역 매핑
- **FR-053**: 클릭하여 편집 가능한 인터페이스
- **FR-054**: 필드별 신뢰도 및 처리 품질 시각적 표시
- **FR-055**: 영수증 데이터 목록 및 검색 기능
- **FR-056**: **이미지 처리 품질 분석**
  - 감지 성공률 통계
  - 처리 전/후 OCR 정확도 비교
  - 품질 개선 제안
- **FR-057**: CSV/엑셀 내보내기 기능
- **FR-058**: 반응형 웹 디자인 (모바일 지원)

## 5. Non-Functional Requirements

### 5.1 성능 요구사항
- **NFR-001**: OCR 처리 시간 평균 3초 이내
- **NFR-002**: 웹 페이지 로딩 시간 2초 이내
- **NFR-003**: 동시 사용자 1000명 지원
- **NFR-004**: 이미지 업로드 최대 10MB 지원

### 5.2 가용성 및 안정성
- **NFR-005**: 시스템 가용성 99.9%
- **NFR-006**: 자동 백업 및 복구 시스템
- **NFR-007**: 장애 발생 시 1시간 이내 복구
- **NFR-008**: 데이터 손실 방지 시스템

### 5.3 보안 요구사항
- **NFR-009**: HTTPS 강제 적용
- **NFR-010**: SQL Injection, XSS 등 보안 취약점 방어
- **NFR-011**: 개인정보보호법 준수
- **NFR-012**: 사용자 데이터 암호화 저장
- **NFR-013**: API 레이트 리미팅

### 5.4 확장성 및 유지보수성
- **NFR-014**: 마이크로서비스 아키텍처 기반 설계
- **NFR-015**: 수평적 확장 가능한 구조
- **NFR-016**: 코드 테스트 커버리지 80% 이상
- **NFR-017**: API 문서화 및 버전 관리

### 5.5 사용성
- **NFR-018**: 반응형 웹 디자인 (모바일 지원)
- **NFR-019**: 웹 접근성 지침 준수
- **NFR-020**: 다국어 지원 (한국어, 영어)
- **NFR-021**: 브라우저 호환성 (Chrome, Safari, Firefox, Edge)

## 6. Technical Architecture

### 6.1 전체 시스템 아키텍처 (컨테이너 기반 분리)
```
Main Application (Receipt Management):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Main Frontend  │    │   API Gateway   │    │   Database      │
│   (React)       │◄──►│  (Kong/Nginx)   │    │  (PostgreSQL)   │
│ Groups/Projects │    │                 │    │                 │
│   Dashboard     │    └─────────┬───────┘    └─────────────────┘
└─────────────────┘              │
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼─────────┐ ┌─────▼──────┐ ┌─────────▼─────────┐
    │   Main App        │ │   OCR      │ │   User/Auth       │
    │   Service         │ │ Container  │ │   Service         │
    │ (Groups/Projects) │ │ (Complete) │ │                   │
    └───────────────────┘ └────────────┘ └───────────────────┘

OCR Container (Portable & Self-contained):
┌─────────────────────────────────────────────────────────┐
│                    OCR Container                        │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   OCR Frontend  │    │      OCR Backend Service    │ │
│  │   (React)       │◄──►│         (FastAPI)           │ │
│  │ - Upload UI     │    │ - API Endpoints             │ │
│  │ - Review/Edit   │    │ - Authentication            │ │
│  │ - Data View     │    │ - Image Processing          │ │
│  │ - Analysis      │    └─────────┬───────────────────┘ │
│  └─────────────────┘              │                     │
│         ┌──────────────────────────┼──────────────────┐  │
│         │                         │                  │  │
│  ┌──────▼──────┐ ┌──────▼──────┐ ┌▼─────────┐ ┌─────▼┐ │
│  │  Tesseract  │ │   EasyOCR   │ │  Image   │ │ OCR │ │
│  │   Engine    │ │   Engine    │ │Processing│ │ DB  │ │
│  └─────────────┘ └─────────────┘ └──────────┘ └─────┘ │
└─────────────────────────────────────────────────────────┘

External Integration (Any Website):
┌─────────────────┐    ┌─────────────────────────────────┐
│  External       │    │      OCR Container              │
│  Website        │◄──►│   (API + Frontend)              │
│                 │    │    - Ready to Deploy           │
└─────────────────┘    └─────────────────────────────────┘
```

### 6.2 기술 스택

#### 6.2.1 Frontend Architecture
**Main Application Frontend:**
- **Framework**: React 18+
- **Features**: Groups, Projects, Dashboard, User Management
- **State Management**: Redux Toolkit 또는 Zustand
- **Styling**: Tailwind CSS 또는 Material-UI
- **HTTP Client**: Axios
- **Build Tool**: Vite

**OCR Container Frontend (Embedded):**
- **Framework**: React 18+
- **Features**: 
  - 영수증 업로드 UI
  - OCR 결과 검토/수정 인터페이스
  - 영수증 데이터 뷰어
  - 분석 및 통계 페이지
- **State Management**: Context API 또는 Zustand (경량)
- **Styling**: Tailwind CSS (포터빌리티)
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **포터빌리티**: 독립 실행 가능한 SPA

#### 6.2.2 Backend
- **Runtime**: Node.js 18+ 
- **Framework**: Express.js 또는 FastAPI (Python)
- **Authentication**: JWT
- **API Documentation**: OpenAPI/Swagger
- **Validation**: Joi 또는 Zod

#### 6.2.3 Database
- **Primary DB**: PostgreSQL 14+
- **ORM**: Prisma (Node.js) 또는 SQLAlchemy (Python)
- **Migration**: 내장 migration 도구
- **Connection Pooling**: pgBouncer

#### 6.2.4 머신러닝 및 AI 기술 스택

**머신러닝 프레임워크:**
- **Core ML Framework**: PyTorch 2.0+ (주 프레임워크)
- **Model Serving**: TorchServe (모델 서빙), TensorFlow Lite (엣지 배포)
- **Computer Vision**: OpenCV 4.8+, scikit-image
- **Deep Learning Models**:
  - Document Detection: YOLOv8, MobileNet SSD
  - Text Recognition: CRNN (CNN + RNN), Transformer-OCR
  - Layout Analysis: LayoutLM, DocBank pre-trained models

**강화학습 시스템:**
- **RL Framework**: Stable-Baselines3 (DQN, PPO 알고리즘)
- **Environment**: OpenAI Gym compatible OCR environment
- **Policy Network**: Deep Q-Network (DQN) with experience replay
- **Reward Engineering**: 
  - Accuracy-based rewards (+1 correct, -1 incorrect)
  - Confidence-weighted rewards (higher confidence = higher weight)
  - User satisfaction feedback integration

**MLOps 및 실험 관리:**
- **Experiment Tracking**: MLflow 2.0+ (실험, 메트릭, 모델 관리)
- **Feature Store**: Feast (오프라인) + Redis (온라인) feature serving
- **Data Pipeline**: Apache Airflow (배치 학습 스케줄링)
- **Model Registry**: MLflow Model Registry (모델 버전 관리)
- **A/B Testing**: Custom A/B testing framework (모델 성능 비교)

**데이터 처리 및 학습 인프라:**
- **Data Processing**: Pandas, NumPy, Pillow (이미지 전처리)
- **Training Queue**: Celery + Redis (비동기 학습 작업)
- **Model Training**: PyTorch Lightning (구조화된 학습 코드)
- **Hyperparameter Tuning**: Optuna (자동 하이퍼파라미터 최적화)
- **Data Validation**: Great Expectations (학습 데이터 품질 검증)

**모델 배포 및 추론:**
- **Model Serving**: TorchServe (프로덕션), Flask (개발)
- **Model Optimization**: ONNX (모델 최적화), TensorRT (GPU 가속)
- **Caching**: Redis (모델 추론 결과 캐싱)
- **Load Balancing**: HAProxy (모델 서버 로드 밸런싱)

#### 6.2.5 OCR Container (Complete Self-contained Service)
**Backend Components:**
- **API Framework**: FastAPI (Python) - 고성능, 자동 문서화
- **OCR Engines**: 
  - Tesseract 4+ (pytesseract) - 한글 언어팩 포함
  - EasyOCR - 한글 특화 설정

**컴퓨터 비전 & 이미지 처리:**
- **OpenCV**: 
  - 문서 경계 감지 (Contour Detection)
  - 코너 감지 (Corner Detection)
  - 원근 변환 (Perspective Transformation)
  - 회전 및 기울기 보정
- **scikit-image**: 
  - 이미지 세그멘테이션
  - 모폴로지 연산
  - 노이즈 제거 필터
- **PIL/Pillow**: 기본 이미지 처리 및 포맷 변환
- **NumPy**: 고성능 배열 연산

**머신러닝 & AI (ML/RL Pipeline):**
- **Document Detection & Computer Vision**:
  - YOLOv8 또는 MobileNet SSD (경량 영수증 문서 감지)
  - OpenCV + Custom CNN (영수증 영역 정밀 세그멘테이션)
  - Traditional CV: Canny Edge Detection, Hough Transform, RANSAC
- **OCR Enhancement ML Models**:
  - Text Region Detection: EAST (Efficient Accurate Scene Text)
  - Character Recognition Enhancement: CTC (Connectionist Temporal Classification)
  - Post-processing: LSTM-based sequence correction
- **Reinforcement Learning System**:
  - **RL Framework**: Stable-Baselines3 + PyTorch
  - **Environment**: Custom OCR correction environment
  - **Agent**: DQN (Deep Q-Network) for OCR result selection
  - **Reward System**: User feedback → accuracy score → model weight updates
- **Training & Inference Infrastructure**:
  - **ML Framework**: PyTorch + TensorFlow Lite (edge deployment)
  - **Model Versioning**: MLflow for experiment tracking
  - **Feature Store**: Redis for real-time feature serving
  - **Training Queue**: Celery + Redis for batch learning
- **Queue System**: Redis + RQ (비동기 작업 처리) + ML task queue
- **Database**: SQLite (컨테이너 내장) 또는 PostgreSQL (외부 연결)

**Frontend Components (Embedded):**
- **React SPA**: 독립 실행 가능한 단일 페이지 애플리케이션
- **Nginx**: 정적 파일 서빙 + API 프록시
- **Web Server**: FastAPI와 통합된 웹 서버

**Container Packaging:**
- **Docker Multi-stage Build**: Frontend 빌드 + Backend 통합
- **포트**: 8080 (HTTP) - 외부 노출 포트 단일화
- **볼륨**: `/data` (이미지 저장), `/config` (설정)

#### 6.2.5 Infrastructure
- **Container**: Docker
- **Orchestration**: Docker Compose (개발), Kubernetes (프로덕션)
- **File Storage**: AWS S3 또는 MinIO
- **Caching**: Redis
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack

### 6.3 데이터베이스 설계

#### 6.3.1 주요 엔터티
**Main Application DB:**
- **Users**: 사용자 정보
- **Groups**: 그룹 정보
- **UserGroups**: 사용자-그룹 관계 (다대다)
- **Projects**: 프로젝트 정보
- **Receipts**: 영수증 기본 정보 (필수 필드 + OCR 참조)
- **ReceiptItems**: 구매품목 상세 정보 (일대다)
- **ReceiptFields**: 선택 필드 저장 (Key-Value)
- **FieldDefinitions**: 필드 정의 및 메타데이터
- **Labels**: 사용자 정의 라벨
- **MLTrainingData**: 머신러닝 학습 데이터 및 피드백
- **MLModels**: 학습된 모델 메타데이터 및 버전 관리
- **UserFeedback**: 사용자 OCR 수정 피드백 데이터
- **ModelPerformanceMetrics**: 모델 성능 추적 데이터
- **RLExperiences**: 강화학습 경험 데이터 (state, action, reward, next_state)

**OCR Core Service DB:**
- **OCRJobs**: OCR 처리 작업 정보 + ML 모델 추론 메타데이터
- **OCRResults**: OCR 처리 결과 및 수정 이력 + ML 예측 신뢰도
- **ProcessedImages**: 다중 버전 이미지 메타데이터
  - original_image_path (원본)
  - detected_area_image_path (배경 제거됨)
  - final_processed_image_path (최종 OCR용)
  - detection_metadata (감지 영역 좌표, 신뢰도)
- **ImageProcessingLogs**: 이미지 처리 과정 로그
  - detection_success (감지 성공 여부)
  - processing_steps (처리 단계별 결과)
  - quality_metrics (품질 지표)
- **APIKeys**: 외부 통합용 API 키 관리
- **UsageStats**: API 사용량 통계
- **MLInferences**: ML 모델 추론 결과 및 성능 로그
  - model_version, inference_time, confidence_scores
  - feature_vectors, prediction_metadata
- **RLStates**: 강화학습 상태 및 액션 로그
  - ocr_context (state), selected_engine (action), user_feedback (reward)
  - episode_id, timestep, cumulative_reward
- **ModelExperiments**: ML 실험 추적 및 A/B 테스트 결과
  - experiment_id, model_variant, performance_metrics
  - test_start_date, test_end_date, statistical_significance

#### 6.3.2 핵심 관계 및 제약사항
**계층적 데이터 구조:**
```
User (1) ↔ (N) UserGroup (N) ↔ (1) Group
                                      ↓ (1:N)
                                   Project
                                      ↓ (1:N)
                                   Receipt
```

**상세 관계:**
- **User ↔ UserGroup ↔ Group**: 다대다 (사용자는 여러 그룹에 속할 수 있음)
- **Group → Project**: 일대다 (프로젝트는 반드시 하나의 그룹에만 속함)
- **Project → Receipt**: 일대다 (영수증은 반드시 하나의 프로젝트에 속함)
- **Receipt → ReceiptItems**: 일대다 (영수증별 구매품목들)
- **Receipt → ReceiptFields**: 일대다 (영수증별 선택 필드들)
- **FieldDefinitions → ReceiptFields**: 일대다 (필드 정의 참조)
- **User → Label**: 일대다 (사용자별 개인 라벨)
- **Receipt → MLTrainingData**: 일대다 (학습 데이터)

**OCR Core Service:**
- OCRJob → OCRResult (일대일)
- OCRJob → ProcessedImage (일대일)
- APIKey → UsageStats (일대다)

**서비스간 연동:**
- Receipt.ocr_job_id → OCRJob.id (외래키 참조)

**중요 제약사항:**
- 프로젝트는 그룹을 벗어날 수 없음 (그룹 이동 불가)
- 영수증은 프로젝트 없이 존재할 수 없음
- 사용자는 속한 그룹의 프로젝트에만 접근 가능

#### 6.3.3 영수증 데이터 테이블 설계 (하이브리드 방식)

**Receipts 테이블 (필수 필드 고정):**
```sql
CREATE TABLE receipts (
    id                  UUID PRIMARY KEY,
    project_id          UUID NOT NULL REFERENCES projects(id),
    ocr_job_id         UUID REFERENCES ocr_jobs(id),
    
    -- 필수 고정 컬럼 (3개)
    payment_date        DATE NOT NULL,
    merchant_name       VARCHAR(200) NOT NULL,
    total_amount        DECIMAL(15,2) NOT NULL,
    
    -- 메타데이터
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    created_by          UUID REFERENCES users(id)
);
```

**ReceiptFields 테이블 (선택 필드 유연 저장):**
```sql
CREATE TABLE receipt_fields (
    id              UUID PRIMARY KEY,
    receipt_id      UUID NOT NULL REFERENCES receipts(id),
    field_def_id    UUID REFERENCES field_definitions(id),
    field_key       VARCHAR(100) NOT NULL,  -- 사용자 정의 키
    field_value     TEXT,                    -- 실제 값
    field_type      VARCHAR(20),             -- text, number, date, json
    field_order     INTEGER DEFAULT 0,       -- 표시 순서
    created_at      TIMESTAMP DEFAULT NOW()
);
```

**FieldDefinitions 테이블 (필드 정의 및 메타데이터):**
```sql
CREATE TABLE field_definitions (
    id              UUID PRIMARY KEY,
    field_key       VARCHAR(100) UNIQUE NOT NULL,
    field_name      VARCHAR(200) NOT NULL,       -- 표시명
    field_type      VARCHAR(20) NOT NULL,        -- text, number, date, json, array
    is_common       BOOLEAN DEFAULT FALSE,       -- 자주 사용되는 필드
    default_value   TEXT,                        -- 기본값
    validation_rule TEXT,                        -- 유효성 검증 규칙 (JSON)
    description     TEXT,                        -- 필드 설명
    created_at      TIMESTAMP DEFAULT NOW()
);
```

**일반적인 선택 필드 예시:**
```sql
**ReceiptItems 테이블 (구매품목 상세):**
```sql
CREATE TABLE receipt_items (
    id              UUID PRIMARY KEY,
    receipt_id      UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    
    -- 품목 정보
    item_name       VARCHAR(200) NOT NULL,       -- 품목명
    quantity        DECIMAL(10,3) DEFAULT 1.0,   -- 수량 (소수점 지원)
    unit_price      DECIMAL(15,2),               -- 단가
    subtotal        DECIMAL(15,2),               -- 소계 (수량 × 단가)
    
    -- 추가 정보 (선택)
    item_code       VARCHAR(50),                 -- 상품코드
    category        VARCHAR(100),                -- 분류
    discount_amount DECIMAL(15,2) DEFAULT 0,     -- 품목별 할인
    tax_rate        DECIMAL(5,2),                -- 세율 (%)
    
    -- 메타데이터
    item_order      INTEGER DEFAULT 0,           -- 영수증 내 순서
    ocr_confidence  DECIMAL(3,2),               -- OCR 신뢰도
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_order ON receipt_items(receipt_id, item_order);
```

**FieldDefinitions 업데이트 (품목 관련 제거):**
```sql
INSERT INTO field_definitions VALUES 
('business_number', '사업자번호', 'text', true, null, '{"pattern": "^\\d{3}-\\d{2}-\\d{5}$"}'),
('payment_method', '결제방법', 'text', true, '카드', '{"options": ["카드", "현금", "계좌이체"]}'),
('card_number', '카드번호', 'text', false, null, '{"pattern": "^\\*+\\d{4}$"}'),
('tax_amount', '세액', 'number', true, 0, '{"min": 0}'),
('total_discount', '총 할인금액', 'number', false, 0, '{"min": 0}'),
('store_address', '매장주소', 'text', false, null, null),
('receipt_number', '영수증번호', 'text', false, null, null),
('cashier_name', '점원명', 'text', false, null, null),
('pos_terminal', 'POS 단말기', 'text', false, null, null);
```

### 6.4 API 설계

#### 6.4.1 인증 API
- `POST /auth/register` - 사용자 등록
- `POST /auth/login` - 로그인
- `POST /auth/refresh` - 토큰 갱신
- `POST /auth/logout` - 로그아웃

#### 6.4.2 그룹 관리 API
- `GET /groups` - 사용자 그룹 목록
- `POST /groups` - 그룹 생성
- `PUT /groups/:id` - 그룹 수정
- `DELETE /groups/:id` - 그룹 삭제
- `POST /groups/:id/join` - 그룹 참여 요청
- `PUT /groups/:id/members/:userId` - 멤버 권한 변경

#### 6.4.3 프로젝트 관리 API
- `GET /projects` - 프로젝트 목록
- `POST /projects` - 프로젝트 생성
- `PUT /projects/:id` - 프로젝트 수정
- `DELETE /projects/:id` - 프로젝트 삭제

#### 6.4.4 영수증 처리 API (필수/선택 필드 구조)
- `POST /receipts/upload` - 영수증 업로드 및 OCR 처리
- `GET /receipts` - 영수증 목록 (필터링 지원)
- `GET /receipts/:id` - 영수증 상세 정보 (필수+선택 필드)
- `PUT /receipts/:id` - OCR 결과 수정 (필수/선택 필드 분리)
- `PUT /receipts/:id/fields` - 선택 필드만 수정
- `POST /receipts/:id/fields` - 새로운 선택 필드 추가
- `DELETE /receipts/:id/fields/:fieldKey` - 특정 선택 필드 삭제

**구매품목 관리:**
- `GET /receipts/:id/items` - 영수증 품목 목록
- `POST /receipts/:id/items` - 새로운 품목 추가
- `PUT /receipts/:id/items/:itemId` - 품목 정보 수정
- `DELETE /receipts/:id/items/:itemId` - 품목 삭제
- `PUT /receipts/:id/items/order` - 품목 순서 변경

- `DELETE /receipts/:id` - 영수증 삭제 (품목 자동 삭제)

#### 6.4.5 필드 관리 API
- `GET /field-definitions` - 사용 가능한 필드 정의 목록
- `POST /field-definitions` - 새로운 필드 정의 생성
- `PUT /field-definitions/:id` - 필드 정의 수정
- `GET /field-definitions/common` - 자주 사용되는 필드 목록

#### 6.4.6 데이터 분석 및 내보내기 API
- `GET /receipts/export` - 데이터 내보내기 (필수+선택 필드 포함)
- `GET /receipts/statistics` - 통계 정보 (필드별 분석 포함)
- `POST /labels` - 사용자 정의 라벨 생성
- `GET /labels` - 라벨 목록

#### 6.4.7 OCR Core Service API (외부 통합용)
**인증 관리:**
- `POST /api/v1/auth/api-key` - API 키 발급
- `GET /api/v1/auth/usage` - 사용량 조회
- `PUT /api/v1/auth/api-key/:id` - API 키 관리

**이미지 처리:**
- `POST /api/v1/ocr/process` - 이미지 업로드 및 OCR 처리
- `GET /api/v1/ocr/job/:jobId` - 작업 상태 조회
- `GET /api/v1/ocr/result/:jobId` - 결과 조회
- `POST /api/v1/ocr/process-async` - 비동기 처리 (Webhook 콜백)

**이미지 관리:**
- `POST /api/v1/image/upload` - 이미지 업로드
- `GET /api/v1/image/:imageId` - 처리된 이미지 조회
- `POST /api/v1/image/preprocess` - 이미지 전처리만 수행

**API 응답 형식 (고도화):**
```json
{
  "success": true,
  "jobId": "uuid",
  "data": {
    "images": {
      "original": "original_image_url",
      "detectedArea": "detected_area_image_url", 
      "processed": "final_processed_image_url"
    },
    "detection": {
      "success": true,
      "confidence": 0.92,
      "boundingBox": {
        "x": 120, "y": 80, "width": 400, "height": 600
      },
      "corners": [[120,80], [520,80], [520,680], [120,680]],
      "rotationAngle": -2.3
    },
    "processing": {
      "steps": ["detect", "crop", "rotate", "enhance"],
      "qualityScore": 0.88,
      "improvements": {
        "backgroundRemoved": true,
        "rotationCorrected": true,
        "noiseReduced": true
      }
    },
    "ocrResults": {
      "tesseract": { "text": "...", "confidence": 0.95 },
      "easyocr": { "text": "...", "confidence": 0.92 },
      "bestResult": { "text": "...", "confidence": 0.95, "engine": "tesseract" },
      "mlEnhanced": {
        "selectedBy": "RL_agent",
        "confidenceScore": 0.97,
        "modelVersion": "v2.1.3",
        "processingTime": 0.8,
        "enhancementApplied": ["text_correction", "layout_analysis"]
      }
    },
    "extractedFields": {
      "required": {
        "payment_date": "2024-01-01",
        "merchant_name": "상호명",
        "total_amount": 15000
      },
      "items": [
        {
          "id": "item-1",
          "item_name": "아메리카노",
          "quantity": 2.0,
          "unit_price": 2250.0,
          "subtotal": 4500.0,
          "item_order": 1,
          "ocr_confidence": 0.95
        },
        {
          "id": "item-2", 
          "item_name": "카페라떼",
          "quantity": 1.0,
          "unit_price": 6000.0,
          "subtotal": 6000.0,
          "item_order": 2,
          "ocr_confidence": 0.88
        }
      ],
      "optional": {
        "business_number": "123-45-67890",
        "payment_method": "카드",
        "card_number": "****1234",
        "tax_amount": 1364,
        "total_discount": 500,
        "receipt_number": "2024010100123"
      }
    },
    "metrics": {
      "processingTime": 2.1,
      "detectionTime": 0.3,
      "ocrTime": 1.8,
      "mlInferenceTime": 0.4,
      "rlDecisionTime": 0.1,
      "overallAccuracy": 0.94,
      "improvementFromML": 0.08
    },
    "learningMetadata": {
      "receiptType": "restaurant",
      "templateMatched": "korean_receipt_v1",
      "userPersonalizationApplied": true,
      "feedbackContributions": 127,
      "rlEpisodeId": "ep_20240101_001234"
    }
  }
}
```

### 6.5 보안 설계
**Main Application:**
- JWT 기반 인증
- RBAC (Role-Based Access Control)
- API Rate Limiting
- Input Validation 및 Sanitization
- SQL Injection 방어
- CORS 설정
- 파일 업로드 보안 검증

**OCR Core Service:**
- API 키 기반 인증
- 요청 당 처리량 제한 (Rate Limiting)
- 이미지 파일 형식 및 크기 검증
- 악성 파일 스캔 (ClamAV 등)
- HTTPS 강제 적용
- 외부 도메인별 CORS 정책
- API 사용량 모니터링 및 남용 방지

## 7. User Experience Design

### 7.1 화면 구성 (분리된 아키텍처)

#### 7.1.1 Main Application 화면
**대시보드:**
- 그룹별 프로젝트 현황
- 사용자 권한별 메뉴
- OCR Container 연동 상태
- 빠른 작업 버튼 (그룹/프로젝트 생성)

**그룹/프로젝트 관리:**
- 그룹 목록 및 참여 관리
- 프로젝트 생성 및 설정
- 멤버 권한 관리
- OCR Container 링크

#### 7.1.2 OCR Container 화면 (독립적)
**영수증 업로드 페이지:**
- 드래그 앤 드롭 업로드 영역
- 다중 파일 선택 지원
- 진행률 표시바
- OCR 처리 상태 실시간 업데이트
- 처리 완료 후 자동 검토 페이지 이동

**OCR 결과 검토 페이지 (고도화):**
- **3단계 이미지 표시**: 원본 → 감지됨 → 최종처리됨
- 감지된 영수증 영역 하이라이트 및 조정 가능
- 배경 제거 전/후 비교 슬라이더
- 추출 텍스트와 이미지 영역 매핑 표시
- **구매품목 테이블 편집기**:
  - 품목 추가/삭제/순서변경
  - 수량, 단가, 소계 실시간 계산
  - 총액 자동 검증 (품목 합계 vs 영수증 총액)
  - OCR 신뢰도별 색상 표시
- 클릭하여 편집 가능한 인터페이스
- 처리 품질 지표 및 개선 제안
- 학습 데이터 피드백 기능

**데이터 관리 페이지:**
- 영수증 목록 (그리드/리스트 뷰)
- **필드별 컬럼 표시 설정** (필수 3개 + 선택 필드들)
- **구매품목 요약 표시** (품목 수, 주요 품목명 등)
- 필터링 옵션 (날짜, 금액, 상호명, 품목명, 사용자 정의 필드 등)
- 고급 검색 (선택 필드 + 품목 정보 포함)
- 선택된 항목 일괄 작업
- **품목별 통계** (인기 품목, 평균 단가 등)

**필드 관리 페이지:**
- 사용 가능한 필드 정의 목록
- 자주 사용되는 필드 즐겨찾기
- 새로운 필드 정의 생성
- 필드별 유효성 검증 규칙 설정

**분석 및 내보내기 페이지:**
- 기본 통계 대시보드 (필수/선택 필드별)
- **구매 패턴 분석** (품목별 구매 빈도, 금액 분포)
- **내보내기 옵션**:
  - **영수증 요약**: 필수 3개 + 선택 필드
  - **품목 상세**: 모든 구매품목 정보 포함
  - **통합 뷰**: 영수증 + 품목 정보 조인
- 필터 조건 설정 (영수증 정보 + 품목 정보)
- 미리보기 기능 (선택된 형식별)
- 파일 형식 선택 (CSV, Excel)

### 7.2 사용자 플로우 (계층적 구조)
1. **사용자 등록**: 회원가입/로그인
2. **그룹 단계**: 그룹 생성 또는 기존 그룹 참여 신청
3. **그룹 승인**: 그룹 관리자의 참여 승인 대기
4. **프로젝트 단계**: 소속 그룹 내에서 프로젝트 생성 (권한 있는 경우)
5. **영수증 처리**: 프로젝트 선택 → 영수증 업로드 → OCR 처리
6. **데이터 검증**: OCR 결과 검토 및 수정
7. **데이터 활용**: 그룹/프로젝트별 데이터 관리 및 분석
8. **결과 내보내기**: 필요시 필터링된 데이터 엑셀 내보내기

**핵심 제약사항:**
- 그룹에 속하지 않으면 프로젝트 생성 불가
- 프로젝트를 선택하지 않으면 영수증 저장 불가

## 8. Implementation Plan

### 8.1 Phase 1 - OCR Container 개발 (2-3개월)
- **OCR Container 구축 (최우선)**
  - 완전한 자급자족 컨테이너 개발
  - Tesseract + EasyOCR 엔진 통합
  - 이미지 전처리 파이프라인
  - FastAPI 백엔드 + React 프론트엔드 통합
  - SQLite 내장 데이터베이스
  - 독립 실행 가능한 Docker 이미지
- **OCR Container Frontend (내장)**
  - 영수증 업로드 UI
  - OCR 결과 검토/수정 인터페이스
  - 데이터 관리 및 검색
  - 기본 통계 및 내보내기
- **기본 Main Application**
  - 사용자 인증 시스템
  - 기본 그룹 및 프로젝트 관리
  - OCR Container 연동 API

### 8.2 Phase 2 - 고도화 및 외부 통합 (2개월)
- **OCR Container 고도화**
  - 머신러닝 기반 OCR 정확도 향상
  - 비동기 처리 및 Webhook 지원
  - 다양한 인증 방식 지원 (API키, OAuth)
  - 고급 이미지 전처리 알고리즘
  - 성능 최적화 및 메모리 관리
- **이식성 향상**
  - Kubernetes Helm Chart 제공
  - Docker Compose 원클릭 배포
  - 환경변수 기반 설정 시스템
  - 외부 데이터베이스 연동 옵션
- **Main Application 확장**
  - 고급 그룹/프로젝트 관리
  - 사용자 대시보드 고도화
  - OCR Container 모니터링

### 8.3 Phase 3 - 상용화 및 생태계 구축 (1-2개월)
- **OCR Container 상용화**
  - Enterprise Edition 개발
  - 유료 플랜 및 라이센스 모델
  - 파트너사 통합 지원 패키지
  - 24/7 기술 지원 체계
  - 상용 배포 가이드 및 문서
- **개발자 생태계**
  - 외부 개발자용 SDK 제공
  - 다양한 언어별 클라이언트 라이브러리
  - 통합 샘플 코드 및 튜토리얼
  - 커뮤니티 지원 포럼
- **Main Application 완성**
  - 고급 데이터 분석 및 통계
  - 모바일 최적화
  - 알림 및 워크플로우 시스템

### 8.4 Phase 4 - 운영 및 확장
- **OCR Container 생태계 운영**
  - 모니터링 및 로깅 시스템 구축
  - 자동 스케일링 및 로드 밸런싱
  - 다양한 외부 통합 사례 확보
  - 버전 관리 및 자동 업데이트 시스템
- **지속적 개선**
  - 사용자 피드백 기반 UI/UX 개선
  - 보안 패치 및 취약점 대응
  - 새로운 OCR 엔진 연구 및 도입
  - 다국어 지원 확장
- **비즈니스 확장**
  - 새로운 업종별 맞춤 솔루션
  - 클라우드 SaaS 버전 출시
  - 파트너십 및 리셀러 프로그램

## 9. Risk Assessment

### 9.1 기술적 위험
- **OCR 정확도 한계**: 다양한 영수증 형태에 대한 인식률 저하
- **한글 처리 복잡성**: 특수 문자나 폰트에 따른 인식 오류
- **성능 이슈**: 대량 이미지 처리 시 서버 부하
- **외부 통합 복잡성**: 다양한 외부 시스템과의 호환성 문제
- **API 버전 관리**: 기존 연동 사이트에 영향 없는 업데이트 어려움

### 9.2 비즈니스 위험
- **사용자 접근성**: 복잡한 UI로 인한 사용자 이탈
- **데이터 보안**: 민감한 영수증 정보 유출 위험
- **경쟁사 대응**: 유사 서비스 출현에 따른 차별화 필요

### 9.3 완화 전략
- **기술적 완화책**
  - 다양한 OCR 엔진 조합으로 정확도 향상
  - 마이크로서비스 아키텍처로 확장성 확보
  - API 버저닝 및 하위 호환성 보장
  - 종합적인 테스트 스위트 구축
- **비즈니스 완화책**
  - 점진적 UI 개선 및 사용자 테스트
  - 보안 감사 및 정기적인 보안 업데이트
  - OCR Core Service로 차별화된 B2B 시장 진입
  - 파트너십을 통한 시장 확산

## 10. Success Criteria

### 10.1 Technical Success
- **OCR Core Service**
  - OCR 정확도 95% 이상 달성
  - API 응답 시간 2초 이내
  - 99.9% 서비스 가용성 유지
  - 외부 통합 성공률 95% 이상
- **전체 시스템**
  - 동시 처리 용량 1000 요청/분
  - 자동 스케일링 기능 정상 작동

### 10.2 User Success
- **웹 애플리케이션**
  - 월간 활성 사용자 1000명 달성
  - 사용자 만족도 4.5/5.0 이상
  - 영수증 처리량 월 10,000건 이상
- **OCR Core Service**
  - 외부 통합 사이트 10개 이상 확보
  - 월간 API 호출 100,000건 이상

### 10.3 Business Success
- **B2C (웹 애플리케이션)**
  - 사용자 재방문율 70% 이상
  - 평균 세션 시간 15분 이상
  - 그룹 생성율 60% 이상
- **B2B (OCR Core Service)**
  - 파트너사 10개 이상 확보
  - API 구독 기업 50개 이상
  - 월 매출 목표 달성

---

## Appendix

### A. 용어 정의
- **OCR**: Optical Character Recognition, 광학 문자 인식
- **OCR Core Service**: 다른 웹사이트에 통합 가능한 독립적인 OCR API 서비스
- **영수증**: 상거래에서 발행되는 결제 증빙 서류
- **프로젝트**: 특정 목적을 위한 영수증 그룹
- **라벨**: 사용자가 정의하는 데이터 분류 기준
- **API 키**: 외부 시스템이 OCR Core Service에 접근하기 위한 인증 키
- **마이크로서비스**: 독립적으로 배포 및 확장 가능한 소규모 서비스

### B. 참고 문서
- PostgreSQL Documentation
- React Documentation
- Tesseract OCR Documentation
- EasyOCR Documentation
- FastAPI Documentation (OCR Core Service)
- Docker & Kubernetes Documentation
- OpenAPI/Swagger Specification
- RESTful API Design Best Practices

### C. 버전 히스토리
- v1.0 - 초기 PRD 작성
- v1.1 - OCR Core Service 재사용 가능한 API 구조 추가
- v1.2 - OCR Container 아키텍처 (Frontend 내장) 반영
- v1.3 - 지능형 이미지 전처리 (영수증 영역 감지, 배경 제거) 추가
- v1.4 - 하이브리드 데이터 구조 (필수 고정 + 선택 유연 필드) 설계
- v1.5 - 구매품목 상세 관리 (일대다 관계 테이블) 추가 (현재)

---

*이 문서는 프로젝트 진행에 따라 지속적으로 업데이트될 예정입니다.*