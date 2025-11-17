# 05. OCR 시스템 개발 워크플로우

## 목표 및 범위

**목표**: Python FastAPI 기반 OCR 마이크로서비스 개발, 영수증 자동 인식 및 데이터 추출  
**소요 기간**: 2주 (10일)  
**담당자**: Python/AI 개발자 1명, 백엔드 개발자 1명 (지원)  
**선행 작업**: [01_Infrastructure_Setup](./01_Infrastructure_Setup.md), [03_Backend_Development](./03_Backend_Development.md) 기본 완료

## 세부 작업 목록

## Week 1: OCR 서비스 기반 구조 (5일)

### Day 1: FastAPI 프로젝트 설정 (8시간)

#### Task 5.1: Python 프로젝트 초기 설정 (3시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [x] FastAPI 프로젝트 구조 설계 (TSD 기반 app/ 디렉토리)
- [ ] 가상환경 설정 및 의존성 관리 (requirements.txt)
- [ ] Docker 컨테이너 설정 및 최적화
- [x] 환경 변수 및 설정 관리 (app/config.py)

**완료 기준**:
- FastAPI 서버 정상 시작 (포트 8000)
- Docker 컨테이너에서 OCR 라이브러리 정상 동작
- 개발환경과 프로덕션 환경 설정 분리

**산출물**:
- `ocr-service/main.py`
- `ocr-service/requirements.txt`
- `ocr-service/Dockerfile.dev`
- `ocr-service/config/settings.py`

#### Task 5.2: OCR 라이브러리 통합 설정 (3시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [x] TesseractOCR 설치 및 한국어 언어팩 설정 (app/core/engines/tesseract.py)
- [x] easyOCR 라이브러리 설치 및 모델 다운로드 (app/core/engines/easyocr.py)
- [ ] Google Vision API 클라이언트 설정
- [x] OCR 엔진별 기본 테스트 (Tesseract, EasyOCR)

**완료 기준**:
- 모든 OCR 엔진 정상 동작 확인
- 한국어 텍스트 인식 테스트 통과
- API 키 관리 시스템 구축

**산출물**:
- `ocr-service/core/ocr_engines/tesseract.py`
- `ocr-service/core/ocr_engines/easyocr.py`
- `ocr-service/core/ocr_engines/google_vision.py`

#### Task 5.3: 이미지 전처리 파이프라인 (2시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [x] OpenCV 기반 이미지 전처리 함수 (app/core/processors/image_processor.py)
- [x] 영수증 영역 자동 감지 및 크로핑
- [x] 이미지 회전 보정 (skew correction)
- [x] 노이즈 제거 및 대비 향상 (CLAHE, binarization)

**완료 기준**:
- 이미지 전처리 파이프라인 정상 동작
- 다양한 영수증 이미지 처리 테스트 통과
- 전처리 전후 인식률 개선 확인

**산출물**:
- `ocr-service/core/image_processor.py`
- `ocr-service/utils/image_utils.py`

---

### Day 2: OCR 처리 로직 구현 (8시간)

#### Task 5.4: 다단계 OCR 처리 시스템 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [x] OCR 엔진 순차 처리 로직 (Tesseract → EasyOCR, app/services/ocr_service.py)
- [x] 인식 결과 신뢰도 평가 시스템 (confidence < 0.7 시 fallback)
- [ ] 실패 시 Google Vision API 호출
- [x] 결과 통합 및 최적화 알고리즘 (OCRService._process_single_file)

**완료 기준**:
- 3단계 OCR 처리 파이프라인 구현
- 신뢰도 기반 결과 선택 로직
- 평균 인식률 90% 이상 달성

**산출물**:
- `ocr-service/core/ocr_processor.py`
- `ocr-service/core/confidence_evaluator.py`

#### Task 5.5: 영수증 데이터 추출 및 파싱 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [x] 정규표현식 기반 패턴 매칭 (날짜, 금액, 사업자번호, app/core/processors/receipt_parser.py)
- [x] 상호명 추출 알고리즘
- [ ] 구매 항목 및 개별 금액 파싱
- [ ] 한글 자연어 처리 (PyKoSpacing, symspellpy)

**완료 기준**:
- 필수 데이터 (날짜, 상호, 총액) 95% 정확도
- 부가 데이터 (항목별 금액) 80% 정확도
- 한글 띄어쓰기 및 맞춤법 교정 적용

**산출물**:
- `ocr-service/core/text_parser.py`
- `ocr-service/core/korean_processor.py`
- `ocr-service/patterns/receipt_patterns.py`

---

### Day 3: API 엔드포인트 구현 (8시간)

#### Task 5.6: 파일 업로드 및 처리 API (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [x] 다중 파일 업로드 엔드포인트 구현 (POST /api/v1/ocr/process, app/api/ocr.py)
- [x] 파일 타입 및 크기 검증
- [x] 비동기 처리 큐 시스템 (asyncio.Semaphore, app/services/ocr_service.py)
- [x] 처리 상태 추적 API (GET /api/v1/ocr/jobs/{job_id})

**완료 기준**:
- 최대 100개 파일 동시 업로드 지원
- 파일당 최대 10MB 처리 가능
- 실시간 처리 상태 확인 가능

**산출물**:
- `ocr-service/api/upload.py`
- `ocr-service/api/jobs.py`
- `ocr-service/core/queue_manager.py`

#### Task 5.7: OCR 결과 조회 및 수정 API (4시간)
**담당자**: Python/AI 개발자 + 백엔드 지원  

**세부 작업**:
- [x] OCR 결과 조회 API (GET /api/v1/ocr/jobs/{job_id}, app/api/ocr.py)
- [ ] 결과 수정 API (사용자 피드백)
- [ ] 썸네일 이미지 생성 및 제공
- [ ] 학습 데이터 수집 API

**완료 기준**:
- OCR 결과 CRUD API 완전 구현
- 사용자 수정 데이터 학습용 저장
- 이미지 썸네일 자동 생성

**산출물**:
- `ocr-service/api/results.py`
- `ocr-service/api/feedback.py`
- `ocr-service/core/thumbnail_generator.py`

---

### Day 4: 백엔드 연동 및 통신 (8시간)

#### Task 5.8: NestJS 백엔드와 통신 인터페이스 (4시간)
**담당자**: 백엔드 개발자 + Python 개발자  

**세부 작업**:
- [x] OCR 작업 요청/응답 스키마 정의 (OcrJobResponse, OcrResultResponse)
- [x] HTTP 클라이언트 통신 구현 (modules/ocr/ocr-client.service.ts)
- [ ] 작업 상태 동기화 시스템
- [x] 에러 처리 및 재시도 로직

**완료 기준**:
- 백엔드-OCR 서비스 안정적 통신
- 작업 상태 실시간 동기화
- 통신 장애 시 적절한 에러 처리

**산출물**:
- `backend/src/ocr/ocr-client.service.ts`
- `ocr-service/api/webhook.py`
- `shared/schemas/ocr-schemas.ts`

#### Task 5.9: 데이터베이스 연동 (4시간)
**담당자**: 백엔드 개발자  

**세부 작업**:
- [ ] OCR 작업 결과 데이터베이스 저장
- [ ] 영수증 메타데이터 관리
- [ ] 처리 통계 및 로그 저장
- [ ] 학습 데이터 관리 테이블

**완료 기준**:
- OCR 결과 완전한 데이터베이스 저장
- 처리 이력 추적 가능
- 학습용 데이터 체계적 관리

**산출물**:
- `backend/src/ocr/ocr-results.service.ts`
- `backend/src/database/migrations/015-ocr-tables.ts`

---

### Day 5: 성능 최적화 및 캐싱 (8시간)

#### Task 5.10: 처리 성능 최적화 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] 다중 프로세스 병렬 처리
- [ ] 이미지 크기별 최적화 전략
- [ ] 메모리 사용량 최적화
- [ ] GPU 가속 활용 (가능한 경우)

**완료 기준**:
- 영수증 1장당 평균 처리 시간 5초 이내
- 동시 처리 가능한 작업 수 10개 이상
- 메모리 사용량 효율적 관리

**산출물**:
- `ocr-service/core/parallel_processor.py`
- `ocr-service/config/performance.py`

#### Task 5.11: 결과 캐싱 시스템 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] Redis 기반 결과 캐싱
- [ ] 이미지 해시 기반 중복 처리 방지
- [ ] 캐시 만료 및 관리 정책
- [ ] 캐시 적중률 모니터링

**완료 기준**:
- 동일 이미지 재처리 방지
- 캐시 적중률 70% 이상
- 캐시 메모리 효율적 사용

**산출물**:
- `ocr-service/core/cache_manager.py`
- `ocr-service/utils/hash_generator.py`

## Week 2: 머신러닝 및 정확도 개선 (5일)

### Day 6: 머신러닝 파이프라인 구축 (8시간)

#### Task 5.12: 학습 데이터 수집 시스템 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] 사용자 수정 데이터 수집
- [ ] 학습용 데이터셋 구축
- [ ] 데이터 전처리 및 정제
- [ ] 라벨링 시스템 구현

**완료 기준**:
- 사용자 피드백 자동 수집
- 학습 데이터 품질 검증
- 데이터셋 지속적 확장

**산출물**:
- `ocr-service/ml/data_collector.py`
- `ocr-service/ml/dataset_manager.py`

#### Task 5.13: 기본 머신러닝 모델 구현 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] 텍스트 분류 모델 (영수증 유형)
- [ ] 패턴 인식 모델 (금액, 날짜 추출)
- [ ] 신뢰도 예측 모델
- [ ] 모델 학습 파이프라인

**완료 기준**:
- 기본 분류 모델 정확도 85% 이상
- 모델 학습 및 평가 자동화
- 모델 버전 관리 시스템

**산출물**:
- `ocr-service/ml/models/text_classifier.py`
- `ocr-service/ml/models/pattern_recognizer.py`
- `ocr-service/ml/training/trainer.py`

---

### Day 7: 정확도 향상 알고리즘 (8시간)

#### Task 5.14: 후처리 알고리즘 개발 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] 인식 결과 검증 알고리즘
- [ ] 논리적 일관성 검사 (총액 = 개별 금액 합계)
- [ ] 컨텍스트 기반 오류 수정
- [ ] 신뢰도 기반 결과 필터링

**완료 기준**:
- 논리적 오류 감지 및 수정
- 전체 정확도 5% 이상 향상
- 거짓 양성 결과 감소

**산출물**:
- `ocr-service/core/post_processor.py`
- `ocr-service/core/validator.py`

#### Task 5.15: 적응형 학습 시스템 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] 실시간 피드백 학습
- [ ] 모델 성능 모니터링
- [ ] 자동 재학습 트리거
- [ ] A/B 테스트 프레임워크

**완료 기준**:
- 사용자 피드백 기반 자동 학습
- 모델 성능 지속적 개선
- A/B 테스트로 개선 효과 검증

**산출물**:
- `ocr-service/ml/adaptive_learning.py`
- `ocr-service/ml/ab_testing.py`

---

### Day 8: 특화 기능 개발 (8시간)

#### Task 5.16: 영수증 유형별 특화 처리 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] 매장 유형별 레이아웃 인식 (카드결제, 현금결제)
- [ ] 프랜차이즈별 템플릿 매칭
- [ ] 온라인 구매 영수증 처리
- [ ] 손글씨 영수증 인식 개선

**완료 기준**:
- 주요 매장 유형 90% 이상 정확도
- 다양한 영수증 형태 지원
- 특화 처리로 전체 성능 향상

**산출물**:
- `ocr-service/core/specialized_processors/`
- `ocr-service/templates/receipt_templates.py`

#### Task 5.17: 실시간 피드백 인터페이스 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] 웹소켓 기반 실시간 상태 업데이트
- [ ] 처리 진행률 실시간 전송
- [ ] 즉시 수정 기능 API
- [ ] 배치 처리 결과 알림

**완료 기준**:
- 실시간 처리 상태 업데이트
- 사용자 즉시 피드백 반영
- 배치 작업 완료 알림

**산출물**:
- `ocr-service/api/websocket.py`
- `ocr-service/core/realtime_updater.py`

---

### Day 9: 모니터링 및 로깅 (8시간)

#### Task 5.18: 성능 모니터링 시스템 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] 처리 시간 및 정확도 메트릭 수집
- [ ] 에러율 및 실패 패턴 분석
- [ ] 리소스 사용량 모니터링
- [ ] 알림 및 임계값 설정

**완료 기준**:
- 주요 성능 지표 실시간 모니터링
- 이상 상황 자동 알림
- 성능 트렌드 분석 가능

**산출물**:
- `ocr-service/monitoring/metrics_collector.py`
- `ocr-service/monitoring/alerting.py`

#### Task 5.19: 로깅 및 디버깅 시스템 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] 구조화된 로깅 시스템
- [ ] OCR 처리 과정 상세 로깅
- [ ] 에러 추적 및 디버깅 정보
- [ ] 로그 분석 및 검색 기능

**완료 기준**:
- 모든 처리 과정 추적 가능
- 에러 발생 시 상세 정보 제공
- 로그 기반 문제 해결 가능

**산출물**:
- `ocr-service/utils/logger.py`
- `ocr-service/utils/debug_helper.py`

---

### Day 10: 최종 통합 및 테스트 (8시간)

#### Task 5.20: 전체 시스템 통합 테스트 (4시간)
**담당자**: Python/AI 개발자 + 백엔드 개발자  

**세부 작업**:
- [ ] 백엔드-OCR 서비스 통합 테스트
- [ ] 대용량 파일 처리 테스트
- [ ] 동시 처리 부하 테스트
- [ ] 장애 복구 테스트

**완료 기준**:
- 전체 워크플로우 정상 동작
- 부하 상황에서 안정성 확인
- 장애 시 적절한 복구

**산출물**:
- `ocr-service/tests/integration/`
- `ocr-service/tests/load_testing/`

#### Task 5.21: 문서화 및 배포 준비 (4시간)
**담당자**: Python/AI 개발자  

**세부 작업**:
- [ ] API 문서 작성 (OpenAPI/Swagger)
- [ ] 운영 가이드 작성
- [ ] 성능 튜닝 가이드
- [ ] 문제 해결 가이드

**완료 기준**:
- 완전한 API 문서
- 운영팀용 가이드 완성
- 성능 최적화 지침 제공

**산출물**:
- `docs/ocr-api-documentation.md`
- `docs/ocr-operations-guide.md`
- `docs/ocr-troubleshooting.md`

## 병렬 작업 가능성

### Week 1: 기반 구조 구축
```
Python/AI 개발자                백엔드 개발자 (지원)
├─ FastAPI 프로젝트 설정         ├─ 백엔드 연동 인터페이스 설계
├─ OCR 라이브러리 통합           ├─ 데이터베이스 스키마 준비
├─ 이미지 전처리 파이프라인       ├─ 통신 프로토콜 정의
├─ OCR 처리 로직                ├─ 에러 처리 표준화
└─ API 엔드포인트 구현           └─ 데이터베이스 연동
```

### Week 2: 고도화 기능
```
Python/AI 개발자                백엔드 개발자 (지원)
├─ 머신러닝 파이프라인           ├─ 학습 데이터 관리
├─ 정확도 향상 알고리즘          ├─ 통계 데이터 수집
├─ 특화 기능 개발              ├─ 성능 모니터링 연동
├─ 모니터링 시스템              ├─ 로그 분석 시스템
└─ 통합 테스트                 └─ 문서화 지원
```

## 위험 요소 및 대응 방안

### 기술적 위험
1. **OCR 정확도 한계**
   - 위험: 한국어 영수증 인식률 저조
   - 대응: 다중 엔진 활용, 전처리 최적화, 머신러닝 보완

2. **성능 병목**
   - 위험: 대용량 이미지 처리 지연
   - 대응: 병렬 처리, 이미지 최적화, 캐싱

3. **리소스 사용량**
   - 위험: 메모리 및 CPU 과다 사용
   - 대응: 리소스 모니터링, 최적화, 스케일링

### 외부 의존성 위험
1. **Google Vision API**
   - 위험: API 한도 초과, 비용 증가
   - 대응: 사용량 모니터링, 대안 엔진 준비

2. **라이브러리 의존성**
   - 위험: 라이브러리 버전 충돌
   - 대응: 가상환경 격리, 의존성 고정

## 완료 후 확인 사항

### 기능 검증
- [ ] 영수증 이미지 정상 업로드 및 처리
- [ ] OCR 3단계 처리 파이프라인 동작
- [ ] 필수 데이터 추출 95% 정확도
- [ ] 백엔드와 안정적 통신
- [ ] 실시간 상태 업데이트

### 성능 검증
- [ ] 영수증 1장당 처리 시간 5초 이내
- [ ] 100개 파일 동시 처리 가능
- [ ] 캐시 적중률 70% 이상
- [ ] 메모리 사용량 적정 수준

### 정확도 검증
- [ ] 날짜 인식 정확도 95% 이상
- [ ] 상호명 인식 정확도 90% 이상
- [ ] 총액 인식 정확도 95% 이상
- [ ] 항목별 금액 인식 80% 이상

### 안정성 검증
- [ ] 24시간 연속 운영 안정성
- [ ] 장애 발생 시 자동 복구
- [ ] 에러 상황 적절한 처리
- [ ] 모니터링 시스템 정상 동작

## 다음 단계

워크플로우 완료 후 진행할 작업:
1. **[04_Frontend_Development](./04_Frontend_Development.md)** - OCR UI와 연동
2. **[07_Testing_QA](./07_Testing_QA.md)** - OCR 정확도 및 성능 테스트

---

**관련 문서**:
- [TSD 05_OCR_System](../TSD/05_OCR_System.md)
- [메인 워크플로우](./00_Main_Workflow.md)
- [백엔드 개발](./03_Backend_Development.md)