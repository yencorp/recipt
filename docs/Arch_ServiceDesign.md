# Receipt OCR Management System - Service Design Document

## 1. Executive Summary

본 서비스 설계 문서는 Receipt OCR Management System PRD를 바탕으로 실제 구현 가능한 서비스 아키텍처를 정의합니다. 핵심은 **재사용 가능한 OCR Container**와 **Main Application**의 마이크로서비스 분리, 그리고 **머신러닝/강화학습 기반 지능형 OCR 시스템**을 통해 확장성과 포터빌리티, 높은 정확도를 동시에 달성하는 것입니다.

### 1.1 아키텍처 원칙
- **독립성**: OCR Container는 완전히 자급자족 가능한 독립 서비스
- **재사용성**: 외부 시스템 통합을 위한 API-First 설계
- **확장성**: 마이크로서비스 기반 수평 확장 지원
- **데이터 일관성**: 하이브리드 스키마를 통한 유연성과 구조화 균형
- **지능형 학습**: 강화학습을 통한 지속적 정확도 향상
- **피드백 중심**: 사용자 수정 데이터를 활용한 실시간 모델 개선

### 1.2 서비스 구성
1. **OCR Container Service**: 포터블 OCR 처리 전담 서비스 (ML/RL 엔진 내장)
2. **Main Application Service**: 그룹/프로젝트 관리 및 사용자 대시보드
3. **ML Pipeline Service**: 강화학습 모델 훈련 및 추론 서비스
4. **API Gateway**: 서비스 간 통신 및 외부 API 관리
5. **Database Services**: PostgreSQL 기반 데이터 저장
6. **File Storage**: 이미지 파일 저장 및 관리
7. **Feature Store**: ML 피처 및 실험 데이터 관리

## 2. 전체 서비스 아키텍처

### 2.1 서비스 분할 전략

```mermaid
graph TB
    subgraph "External Systems"
        EXT[외부 웹사이트/시스템]
    end
    
    subgraph "API Gateway Layer"
        GW[API Gateway<br/>Kong/Nginx]
    end
    
    subgraph "Application Services"
        MAIN[Main Application<br/>Groups/Projects/Dashboard]
        OCR[OCR Container<br/>Complete Portable Service]
        ML[ML Pipeline Service<br/>RL Training/Inference]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Main DB)]
        REDIS[(Redis<br/>Cache/Queue/Features)]
        S3[(MinIO/S3<br/>File Storage)]
        FS[(Feature Store<br/>MLflow/Feast)]
    end
    
    subgraph "Infrastructure"
        MON[Monitoring<br/>Prometheus/Grafana]
        LOG[Logging<br/>ELK Stack]
    end
    
    EXT --> GW
    GW --> MAIN
    GW --> OCR
    GW --> ML
    MAIN --> DB
    MAIN --> REDIS
    OCR --> S3
    OCR --> REDIS
    OCR --> ML
    ML --> FS
    ML --> REDIS
    ML --> DB
    
    MAIN --> MON
    OCR --> MON
    ML --> MON
    MAIN --> LOG
    OCR --> LOG
    ML --> LOG
```

### 2.2 서비스 간 통신 방식

**동기 통신:**
- HTTP/REST API: 실시간 데이터 조회 및 업데이트
- gRPC: 고성능이 필요한 내부 서비스 간 통신

**비동기 통신:**
- Redis Queue: OCR 작업 처리, 이미지 전처리
- Webhook: OCR 완료 결과 알림
- Event Streaming: 데이터 변경 이벤트 전파

### 2.3 데이터 흐름 설계

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Main as Main App
    participant Gateway as API Gateway
    participant OCR as OCR Container
    participant DB as Database
    participant Storage as File Storage
    
    User->>Main: 영수증 업로드 요청
    Main->>Gateway: OCR 처리 요청
    Gateway->>OCR: 이미지 + 메타데이터
    OCR->>Storage: 원본 이미지 저장
    OCR->>OCR: 영수증 영역 감지 (ML 모델)
    OCR->>Storage: 처리된 이미지 저장
    OCR->>OCR: OCR 처리 (Tesseract + EasyOCR)
    OCR->>ML: RL 에이전트 결과 선택 요청
    ML->>OCR: 최적 OCR 결과 반환
    OCR->>Gateway: 강화된 OCR 결과 반환
    Gateway->>Main: 처리 결과 전달
    Main->>DB: 영수증 데이터 저장 (하이브리드 스키마)
    Main->>User: 처리 완료 알림
    User->>Main: OCR 결과 수정 (피드백)
    Main->>ML: 피드백 데이터 전송
    ML->>ML: RL 모델 업데이트
```

## 3. ML Pipeline Service 상세 설계

### 3.1 강화학습 아키텍처

ML Pipeline Service는 OCR Container의 성능을 지속적으로 향상시키는 강화학습 시스템입니다.

```mermaid
graph TB
    subgraph "RL Environment"
        ENV[OCR 선택 환경]
        STATE[State: OCR 결과와 컴텍스트]
        ACTION[Action: Tesseract/EasyOCR 선택]
        REWARD[Reward: 사용자 피드백 기반]
    end
    
    subgraph "RL Agent"
        DQN[Deep Q-Network]
        REPLAY[Experience Replay Buffer]
        TARGET[Target Network]
    end
    
    subgraph "Training Infrastructure"
        CELERY[Celery 배치 학습]
        MLFLOW[MLflow 실험 추적]
        FEAST[Feast Feature Store]
    end
    
    subgraph "Model Serving"
        TORCH[TorchServe 모델 서빙]
        REDIS_ML[Redis 모델 캐싱]
        AB[A/B 테스트 컨트롤러]
    end
    
    ENV --> DQN
    DQN --> REPLAY
    REPLAY --> TARGET
    DQN --> CELERY
    CELERY --> MLFLOW
    MLFLOW --> FEAST
    DQN --> TORCH
    TORCH --> REDIS_ML
    TORCH --> AB
```

### 3.2 RL 에이전트 구조

```python
class OCRSelectionAgent:
    """강화학습 기반 OCR 결과 선택 에이전트"""
    
    def __init__(self, state_dim: int, action_dim: int):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.q_network = DQNNetwork(state_dim, action_dim).to(self.device)
        self.target_network = DQNNetwork(state_dim, action_dim).to(self.device)
        self.replay_buffer = ReplayBuffer(capacity=50000)
        self.optimizer = torch.optim.Adam(self.q_network.parameters(), lr=0.001)
        
    def get_state_features(self, ocr_results: Dict, context: Dict) -> torch.Tensor:
        """OCR 결과와 컴텍스트로부터 상태 벡터 추출"""
        features = []
        
        # OCR 엔진별 신뢰도 점수
        features.extend([
            ocr_results['tesseract']['confidence'],
            ocr_results['easyocr']['confidence']
        ])
        
        # 영수증 유형 인코딩 (원-핫 인코딩)
        receipt_types = ['restaurant', 'retail', 'gas_station', 'pharmacy', 'other']
        receipt_type_vector = [1 if context['receipt_type'] == rt else 0 for rt in receipt_types]
        features.extend(receipt_type_vector)
        
        # 텍스트 내용 특성 (문자 수, 숫자 비율 등)
        for engine in ['tesseract', 'easyocr']:
            text = ocr_results[engine]['text']
            features.extend([
                len(text),
                len([c for c in text if c.isdigit()]) / max(len(text), 1),
                len([c for c in text if c in '한글']) / max(len(text), 1)
            ])
        
        # 사용자 개인화 특성
        features.extend([
            context.get('user_correction_rate', 0.0),
            context.get('preferred_engine_history', 0.5)  # 0: tesseract, 1: easyocr 선호
        ])
        
        return torch.FloatTensor(features).to(self.device)
    
    def select_action(self, state: torch.Tensor, epsilon: float = 0.0) -> int:
        """ε-greedy 전략으로 액션 선택"""
        if random.random() < epsilon:
            return random.randint(0, 1)  # 0: tesseract, 1: easyocr
        
        with torch.no_grad():
            q_values = self.q_network(state.unsqueeze(0))
            return q_values.argmax().item()
    
    def learn(self, batch_size: int = 32):
        """Experience Replay로 모델 학습"""
        if len(self.replay_buffer) < batch_size:
            return
        
        batch = self.replay_buffer.sample(batch_size)
        states, actions, rewards, next_states, dones = batch
        
        current_q_values = self.q_network(states).gather(1, actions.unsqueeze(1))
        next_q_values = self.target_network(next_states).max(1)[0].detach()
        target_q_values = rewards + (0.99 * next_q_values * (1 - dones))
        
        loss = F.mse_loss(current_q_values.squeeze(), target_q_values)
        
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        # MLflow로 학습 로그 기록
        mlflow.log_metric("training_loss", loss.item())
        mlflow.log_metric("q_value_mean", current_q_values.mean().item())
```

### 3.3 피드백 수집 및 보상 시스템

```python
class FeedbackRewardSystem:
    """사용자 피드백 기반 보상 시스템"""
    
    def calculate_reward(self, original_ocr: Dict, corrected_data: Dict, 
                        selected_engine: str) -> float:
        """피드백 데이터로부터 보상 계산"""
        
        # 필드별 정확도 계산
        field_accuracies = []
        essential_fields = ['merchant_name', 'total_amount', 'payment_date']
        
        for field in essential_fields:
            original = original_ocr.get(field, '')
            corrected = corrected_data.get(field, '')
            
            if original == corrected:  # 수정 없음 (정확)
                field_accuracies.append(1.0)
            else:  # 수정 필요 (부정확)
                similarity = self.calculate_similarity(original, corrected)
                field_accuracies.append(max(0.0, similarity - 0.5))  # 50% 이하는 음수 보상
        
        # 구매항목 정확도 계산
        items_accuracy = self.calculate_items_accuracy(
            original_ocr.get('items', []), 
            corrected_data.get('items', [])
        )
        field_accuracies.append(items_accuracy)
        
        # 전체 정확도 및 보상 계산
        overall_accuracy = sum(field_accuracies) / len(field_accuracies)
        
        # 보상 = 2 * (accuracy - 0.5)  # -1 ~ +1 범위
        reward = 2.0 * (overall_accuracy - 0.5)
        
        # 선택한 엔진이 더 좋은 결과를 냈다면 추가 보상
        other_engine = 'easyocr' if selected_engine == 'tesseract' else 'tesseract'
        other_accuracy = self.calculate_ocr_accuracy(original_ocr[other_engine], corrected_data)
        
        if overall_accuracy > other_accuracy:
            reward += 0.2  # 올바른 선택 보너스
        
        return np.clip(reward, -1.0, 1.0)
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """두 텍스트 간 유사도 계산 (Levenshtein + Semantic)"""
        from difflib import SequenceMatcher
        return SequenceMatcher(None, text1, text2).ratio()
```

### 3.4 모델 버전 관리 및 A/B 테스트

```python
class ModelVersionManager:
    """모델 버전 관리 및 A/B 테스트 시스템"""
    
    def __init__(self):
        self.mlflow_client = MlflowClient()
        self.model_registry = "ocr_selection_models"
        
    def deploy_model_version(self, model_version: str, traffic_percentage: float):
        """새 모델 버전 배포 및 트래픽 분할"""
        
        # 모델 다운로드 및 TorchServe에 배포
        model_uri = f"models:/{self.model_registry}/{model_version}"
        model = mlflow.pytorch.load_model(model_uri)
        
        # A/B 테스트 설정 업데이트
        ab_config = {
            "model_versions": {
                "current": {"version": "current", "traffic": 100 - traffic_percentage},
                "candidate": {"version": model_version, "traffic": traffic_percentage}
            },
            "metrics_to_track": [
                "accuracy", "response_time", "user_satisfaction", "correction_rate"
            ]
        }
        
        # Redis에 A/B 테스트 설정 저장
        self.redis.setex(
            "ab_test_config", 
            timedelta(hours=24), 
            json.dumps(ab_config)
        )
        
        return ab_config
    
    def evaluate_ab_test_results(self, test_duration_hours: int = 24) -> Dict:
        """고 테스트 결과 평가 및 통계적 유의성 검증"""
        
        # 테스트 기간 동안 메트릭 수집
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=test_duration_hours)
        
        metrics = self.collect_test_metrics(start_time, end_time)
        
        # 통계적 유의성 검증 (t-test)
        from scipy.stats import ttest_ind
        
        current_accuracies = metrics['current']['accuracies']
        candidate_accuracies = metrics['candidate']['accuracies']
        
        t_stat, p_value = ttest_ind(candidate_accuracies, current_accuracies)
        
        result = {
            "test_duration": test_duration_hours,
            "sample_sizes": {
                "current": len(current_accuracies),
                "candidate": len(candidate_accuracies)
            },
            "mean_accuracies": {
                "current": np.mean(current_accuracies),
                "candidate": np.mean(candidate_accuracies)
            },
            "statistical_test": {
                "t_statistic": t_stat,
                "p_value": p_value,
                "significant": p_value < 0.05
            },
            "recommendation": self.make_deployment_recommendation(t_stat, p_value)
        }
        
        # MLflow에 A/B 테스트 결과 로그
        mlflow.log_dict(result, "ab_test_results.json")
        
        return result
```

### 3.5 실시간 모델 서빙 및 캐싱

```python
class RealTimeInferenceService:
    """실시간 ML 모델 추론 서비스"""
    
    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379, db=0)
        self.model_cache = {}
        self.feature_store = FeastClient()
        
    async def get_ocr_selection(self, ocr_results: Dict, context: Dict) -> Dict:
        """실시간 OCR 엔진 선택 추론"""
        
        # A/B 테스트 설정 확인
        ab_config = self.get_ab_test_config()
        selected_model = self.select_model_by_traffic(ab_config)
        
        # 피처 준비 및 캐싱 확인
        cache_key = self.generate_cache_key(ocr_results, context)
        cached_result = self.redis.get(cache_key)
        
        if cached_result:
            return json.loads(cached_result)
        
        # 모델 추론
        start_time = time.time()
        
        agent = self.get_model(selected_model)
        state_features = agent.get_state_features(ocr_results, context)
        selected_action = agent.select_action(state_features, epsilon=0.0)  # No exploration in production
        
        inference_time = time.time() - start_time
        
        # 결과 준비
        engine_name = 'tesseract' if selected_action == 0 else 'easyocr'
        confidence = torch.softmax(agent.q_network(state_features.unsqueeze(0)), dim=1)[0][selected_action].item()
        
        result = {
            "selected_engine": engine_name,
            "confidence": float(confidence),
            "model_version": selected_model,
            "inference_time": inference_time,
            "selected_ocr_result": ocr_results[engine_name],
            "metadata": {
                "state_features": state_features.cpu().numpy().tolist(),
                "q_values": agent.q_network(state_features.unsqueeze(0)).cpu().numpy().tolist()[0]
            }
        }
        
        # 결과 캐싱 (5분)
        self.redis.setex(cache_key, 300, json.dumps(result, cls=NumpyEncoder))
        
        # 모니터링 메트릭 기록
        self.record_inference_metrics(selected_model, inference_time, confidence)
        
        return result
```

## 4. OCR Container 서비스 상세 설계

### 4.1 ML 통합 OCR 컨테이너 구조

OCR Container는 ML Pipeline Service와 긴밀히 통합된 지능형 OCR 서비스로, 다른 웹사이트에 쉽게 통합할 수 있도록 설계됩니다.

```dockerfile
# Multi-stage Docker Build Structure with ML Integration
FROM node:18-alpine AS frontend-builder
# React Frontend Build with ML Dashboard Components

FROM pytorch/pytorch:2.0-cuda11.7-cudnn8-devel AS ml-base
# PyTorch + ML Dependencies (TorchServe, scikit-learn)

FROM python:3.11-slim AS backend-base
# Python Backend + OCR Engines + ML Client
COPY --from=ml-base /opt/conda/lib/python3.10/site-packages/torch /opt/conda/lib/python3.10/site-packages/torch

FROM nginx:alpine AS production
# Frontend + Backend Integration + ML Model Serving
```

### 3.2 내장 컴포넌트 구성

### 4.2 ML 강화 Backend Service (FastAPI)

```python
# ML 통합 OCR 컨테이너 구조
app/
├── main.py                 # FastAPI 애플리케이션 진입점
├── api/
│   ├── v1/
│   │   ├── ocr.py         # OCR 처리 엔드포인트
│   │   ├── auth.py        # API 키 인증
│   │   └── images.py      # 이미지 관리
├── services/
│   ├── ocr_service.py     # OCR 엔진 통합
│   ├── image_processor.py # 이미지 전처리
│   └── vision_service.py  # 컴퓨터 비전 처리
├── models/
│   ├── ocr_models.py      # 데이터 모델
│   └── response_models.py # API 응답 모델
└── core/
    ├── config.py          # 설정 관리
    └── security.py        # 보안 설정
```

### 4.3 ML 강화 Frontend Service (React)

```typescript
// ML 기능 통합 컴포넌트 구조
src/
├── components/
│   ├── upload/
│   │   ├── ImageUpload.tsx      # AI 강화 이미지 업로드 UI
│   │   └── ProcessingStatus.tsx # ML 처리 상태 실시간 표시
│   ├── review/
│   │   ├── OCRResultReview.tsx  # ML 신뢰도 포함 OCR 결과 검토
│   │   ├── MLConfidenceViewer.tsx # ML 모델 신뢰도 시각화
│   │   ├── ImageViewer.tsx      # 3단계 이미지 뷰어
│   │   └── ItemEditor.tsx       # 구매품목 편집기
│   ├── feedback/
│   │   ├── FeedbackCollector.tsx # 사용자 피드백 수집 UI
│   │   ├── CorrectionsTracker.tsx # 수정 내역 추적
│   │   └── LearningIndicator.tsx # 학습 진행 표시기
│   ├── analytics/
│   │   ├── AccuracyDashboard.tsx # 정확도 대시보드
│   │   ├── ModelPerformance.tsx # 모델 성능 시각화
│   │   └── LearningProgress.tsx # 학습 진도 차트
│   └── management/
│       ├── ReceiptList.tsx      # ML 신뢰도 포함 영수증 목록
│       └── DataExport.tsx       # 데이터 내보내기
├── services/
│   ├── api.ts                   # API 통신 서비스
│   ├── mlApi.ts                 # ML 전용 API 서비스
│   ├── feedbackApi.ts           # 피드백 API 서비스
│   └── types.ts                 # TypeScript 타입 정의
├── hooks/
│   ├── useOCR.ts                # ML 강화 OCR 처리 훅
│   ├── useMLInference.ts        # ML 모델 추론 훅
│   ├── useFeedback.ts           # 피드백 수집 훅
│   ├── useImageUpload.ts        # 이미지 업로드 훅
│   └── useModelMetrics.ts       # 모델 성능 메트릭 훅
└── utils/
    ├── mlHelpers.ts             # ML 유틸리티 함수
    └── confidenceCalculator.ts  # 신뢰도 계산 유틸리티
```

### 4.4 ML 강화 이미지 처리 파이프라인

```python
class ImageProcessingPipeline:
    """영수증 이미지 처리 파이프라인"""
    
    def __init__(self):
        self.detector = ReceiptDetector()
        self.preprocessor = ImagePreprocessor()
        self.ocr_engines = {
            'tesseract': TesseractEngine(),
            'easyocr': EasyOCREngine()
        }
    
    async def process_receipt(self, image_data: bytes) -> ProcessingResult:
        """영수증 처리 전체 파이프라인"""
        
        # 1. 원본 이미지 저장
        original_path = await self.save_image(image_data, 'original')
        
        # 2. 영수증 영역 감지
        detection_result = await self.detector.detect_receipt_area(image_data)
        
        if not detection_result.success:
            return ProcessingResult(error="영수증 영역 감지 실패")
        
        # 3. 영수증 영역 추출 및 전처리
        cropped_image = await self.preprocessor.crop_receipt_area(
            image_data, detection_result.bounding_box
        )
        processed_path = await self.save_image(cropped_image, 'processed')
        
        # 4. 회전 및 기울기 보정
        corrected_image = await self.preprocessor.correct_orientation(cropped_image)
        final_path = await self.save_image(corrected_image, 'final')
        
        # 5. 병렬 OCR 처리
        ocr_tasks = [
            self.ocr_engines['tesseract'].process(corrected_image),
            self.ocr_engines['easyocr'].process(corrected_image)
        ]
        ocr_results = await asyncio.gather(*ocr_tasks)
        
        # 6. ML 기반 최적 결과 선택
        ml_context = {
            'receipt_type': self._classify_receipt_type(corrected_image),
            'user_id': context.get('user_id'),
            'user_correction_rate': await self._get_user_correction_rate(context.get('user_id'))
        }
        
        ml_selection = await self.ml_client.select_best_ocr_result(
            {
                'tesseract': ocr_results[0],
                'easyocr': ocr_results[1]
            },
            ml_context
        )
        
        # 7. 구조화된 데이터 추출
        structured_data = await self.extract_structured_data(ml_selection['selected_ocr_result']['text'])
        
        # 8. 피드백 수집 준비
        feedback_metadata = {
            'processing_id': str(uuid.uuid4()),
            'ocr_results': ocr_results,
            'ml_selection': ml_selection,
            'context': ml_context
        }
        
        return ProcessingResult(
            images={
                'original': original_path,
                'processed': processed_path,
                'final': final_path
            },
            detection=detection_result,
            ocr_results={
                'tesseract': ocr_results[0],
                'easyocr': ocr_results[1],
                'ml_enhanced': ml_selection
            },
            structured_data=structured_data,
            feedback_metadata=feedback_metadata,
            processing_time=time.time() - start_time
        )
```

    async def _classify_receipt_type(self, image: bytes) -> str:
        """영수증 유형 분류 (ML 모델 기반)"""
        # 영수증 유형 분류 로직 (restaurant, retail, gas_station, etc.)
        # 여기는 간단한 구현으로 대체
        return "restaurant"  # 실제로는 ML 모델 결과 반환
    
    async def _get_user_correction_rate(self, user_id: str) -> float:
        """사용자의 OCR 수정 비율 조회"""
        if not user_id:
            return 0.5  # 기본값
        
        # 사용자별 과거 수정 데이터로부터 비율 계산
        correction_stats = await self.feedback_collector.get_user_correction_stats(user_id)
        return correction_stats.get('correction_rate', 0.5)

### 4.5 ML 기반 컴퓨터 비전 구현

```python
class ReceiptDetector:
    """영수증 영역 감지 클래스"""
    
    def __init__(self):
        # YOLOv8 모델 또는 전통적인 CV 알고리즘 사용
        self.use_ml_model = True
        if self.use_ml_model:
            self.model = YOLO('receipt_detector.pt')
    
    async def detect_receipt_area(self, image_data: bytes) -> DetectionResult:
        """영수증 영역 감지"""
        
        # 이미지 로드
        image = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
        
        if self.use_ml_model:
            # ML 모델 기반 감지
            results = self.model(image)
            if len(results[0].boxes) > 0:
                box = results[0].boxes[0].xyxy[0].cpu().numpy()
                confidence = results[0].boxes[0].conf[0].cpu().numpy()
                return DetectionResult(
                    success=True,
                    bounding_box=box,
                    confidence=confidence
                )
        
        # 전통적인 CV 알고리즘 폴백
        return await self.detect_with_traditional_cv(image)
    
    async def detect_with_traditional_cv(self, image) -> DetectionResult:
        """전통적인 컴퓨터 비전 알고리즘으로 감지"""
        
        # 1. 그레이스케일 변환
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 2. 가우시안 블러로 노이즈 제거
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # 3. Canny 엣지 검출
        edges = cv2.Canny(blurred, 50, 150, apertureSize=3)
        
        # 4. 형태학적 연산으로 엣지 강화
        kernel = np.ones((3, 3), np.uint8)
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        
        # 5. 컨투어 검출
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 6. 영수증 형태의 컨투어 필터링
        receipt_contour = self.find_receipt_contour(contours, image.shape)
        
        if receipt_contour is not None:
            # 바운딩 박스 계산
            x, y, w, h = cv2.boundingRect(receipt_contour)
            
            # 컨투어 면적으로 신뢰도 계산
            contour_area = cv2.contourArea(receipt_contour)
            image_area = image.shape[0] * image.shape[1]
            confidence = min(0.95, contour_area / image_area * 2)
            
            return DetectionResult(
                success=True,
                bounding_box=[x, y, x+w, y+h],
                confidence=confidence,
                contour=receipt_contour
            )
        
        return DetectionResult(success=False, error="영수증 영역을 찾을 수 없습니다.")
```

### 3.5 OCR Container API 설계

```python
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.security import HTTPBearer
from typing import List, Optional
import asyncio

app = FastAPI(
    title="OCR Container Service",
    description="Portable Receipt OCR Service",
    version="1.0.0"
)

# 보안 설정
security = HTTPBearer()

@app.post("/api/v1/ocr/process", response_model=OCRProcessingResponse)
async def process_receipt(
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key),
    async_processing: bool = False,
    webhook_url: Optional[str] = None
):
    """영수증 이미지 OCR 처리"""
    
    # 파일 검증
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="이미지 파일만 지원됩니다.")
    
    # 파일 크기 검증 (10MB 제한)
    if file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="파일 크기가 10MB를 초과합니다.")
    
    # 이미지 데이터 읽기
    image_data = await file.read()
    
    if async_processing:
        # 비동기 처리
        job_id = await queue_ocr_job(image_data, webhook_url, api_key)
        return OCRProcessingResponse(
            success=True,
            job_id=job_id,
            status="processing",
            message="비동기 처리가 시작되었습니다."
        )
    else:
        # 동기 처리
        pipeline = ImageProcessingPipeline()
        result = await pipeline.process_receipt(image_data)
        
        return OCRProcessingResponse(
            success=result.success,
            job_id=result.job_id,
            data=result.to_dict(),
            processing_time=result.processing_time
        )

@app.get("/api/v1/ocr/job/{job_id}")
async def get_job_status(
    job_id: str,
    api_key: str = Depends(verify_api_key)
):
    """OCR 작업 상태 조회"""
    job_status = await get_job_from_queue(job_id)
    
    if not job_status:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    
    return {
        "job_id": job_id,
        "status": job_status.status,
        "progress": job_status.progress,
        "result": job_status.result if job_status.status == "completed" else None,
        "error": job_status.error if job_status.status == "failed" else None
    }

@app.get("/api/v1/image/{image_id}")
async def get_processed_image(
    image_id: str,
    image_type: str = "final",  # original, processed, final
    api_key: str = Depends(verify_api_key)
):
    """처리된 이미지 조회"""
    
    if image_type not in ["original", "processed", "final"]:
        raise HTTPException(status_code=400, detail="올바르지 않은 이미지 타입입니다.")
    
    image_path = await get_image_path(image_id, image_type)
    
    if not image_path:
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")
    
    return FileResponse(image_path)

# API 키 검증
async def verify_api_key(api_key: str = Depends(security)):
    # API 키 검증 로직
    if not await is_valid_api_key(api_key.credentials):
        raise HTTPException(status_code=401, detail="유효하지 않은 API 키입니다.")
    return api_key.credentials
```

### 3.6 구매품목 추출 알고리즘

```python
class ReceiptItemExtractor:
    """영수증에서 구매품목 추출"""
    
    def __init__(self):
        self.item_patterns = [
            # 일반적인 품목 패턴들
            r'([가-힣a-zA-Z0-9\s]+)\s+(\d{1,3}(?:,\d{3})*)\s*원?',
            r'([가-힣a-zA-Z0-9\s]+)\s+(\d+)\s*개\s+(\d{1,3}(?:,\d{3})*)\s*원?',
            r'([가-힣a-zA-Z0-9\s]+)\s*×\s*(\d+(?:\.\d+)?)\s+(\d{1,3}(?:,\d{3})*)\s*원?'
        ]
    
    async def extract_items(self, ocr_text: str) -> List[ReceiptItem]:
        """OCR 텍스트에서 품목 정보 추출"""
        
        lines = ocr_text.split('\n')
        items = []
        
        # 테이블 형태 데이터 감지
        table_data = await self.detect_table_structure(lines)
        
        if table_data:
            items.extend(await self.extract_from_table(table_data))
        else:
            # 패턴 매칭으로 품목 추출
            items.extend(await self.extract_with_patterns(lines))
        
        # 품목 정보 후처리 및 검증
        validated_items = await self.validate_and_clean_items(items)
        
        return validated_items
    
    async def detect_table_structure(self, lines: List[str]) -> Optional[TableData]:
        """테이블 구조 감지"""
        
        # 테이블 헤더 패턴 검색
        header_patterns = [
            r'품목.*수량.*금액',
            r'상품.*개수.*가격',
            r'메뉴.*수량.*단가'
        ]
        
        for i, line in enumerate(lines):
            for pattern in header_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    # 테이블 데이터 추출 시작
                    return await self.extract_table_data(lines, i + 1)
        
        return None
    
    async def extract_from_table(self, table_data: TableData) -> List[ReceiptItem]:
        """테이블 형태에서 품목 추출"""
        items = []
        
        for row in table_data.rows:
            try:
                item = ReceiptItem(
                    item_name=row.get('name', '').strip(),
                    quantity=float(row.get('quantity', 1.0)),
                    unit_price=self.parse_amount(row.get('unit_price', '0')),
                    subtotal=self.parse_amount(row.get('subtotal', '0')),
                    ocr_confidence=0.9  # 테이블 구조에서 추출된 경우 높은 신뢰도
                )
                
                # 기본 검증
                if item.item_name and item.subtotal > 0:
                    items.append(item)
                    
            except (ValueError, TypeError) as e:
                # 파싱 오류 시 로깅하고 계속
                logger.warning(f"품목 파싱 오류: {row}, 오류: {e}")
                continue
        
        return items
    
    async def extract_with_patterns(self, lines: List[str]) -> List[ReceiptItem]:
        """패턴 매칭으로 품목 추출"""
        items = []
        
        for line in lines:
            for pattern in self.item_patterns:
                matches = re.findall(pattern, line)
                
                for match in matches:
                    try:
                        if len(match) == 2:
                            # 품목명, 금액
                            name, amount = match
                            item = ReceiptItem(
                                item_name=name.strip(),
                                quantity=1.0,
                                subtotal=self.parse_amount(amount),
                                ocr_confidence=0.8
                            )
                        elif len(match) == 3:
                            # 품목명, 수량, 금액
                            name, quantity, amount = match
                            item = ReceiptItem(
                                item_name=name.strip(),
                                quantity=float(quantity),
                                subtotal=self.parse_amount(amount),
                                ocr_confidence=0.8
                            )
                        
                        # 단가 계산
                        if item.quantity > 0:
                            item.unit_price = item.subtotal / item.quantity
                        
                        if item.item_name and item.subtotal > 0:
                            items.append(item)
                            
                    except (ValueError, TypeError):
                        continue
        
        return items
    
    def parse_amount(self, amount_str: str) -> float:
        """금액 문자열을 float으로 변환"""
        # 숫자와 쉼표만 추출
        cleaned = re.sub(r'[^\d,]', '', amount_str)
        # 쉼표 제거
        cleaned = cleaned.replace(',', '')
        
        return float(cleaned) if cleaned else 0.0
```

## 4. Main Application 서비스 설계

### 4.1 마이크로서비스 구성

Main Application은 다음과 같은 마이크로서비스들로 구성됩니다:

```yaml
services:
  # 사용자 인증 서비스
  auth-service:
    port: 3001
    database: postgresql
    responsibilities:
      - 사용자 등록/로그인
      - JWT 토큰 관리
      - 패스워드 재설정
  
  # 그룹 관리 서비스  
  group-service:
    port: 3002
    database: postgresql
    responsibilities:
      - 그룹 CRUD
      - 멤버십 관리
      - 권한 관리
  
  # 프로젝트 관리 서비스
  project-service:
    port: 3003
    database: postgresql
    responsibilities:
      - 프로젝트 CRUD
      - 프로젝트-그룹 연관 관리
  
  # 영수증 관리 서비스
  receipt-service:
    port: 3004
    database: postgresql
    responsibilities:
      - 영수증 메타데이터 관리
      - OCR Container 연동
      - 하이브리드 데이터 관리
  
  # 대시보드 서비스
  dashboard-service:
    port: 3005
    database: postgresql
    responsibilities:
      - 통계 데이터 생성
      - 사용자 대시보드
      - 리포트 생성
```

### 4.2 API Gateway 설계

```javascript
// Kong 또는 Express Gateway 설정 예시
const gatewayConfig = {
  services: {
    'auth-service': {
      url: 'http://auth-service:3001',
      plugins: ['rate-limiting', 'cors']
    },
    'group-service': {
      url: 'http://group-service:3002',
      plugins: ['jwt-auth', 'rate-limiting']
    },
    'project-service': {
      url: 'http://project-service:3003',
      plugins: ['jwt-auth', 'rate-limiting']
    },
    'receipt-service': {
      url: 'http://receipt-service:3004',
      plugins: ['jwt-auth', 'file-upload', 'rate-limiting']
    },
    'ocr-container': {
      url: 'http://ocr-container:8080',
      plugins: ['api-key-auth', 'rate-limiting', 'request-size-limiting']
    }
  },
  
  routes: [
    {
      paths: ['/api/auth/*'],
      service: 'auth-service',
      strip_path: true
    },
    {
      paths: ['/api/groups/*'],
      service: 'group-service',
      strip_path: true
    },
    {
      paths: ['/api/projects/*'],
      service: 'project-service',
      strip_path: true
    },
    {
      paths: ['/api/receipts/*'],
      service: 'receipt-service',
      strip_path: true
    },
    {
      paths: ['/api/ocr/*'],
      service: 'ocr-container',
      strip_path: false
    }
  ]
};
```

### 4.3 사용자 인증 및 권한 관리

```typescript
// JWT 기반 인증 시스템
interface UserToken {
  sub: string;        // 사용자 ID
  email: string;
  groups: GroupMembership[];
  iat: number;
  exp: number;
}

interface GroupMembership {
  groupId: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: Permission[];
}

// 권한 검증 미들웨어
class AuthorizationMiddleware {
  
  static requireGroupPermission(action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { groupId } = req.params;
      const userToken = req.user as UserToken;
      
      // 사용자가 해당 그룹의 멤버인지 확인
      const membership = userToken.groups.find(g => g.groupId === groupId);
      
      if (!membership) {
        return res.status(403).json({ error: '그룹 접근 권한이 없습니다.' });
      }
      
      // 액션별 권한 확인
      if (!hasPermission(membership, action)) {
        return res.status(403).json({ error: '해당 작업 권한이 없습니다.' });
      }
      
      req.groupMembership = membership;
      next();
    };
  }
  
  static requireProjectAccess() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { projectId } = req.params;
      
      // 프로젝트 정보 조회
      const project = await ProjectService.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
      }
      
      // 사용자가 프로젝트 소속 그룹의 멤버인지 확인
      const userToken = req.user as UserToken;
      const membership = userToken.groups.find(g => g.groupId === project.groupId);
      
      if (!membership) {
        return res.status(403).json({ error: '프로젝트 접근 권한이 없습니다.' });
      }
      
      req.project = project;
      req.groupMembership = membership;
      next();
    };
  }
}
```

## 5. 하이브리드 데이터베이스 아키텍처

### 5.1 데이터베이스 스키마 구현

```sql
-- ================================
-- Main Application Database Schema
-- ================================

-- 사용자 테이블
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    name                VARCHAR(100) NOT NULL,
    profile_image_url   VARCHAR(500),
    email_verified      BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    last_login_at       TIMESTAMP
);

-- 그룹 테이블
CREATE TABLE groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    is_public       BOOLEAN DEFAULT FALSE,
    invite_code     VARCHAR(50) UNIQUE,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- 사용자-그룹 관계 테이블 (다대다)
CREATE TABLE user_groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    joined_at       TIMESTAMP DEFAULT NOW(),
    invited_by      UUID REFERENCES users(id),
    
    UNIQUE(user_id, group_id)
);

-- 프로젝트 테이블 (그룹 종속)
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    start_date      DATE,
    end_date        DATE,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(group_id, name)  -- 그룹 내에서 프로젝트명 고유
);

-- 영수증 테이블 (필수 필드 고정)
CREATE TABLE receipts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ocr_job_id         VARCHAR(100),  -- OCR Container의 Job ID
    
    -- 필수 고정 필드 (3개)
    payment_date        DATE NOT NULL,
    merchant_name       VARCHAR(200) NOT NULL,
    total_amount        DECIMAL(15,2) NOT NULL,
    
    -- 메타데이터
    original_filename   VARCHAR(500),
    file_size          INTEGER,
    created_by         UUID NOT NULL REFERENCES users(id),
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);

-- 영수증 구매품목 테이블 (일대다)
CREATE TABLE receipt_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id      UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    
    -- 품목 정보
    item_name       VARCHAR(200) NOT NULL,
    quantity        DECIMAL(10,3) DEFAULT 1.0,
    unit_price      DECIMAL(15,2),
    subtotal        DECIMAL(15,2),
    
    -- 추가 정보
    item_code       VARCHAR(50),
    category        VARCHAR(100),
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate        DECIMAL(5,2),
    
    -- 메타데이터
    item_order      INTEGER DEFAULT 0,
    ocr_confidence  DECIMAL(3,2),
    is_manual       BOOLEAN DEFAULT FALSE,  -- 수동 입력 여부
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- 선택 필드 정의 테이블
CREATE TABLE field_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_key       VARCHAR(100) UNIQUE NOT NULL,
    field_name      VARCHAR(200) NOT NULL,
    field_type      VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'json', 'array')),
    is_common       BOOLEAN DEFAULT FALSE,
    default_value   TEXT,
    validation_rule JSONB,  -- 유효성 검증 규칙
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 영수증 선택 필드 테이블
CREATE TABLE receipt_fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id      UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    field_def_id    UUID REFERENCES field_definitions(id),
    field_key       VARCHAR(100) NOT NULL,
    field_value     TEXT,
    field_type      VARCHAR(20) NOT NULL,
    field_order     INTEGER DEFAULT 0,
    ocr_confidence  DECIMAL(3,2),
    is_manual       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 사용자 정의 라벨 테이블
CREATE TABLE labels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    color           VARCHAR(7),  -- HEX color
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- 영수증-라벨 관계 테이블
CREATE TABLE receipt_labels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id      UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    label_id        UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    
    UNIQUE(receipt_id, label_id)
);

-- ================================
-- 인덱스 생성
-- ================================

-- 성능 최적화용 인덱스들
CREATE INDEX idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX idx_user_groups_group_id ON user_groups(group_id);
CREATE INDEX idx_projects_group_id ON projects(group_id);
CREATE INDEX idx_receipts_project_id ON receipts(project_id);
CREATE INDEX idx_receipts_payment_date ON receipts(payment_date);
CREATE INDEX idx_receipts_merchant_name ON receipts(merchant_name);
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_order ON receipt_items(receipt_id, item_order);
CREATE INDEX idx_receipt_fields_receipt_id ON receipt_fields(receipt_id);
CREATE INDEX idx_receipt_fields_key ON receipt_fields(field_key);

-- 복합 인덱스
CREATE INDEX idx_receipts_project_date ON receipts(project_id, payment_date DESC);
CREATE INDEX idx_receipt_items_name_category ON receipt_items(item_name, category);

-- ================================
-- 기본 데이터 INSERT
-- ================================

-- 자주 사용되는 필드 정의들
INSERT INTO field_definitions (field_key, field_name, field_type, is_common, validation_rule) VALUES
('business_number', '사업자번호', 'text', TRUE, '{"pattern": "^\\d{3}-\\d{2}-\\d{5}$"}'),
('payment_method', '결제방법', 'text', TRUE, '{"options": ["카드", "현금", "계좌이체", "상품권"]}'),
('card_number', '카드번호(마스킹)', 'text', FALSE, '{"pattern": "^\\*+\\d{4}$"}'),
('tax_amount', '세액', 'number', TRUE, '{"min": 0}'),
('total_discount', '총 할인금액', 'number', FALSE, '{"min": 0}'),
('store_address', '매장주소', 'text', FALSE, NULL),
('store_phone', '매장전화번호', 'text', FALSE, '{"pattern": "^\\d{2,3}-\\d{3,4}-\\d{4}$"}'),
('receipt_number', '영수증번호', 'text', FALSE, NULL),
('pos_terminal', 'POS 단말기', 'text', FALSE, NULL),
('cashier_name', '점원명', 'text', FALSE, NULL);
```

### 5.2 데이터 접근 계층 (Repository Pattern)

```typescript
// 영수증 리포지토리 구현
class ReceiptRepository {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  async createReceipt(data: CreateReceiptData): Promise<Receipt> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // 1. 기본 영수증 데이터 삽입
      const receiptResult = await client.query(`
        INSERT INTO receipts (project_id, payment_date, merchant_name, total_amount, created_by, ocr_job_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [data.projectId, data.paymentDate, data.merchantName, data.totalAmount, data.createdBy, data.ocrJobId]);
      
      const receipt = receiptResult.rows[0];
      
      // 2. 구매품목 데이터 삽입
      if (data.items && data.items.length > 0) {
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          await client.query(`
            INSERT INTO receipt_items (receipt_id, item_name, quantity, unit_price, subtotal, item_order, ocr_confidence)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [receipt.id, item.itemName, item.quantity, item.unitPrice, item.subtotal, i + 1, item.ocrConfidence]);
        }
      }
      
      // 3. 선택 필드 데이터 삽입
      if (data.optionalFields) {
        for (const [fieldKey, fieldValue] of Object.entries(data.optionalFields)) {
          // 필드 정의 조회
          const fieldDefResult = await client.query(
            'SELECT * FROM field_definitions WHERE field_key = $1', [fieldKey]
          );
          
          let fieldDefId = null;
          let fieldType = 'text';
          
          if (fieldDefResult.rows.length > 0) {
            fieldDefId = fieldDefResult.rows[0].id;
            fieldType = fieldDefResult.rows[0].field_type;
          }
          
          await client.query(`
            INSERT INTO receipt_fields (receipt_id, field_def_id, field_key, field_value, field_type)
            VALUES ($1, $2, $3, $4, $5)
          `, [receipt.id, fieldDefId, fieldKey, fieldValue, fieldType]);
        }
      }
      
      await client.query('COMMIT');
      return receipt;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getReceiptWithDetails(receiptId: string): Promise<ReceiptWithDetails | null> {
    const client = await this.db.getClient();
    
    try {
      // 기본 영수증 정보 조회
      const receiptResult = await client.query(`
        SELECT r.*, p.name as project_name, g.name as group_name
        FROM receipts r
        JOIN projects p ON r.project_id = p.id
        JOIN groups g ON p.group_id = g.id
        WHERE r.id = $1
      `, [receiptId]);
      
      if (receiptResult.rows.length === 0) {
        return null;
      }
      
      const receipt = receiptResult.rows[0];
      
      // 구매품목 조회
      const itemsResult = await client.query(`
        SELECT * FROM receipt_items
        WHERE receipt_id = $1
        ORDER BY item_order ASC
      `, [receiptId]);
      
      // 선택 필드 조회
      const fieldsResult = await client.query(`
        SELECT rf.*, fd.field_name, fd.field_type, fd.validation_rule
        FROM receipt_fields rf
        LEFT JOIN field_definitions fd ON rf.field_def_id = fd.id
        WHERE rf.receipt_id = $1
        ORDER BY rf.field_order ASC
      `, [receiptId]);
      
      return {
        ...receipt,
        items: itemsResult.rows,
        optionalFields: fieldsResult.rows.reduce((acc, field) => {
          acc[field.field_key] = {
            value: field.field_value,
            type: field.field_type,
            name: field.field_name,
            confidence: field.ocr_confidence,
            isManual: field.is_manual
          };
          return acc;
        }, {} as Record<string, any>)
      };
      
    } finally {
      client.release();
    }
  }
  
  async searchReceipts(criteria: SearchCriteria): Promise<SearchResult<Receipt>> {
    const client = await this.db.getClient();
    
    // 동적 쿼리 빌딩
    const queryBuilder = new QueryBuilder();
    queryBuilder.select([
      'r.*',
      'p.name as project_name', 
      'g.name as group_name',
      'COUNT(ri.id) as item_count',
      'SUM(ri.subtotal) as items_total'
    ]);
    queryBuilder.from('receipts r');
    queryBuilder.join('projects p ON r.project_id = p.id');
    queryBuilder.join('groups g ON p.group_id = g.id');
    queryBuilder.leftJoin('receipt_items ri ON r.id = ri.receipt_id');
    
    // 검색 조건 추가
    if (criteria.projectIds) {
      queryBuilder.whereIn('r.project_id', criteria.projectIds);
    }
    
    if (criteria.dateFrom) {
      queryBuilder.where('r.payment_date >= ?', criteria.dateFrom);
    }
    
    if (criteria.dateTo) {
      queryBuilder.where('r.payment_date <= ?', criteria.dateTo);
    }
    
    if (criteria.merchantName) {
      queryBuilder.where('r.merchant_name ILIKE ?', `%${criteria.merchantName}%`);
    }
    
    if (criteria.minAmount) {
      queryBuilder.where('r.total_amount >= ?', criteria.minAmount);
    }
    
    if (criteria.maxAmount) {
      queryBuilder.where('r.total_amount <= ?', criteria.maxAmount);
    }
    
    // 선택 필드 검색
    if (criteria.optionalFields) {
      for (const [fieldKey, fieldValue] of Object.entries(criteria.optionalFields)) {
        queryBuilder.join(`receipt_fields rf_${fieldKey} ON r.id = rf_${fieldKey}.receipt_id`);
        queryBuilder.where(`rf_${fieldKey}.field_key = ?`, fieldKey);
        queryBuilder.where(`rf_${fieldKey}.field_value ILIKE ?`, `%${fieldValue}%`);
      }
    }
    
    // 품목 검색
    if (criteria.itemName) {
      queryBuilder.join('receipt_items ri_search ON r.id = ri_search.receipt_id');
      queryBuilder.where('ri_search.item_name ILIKE ?', `%${criteria.itemName}%`);
    }
    
    queryBuilder.groupBy(['r.id', 'p.name', 'g.name']);
    queryBuilder.orderBy('r.payment_date DESC, r.created_at DESC');
    
    // 페이지네이션
    const offset = (criteria.page - 1) * criteria.limit;
    queryBuilder.limit(criteria.limit);
    queryBuilder.offset(offset);
    
    const query = queryBuilder.build();
    const result = await client.query(query.sql, query.params);
    
    // 총 개수 조회
    const countQuery = queryBuilder.clone().select('COUNT(DISTINCT r.id)').build();
    const countResult = await client.query(countQuery.sql, countQuery.params);
    
    return {
      items: result.rows,
      totalCount: parseInt(countResult.rows[0].count),
      page: criteria.page,
      limit: criteria.limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / criteria.limit)
    };
  }
}
```

### 5.3 서비스 간 데이터 동기화

```typescript
// OCR Container와의 데이터 연동 서비스
class OCRIntegrationService {
  private ocrApiClient: OCRApiClient;
  private receiptRepository: ReceiptRepository;
  private eventEmitter: EventEmitter;
  
  constructor(
    ocrApiClient: OCRApiClient,
    receiptRepository: ReceiptRepository,
    eventEmitter: EventEmitter
  ) {
    this.ocrApiClient = ocrApiClient;
    this.receiptRepository = receiptRepository;
    this.eventEmitter = eventEmitter;
  }
  
  async processReceiptUpload(
    file: Express.Multer.File,
    projectId: string,
    userId: string
  ): Promise<ReceiptProcessingResult> {
    
    try {
      // 1. OCR Container에 이미지 전송
      const ocrResult = await this.ocrApiClient.processImage(file, {
        asyncProcessing: false,
        includeStructuredData: true,
        includImages: true
      });
      
      if (!ocrResult.success) {
        throw new Error(`OCR 처리 실패: ${ocrResult.message}`);
      }
      
      // 2. OCR 결과를 Main DB 스키마에 맞게 변환
      const receiptData = await this.transformOCRResult(ocrResult.data, projectId, userId);
      
      // 3. 영수증 데이터 저장
      const savedReceipt = await this.receiptRepository.createReceipt(receiptData);
      
      // 4. 이벤트 발생
      this.eventEmitter.emit('receipt.created', {
        receiptId: savedReceipt.id,
        projectId: projectId,
        userId: userId,
        ocrJobId: ocrResult.jobId
      });
      
      return {
        success: true,
        receiptId: savedReceipt.id,
        ocrJobId: ocrResult.jobId,
        processingTime: ocrResult.processingTime,
        extractedData: receiptData
      };
      
    } catch (error) {
      logger.error('영수증 처리 중 오류 발생:', error);
      
      // 실패 이벤트 발생
      this.eventEmitter.emit('receipt.processing.failed', {
        projectId: projectId,
        userId: userId,
        error: error.message
      });
      
      throw error;
    }
  }
  
  private async transformOCRResult(
    ocrData: OCRProcessingData, 
    projectId: string, 
    userId: string
  ): Promise<CreateReceiptData> {
    
    const { extractedFields, images } = ocrData;
    
    // 필수 필드 추출
    const requiredFields = extractedFields.required;
    
    // 구매품목 변환
    const items = extractedFields.items?.map((item, index) => ({
      itemName: item.item_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.subtotal,
      itemOrder: item.item_order || index + 1,
      ocrConfidence: item.ocr_confidence
    })) || [];
    
    // 선택 필드 변환
    const optionalFields = extractedFields.optional || {};
    
    return {
      projectId,
      createdBy: userId,
      ocrJobId: ocrData.jobId,
      
      // 필수 필드
      paymentDate: new Date(requiredFields.payment_date),
      merchantName: requiredFields.merchant_name,
      totalAmount: requiredFields.total_amount,
      
      // 구매품목
      items: items,
      
      // 선택 필드
      optionalFields: optionalFields,
      
      // 이미지 메타데이터
      imageUrls: images
    };
  }
  
  async syncWithOCRContainer(): Promise<void> {
    /**
     * 정기적으로 OCR Container의 데이터와 동기화
     * - 완료되지 않은 OCR 작업 상태 확인
     * - 누락된 데이터 복구
     * - 이미지 파일 정합성 검증
     */
    
    const pendingJobs = await this.receiptRepository.getPendingOCRJobs();
    
    for (const job of pendingJobs) {
      try {
        const jobStatus = await this.ocrApiClient.getJobStatus(job.ocrJobId);
        
        if (jobStatus.status === 'completed' && jobStatus.result) {
          // 완료된 작업 데이터 업데이트
          const receiptData = await this.transformOCRResult(
            jobStatus.result, 
            job.projectId, 
            job.createdBy
          );
          
          await this.receiptRepository.updateReceiptFromOCR(job.id, receiptData);
          
          this.eventEmitter.emit('receipt.sync.completed', {
            receiptId: job.id,
            ocrJobId: job.ocrJobId
          });
        } else if (jobStatus.status === 'failed') {
          // 실패한 작업 처리
          await this.receiptRepository.markReceiptAsFailed(job.id, jobStatus.error);
          
          this.eventEmitter.emit('receipt.sync.failed', {
            receiptId: job.id,
            ocrJobId: job.ocrJobId,
            error: jobStatus.error
          });
        }
        
      } catch (error) {
        logger.error(`OCR 작업 동기화 실패 (Job ID: ${job.ocrJobId}):`, error);
      }
    }
  }
}
```

## 6. 배포 및 운영 아키텍처

### 6.1 Container 배포 전략

```yaml
# docker-compose.yml - 개발 환경
version: '3.8'

services:
  # API Gateway
  api-gateway:
    image: kong:3.0-alpine
    ports:
      - "8000:8000"
      - "8001:8001"
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: postgres
      KONG_PG_DATABASE: kong
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
    depends_on:
      - postgres
    volumes:
      - ./kong/kong.conf:/etc/kong/kong.conf

  # OCR Container Service
  ocr-container:
    build: 
      context: ./ocr-container
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=sqlite:///data/ocr.db
      - REDIS_URL=redis://redis:6379
      - STORAGE_PATH=/data/images
      - API_KEY_REQUIRED=true
    volumes:
      - ocr_data:/data
    depends_on:
      - redis
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Main Application Services
  auth-service:
    build:
      context: ./services/auth-service
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/main_db
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  group-service:
    build:
      context: ./services/group-service
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/main_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  project-service:
    build:
      context: ./services/project-service
    ports:
      - "3003:3003"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/main_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  receipt-service:
    build:
      context: ./services/receipt-service
    ports:
      - "3004:3004"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/main_db
      - OCR_CONTAINER_URL=http://ocr-container:8080
      - OCR_API_KEY=${OCR_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
      - ocr-container

  # Frontend Application
  web-app:
    build:
      context: ./web-app
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_OCR_CONTAINER_URL=http://localhost:8080
    depends_on:
      - api-gateway

  # Database
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: main_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d

  # Cache & Queue
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # File Storage
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: password
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  redis_data:
  minio_data:
  ocr_data:
  prometheus_data:
  grafana_data:
```

### 6.2 Kubernetes 배포 (프로덕션)

```yaml
# ocr-container-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ocr-container
  labels:
    app: ocr-container
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ocr-container
  template:
    metadata:
      labels:
        app: ocr-container
    spec:
      containers:
      - name: ocr-container
        image: receipt-ocr/ocr-container:v1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ocr-secrets
              key: database-url
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: API_KEY_REQUIRED
          value: "true"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: ocr-storage
          mountPath: /data
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: ocr-storage
        persistentVolumeClaim:
          claimName: ocr-storage-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: ocr-container-service
spec:
  selector:
    app: ocr-container
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ocr-container-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ocr-container
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 6.3 CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install Node.js dependencies
      run: npm ci

    - name: Install Python dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r ocr-container/requirements.txt

    - name: Run TypeScript tests
      run: npm run test
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379

    - name: Run Python tests
      run: |
        cd ocr-container
        python -m pytest tests/ -v
      env:
        DATABASE_URL: sqlite:///test.db
        REDIS_URL: redis://localhost:6379

    - name: Run Integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
        OCR_CONTAINER_URL: http://localhost:8080

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

    strategy:
      matrix:
        service: 
          - ocr-container
          - auth-service
          - group-service
          - project-service
          - receipt-service
          - web-app

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ghcr.io/${{ github.repository }}/${{ matrix.service }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./${{ matrix.service }}
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
    - name: Deploy to Staging
      run: |
        echo "Deploying to staging environment..."
        # Helm 또는 kubectl 명령어로 배포

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Deploy to Production
      run: |
        echo "Deploying to production environment..."
        # 프로덕션 배포 로직
```

### 6.4 모니터링 및 로깅

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ocr-container'
    static_configs:
      - targets: ['ocr-container:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'main-services'
    static_configs:
      - targets: 
        - 'auth-service:3001'
        - 'group-service:3002'
        - 'project-service:3003'
        - 'receipt-service:3004'
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

rule_files:
  - "/etc/prometheus/alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

```typescript
// 로깅 설정 (Winston + ELK Stack)
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'unknown',
    version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // 프로덕션 환경에서는 Elasticsearch로 전송
    ...(process.env.NODE_ENV === 'production' ? [
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
        },
        index: `logs-${process.env.SERVICE_NAME}-${new Date().toISOString().slice(0, 7)}`
      })
    ] : [])
  ]
});

// 구조화된 로깅 헬퍼
export const createServiceLogger = (serviceName: string) => ({
  info: (message: string, meta?: any) => 
    logger.info(message, { service: serviceName, ...meta }),
  
  error: (message: string, error?: Error, meta?: any) =>
    logger.error(message, { service: serviceName, error, ...meta }),
    
  warn: (message: string, meta?: any) =>
    logger.warn(message, { service: serviceName, ...meta }),
    
  debug: (message: string, meta?: any) =>
    logger.debug(message, { service: serviceName, ...meta })
});
```

## 7. 보안 및 성능 고려사항

### 7.1 보안 아키텍처

```typescript
// JWT 보안 설정
class SecurityConfig {
  static readonly JWT_CONFIG = {
    algorithm: 'RS256',
    expiresIn: '1h',
    refreshTokenExpiresIn: '7d',
    issuer: 'receipt-ocr-system',
    audience: 'receipt-ocr-users'
  };

  static readonly RATE_LIMITING = {
    // API별 Rate Limiting 설정
    authentication: {
      windowMs: 15 * 60 * 1000, // 15분
      max: 5 // 로그인 시도 5회 제한
    },
    ocrProcessing: {
      windowMs: 60 * 1000, // 1분
      max: 10 // OCR 요청 10회 제한
    },
    generalApi: {
      windowMs: 15 * 60 * 1000,
      max: 100
    }
  };

  static readonly FILE_UPLOAD = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ],
    virusScanning: true
  };
}

// API 보안 미들웨어
class SecurityMiddleware {
  
  static async validateFileUpload(req: Request, res: Response, next: NextFunction) {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    // 파일 크기 검증
    if (req.file.size > SecurityConfig.FILE_UPLOAD.maxFileSize) {
      return res.status(413).json({ error: '파일 크기가 제한을 초과했습니다.' });
    }

    // MIME 타입 검증
    if (!SecurityConfig.FILE_UPLOAD.allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(415).json({ error: '지원하지 않는 파일 형식입니다.' });
    }

    // 파일 헤더 검증 (MIME 타입 스푸핑 방지)
    const actualMimeType = await this.detectActualMimeType(req.file.buffer);
    if (actualMimeType !== req.file.mimetype) {
      return res.status(415).json({ error: '파일 형식이 일치하지 않습니다.' });
    }

    // 바이러스 검사 (옵션)
    if (SecurityConfig.FILE_UPLOAD.virusScanning) {
      const isSafe = await this.scanForVirus(req.file.buffer);
      if (!isSafe) {
        return res.status(400).json({ error: '안전하지 않은 파일입니다.' });
      }
    }

    next();
  }

  static async detectActualMimeType(buffer: Buffer): Promise<string> {
    // 파일 시그니처를 통한 실제 MIME 타입 검출
    const fileType = await import('file-type');
    const type = await fileType.fileTypeFromBuffer(buffer);
    return type?.mime || 'application/octet-stream';
  }

  static async scanForVirus(buffer: Buffer): Promise<boolean> {
    // ClamAV 등을 이용한 바이러스 검사 구현
    // 실제 구현에서는 외부 바이러스 검사 서비스 연동
    return true; // 임시 구현
  }

  static inputSanitization(req: Request, res: Response, next: NextFunction) {
    // XSS 방지를 위한 입력값 sanitization
    const sanitizeHtml = require('sanitize-html');
    
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeHtml(obj, {
          allowedTags: [],
          allowedAttributes: {}
        });
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  }
}
```

### 7.2 성능 최적화

```typescript
// 캐싱 전략
class CacheManager {
  private redis: Redis;
  
  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 사용자 그룹 정보 캐싱
  async getUserGroups(userId: string): Promise<GroupMembership[]> {
    const cacheKey = `user:${userId}:groups`;
    
    // 캐시에서 조회
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // DB에서 조회
    const groups = await GroupService.getUserGroups(userId);
    
    // 캐시에 저장 (5분 TTL)
    await this.redis.setex(cacheKey, 300, JSON.stringify(groups));
    
    return groups;
  }

  // OCR 결과 임시 캐싱
  async cacheOCRResult(jobId: string, result: any, ttlSeconds: number = 3600) {
    const cacheKey = `ocr:result:${jobId}`;
    await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(result));
  }

  async getOCRResult(jobId: string): Promise<any | null> {
    const cacheKey = `ocr:result:${jobId}`;
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  // 영수증 검색 결과 캐싱
  async cacheSearchResults(
    searchHash: string, 
    results: any, 
    ttlSeconds: number = 300
  ) {
    const cacheKey = `search:${searchHash}`;
    await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(results));
  }

  // 캐시 무효화
  async invalidateUserCache(userId: string) {
    const pattern = `user:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// 데이터베이스 최적화
class DatabaseOptimizer {
  
  // 배치 처리를 위한 bulk 연산
  static async bulkCreateReceiptItems(
    receiptId: string, 
    items: CreateReceiptItemData[]
  ): Promise<void> {
    const db = await Database.getInstance();
    
    // 단일 쿼리로 여러 행 삽입
    const values = items.map((item, index) => 
      `('${receiptId}', '${item.itemName}', ${item.quantity}, ${item.unitPrice}, ${item.subtotal}, ${index + 1})`
    ).join(', ');

    const query = `
      INSERT INTO receipt_items (receipt_id, item_name, quantity, unit_price, subtotal, item_order)
      VALUES ${values}
    `;

    await db.query(query);
  }

  // 읽기 전용 복제본 사용
  static getReadOnlyConnection(): Database {
    return Database.getReadReplica();
  }

  // 인덱스 최적화 쿼리
  static async optimizeSearchQueries() {
    const db = await Database.getInstance();
    
    // 복합 인덱스 생성
    await db.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_project_date_amount 
      ON receipts(project_id, payment_date DESC, total_amount DESC)
    `);

    // 부분 인덱스 생성 (최근 데이터만)
    await db.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_recent 
      ON receipts(payment_date DESC) 
      WHERE payment_date >= NOW() - INTERVAL '1 year'
    `);
  }
}

// 이미지 최적화
class ImageOptimizer {
  
  static async optimizeImage(imageBuffer: Buffer, options?: OptimizeOptions): Promise<Buffer> {
    const sharp = require('sharp');
    
    const defaultOptions = {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 85,
      format: 'jpeg'
    };

    const config = { ...defaultOptions, ...options };

    return await sharp(imageBuffer)
      .resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: config.quality })
      .toBuffer();
  }

  // 썸네일 생성
  static async generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    const sharp = require('sharp');
    
    return await sharp(imageBuffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  }
}
```

## 8. 개발 가이드라인

### 8.1 코딩 표준

```typescript
// TypeScript/Node.js 코딩 표준
export interface CodingStandards {
  
  // 1. 네이밍 규칙
  naming: {
    variables: 'camelCase';           // userId, receiptData
    functions: 'camelCase';           // processReceipt(), getUserGroups()
    classes: 'PascalCase';            // ReceiptService, OCRProcessor
    interfaces: 'PascalCase';         // UserData, APIResponse
    enums: 'PascalCase';              // UserRole, ProcessingStatus
    constants: 'SCREAMING_SNAKE_CASE'; // MAX_FILE_SIZE, DEFAULT_CONFIG
    files: 'kebab-case';              // receipt-service.ts, ocr-processor.ts
    databases: 'snake_case';          // user_groups, receipt_items
  };

  // 2. 파일 구조
  fileStructure: {
    services: 'Business logic and external integrations';
    repositories: 'Data access layer';
    controllers: 'HTTP request handling';
    middlewares: 'Cross-cutting concerns';
    models: 'Data models and types';
    utils: 'Utility functions';
    config: 'Configuration files';
  };

  // 3. 오류 처리
  errorHandling: {
    useCustomErrors: true;
    logAllErrors: true;
    returnStructuredResponses: true;
  };
}

// 예시: 서비스 클래스 구조
class ReceiptService {
  private receiptRepository: ReceiptRepository;
  private ocrClient: OCRClient;
  private logger: Logger;

  constructor(
    receiptRepository: ReceiptRepository,
    ocrClient: OCRClient,
    logger: Logger
  ) {
    this.receiptRepository = receiptRepository;
    this.ocrClient = ocrClient;
    this.logger = logger;
  }

  /**
   * 영수증 생성
   * @param data 영수증 생성 데이터
   * @param userId 생성자 ID
   * @returns 생성된 영수증 정보
   * @throws ReceiptCreationError 영수증 생성 실패 시
   */
  async createReceipt(data: CreateReceiptData, userId: string): Promise<Receipt> {
    try {
      this.logger.info('영수증 생성 시작', { userId, projectId: data.projectId });

      // 입력 검증
      await this.validateReceiptData(data);

      // 권한 확인
      await this.checkProjectPermission(data.projectId, userId);

      // 영수증 생성
      const receipt = await this.receiptRepository.create({
        ...data,
        createdBy: userId
      });

      this.logger.info('영수증 생성 완료', { 
        receiptId: receipt.id, 
        userId 
      });

      return receipt;

    } catch (error) {
      this.logger.error('영수증 생성 실패', error, { userId, data });
      
      if (error instanceof ValidationError) {
        throw new ReceiptCreationError('입력 데이터가 올바르지 않습니다.', error);
      } else if (error instanceof PermissionError) {
        throw new ReceiptCreationError('프로젝트 접근 권한이 없습니다.', error);
      }
      
      throw new ReceiptCreationError('영수증 생성 중 오류가 발생했습니다.', error);
    }
  }

  private async validateReceiptData(data: CreateReceiptData): Promise<void> {
    const schema = Joi.object({
      projectId: Joi.string().uuid().required(),
      paymentDate: Joi.date().max('now').required(),
      merchantName: Joi.string().max(200).required(),
      totalAmount: Joi.number().positive().precision(2).required(),
      items: Joi.array().items(Joi.object({
        itemName: Joi.string().max(200).required(),
        quantity: Joi.number().positive().precision(3).default(1),
        unitPrice: Joi.number().positive().precision(2),
        subtotal: Joi.number().positive().precision(2).required()
      })).min(1)
    });

    const { error } = schema.validate(data);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
  }
}
```

### 8.2 테스트 전략

```typescript
// 테스트 구조 예시
describe('ReceiptService', () => {
  let receiptService: ReceiptService;
  let mockReceiptRepository: jest.Mocked<ReceiptRepository>;
  let mockOCRClient: jest.Mocked<OCRClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockReceiptRepository = createMockReceiptRepository();
    mockOCRClient = createMockOCRClient();
    mockLogger = createMockLogger();
    
    receiptService = new ReceiptService(
      mockReceiptRepository,
      mockOCRClient,
      mockLogger
    );
  });

  describe('createReceipt', () => {
    const validReceiptData: CreateReceiptData = {
      projectId: 'project-uuid',
      paymentDate: new Date('2024-01-01'),
      merchantName: '테스트 상점',
      totalAmount: 15000,
      items: [
        {
          itemName: '아메리카노',
          quantity: 2,
          unitPrice: 4500,
          subtotal: 9000
        },
        {
          itemName: '카페라떼',
          quantity: 1,
          unitPrice: 6000,
          subtotal: 6000
        }
      ]
    };

    it('유효한 데이터로 영수증을 생성할 수 있다', async () => {
      // Arrange
      const userId = 'user-uuid';
      const expectedReceipt = { id: 'receipt-uuid', ...validReceiptData };
      
      mockReceiptRepository.create.mockResolvedValue(expectedReceipt as Receipt);

      // Act
      const result = await receiptService.createReceipt(validReceiptData, userId);

      // Assert
      expect(result).toEqual(expectedReceipt);
      expect(mockReceiptRepository.create).toHaveBeenCalledWith({
        ...validReceiptData,
        createdBy: userId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        '영수증 생성 완료',
        { receiptId: 'receipt-uuid', userId }
      );
    });

    it('잘못된 데이터로 영수증 생성 시 ValidationError가 발생한다', async () => {
      // Arrange
      const invalidData = {
        ...validReceiptData,
        totalAmount: -1000 // 음수 금액
      };

      // Act & Assert
      await expect(
        receiptService.createReceipt(invalidData, 'user-uuid')
      ).rejects.toThrow(ReceiptCreationError);
      
      expect(mockReceiptRepository.create).not.toHaveBeenCalled();
    });

    it('권한이 없는 사용자는 영수증을 생성할 수 없다', async () => {
      // Arrange
      const unauthorizedUserId = 'unauthorized-user';
      mockReceiptRepository.checkProjectPermission = jest.fn()
        .mockRejectedValue(new PermissionError('권한 없음'));

      // Act & Assert
      await expect(
        receiptService.createReceipt(validReceiptData, unauthorizedUserId)
      ).rejects.toThrow(ReceiptCreationError);
    });
  });

  describe('searchReceipts', () => {
    it('검색 조건에 맞는 영수증들을 반환한다', async () => {
      // 통합 테스트 구현
    });
  });
});

// E2E 테스트 예시
describe('영수증 관리 E2E', () => {
  let app: Application;
  let testDb: TestDatabase;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    testDb = await setupTestDatabase();
    authToken = await getTestAuthToken();
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
    await app.close();
  });

  it('사용자가 영수증을 업로드하고 OCR 처리 후 데이터를 확인할 수 있다', async () => {
    // 1. 테스트 이미지 업로드
    const response = await request(app)
      .post('/api/receipts/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', path.join(__dirname, 'fixtures/sample-receipt.jpg'))
      .field('projectId', 'test-project-id')
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.receiptId).toBeDefined();

    // 2. OCR 처리 완료까지 대기
    const receiptId = response.body.receiptId;
    await waitForOCRProcessing(receiptId, 10000);

    // 3. 영수증 데이터 조회
    const receiptResponse = await request(app)
      .get(`/api/receipts/${receiptId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const receipt = receiptResponse.body;
    expect(receipt.paymentDate).toBeDefined();
    expect(receipt.merchantName).toBeDefined();
    expect(receipt.totalAmount).toBeGreaterThan(0);
    expect(receipt.items).toBeInstanceOf(Array);
    expect(receipt.items.length).toBeGreaterThan(0);
  });
});
```

### 8.3 문서화 표준

```typescript
/**
 * Receipt OCR Management System
 * 영수증 OCR 관리 시스템 서비스 API 문서
 * 
 * @version 1.0.0
 * @author Development Team
 * @since 2024-01-01
 */

/**
 * 영수증 데이터 생성 인터페이스
 * 
 * @interface CreateReceiptData
 * @description OCR 처리 결과나 수동 입력을 통해 영수증을 생성할 때 사용되는 데이터 구조
 */
interface CreateReceiptData {
  /** 프로젝트 ID (UUID) - 영수증이 속할 프로젝트 */
  projectId: string;
  
  /** OCR 작업 ID - OCR Container에서 처리된 작업의 고유 식별자 */
  ocrJobId?: string;
  
  /** 결제일 - YYYY-MM-DD 형식 */
  paymentDate: Date;
  
  /** 상호명 - 영수증을 발행한 업체명 (최대 200자) */
  merchantName: string;
  
  /** 총 결제금액 - 소수점 둘째 자리까지 지원 */
  totalAmount: number;
  
  /** 
   * 구매품목 목록
   * @description 영수증에 포함된 개별 구매 품목들의 상세 정보
   */
  items?: Array<{
    /** 품목명 (최대 200자) */
    itemName: string;
    /** 수량 (소수점 셋째 자리까지 지원) */
    quantity: number;
    /** 단가 (소수점 둘째 자리까지 지원) */
    unitPrice?: number;
    /** 소계 (소수점 둘째 자리까지 지원) */
    subtotal: number;
    /** OCR 신뢰도 (0.0 ~ 1.0) */
    ocrConfidence?: number;
  }>;
  
  /** 
   * 선택 필드 데이터
   * @description 사업자번호, 결제방법 등 선택적으로 저장되는 필드들
   */
  optionalFields?: Record<string, any>;
  
  /** 원본 파일명 */
  originalFilename?: string;
  
  /** 파일 크기 (bytes) */
  fileSize?: number;
}

/**
 * 영수증 서비스 클래스
 * 
 * @class ReceiptService
 * @description 영수증 생성, 조회, 수정, 삭제 등의 비즈니스 로직을 처리
 * 
 * @example
 * ```typescript
 * const receiptService = new ReceiptService(
 *   receiptRepository,
 *   ocrClient,
 *   logger
 * );
 * 
 * const receipt = await receiptService.createReceipt(data, userId);
 * ```
 */
class ReceiptService {
  /**
   * 새로운 영수증을 생성합니다.
   * 
   * @method createReceipt
   * @param {CreateReceiptData} data - 영수증 생성 데이터
   * @param {string} userId - 생성자 사용자 ID
   * @returns {Promise<Receipt>} 생성된 영수증 정보
   * 
   * @throws {ValidationError} 입력 데이터 검증 실패
   * @throws {PermissionError} 프로젝트 접근 권한 없음
   * @throws {ReceiptCreationError} 영수증 생성 실패
   * 
   * @example
   * ```typescript
   * const data = {
   *   projectId: 'proj-123',
   *   paymentDate: new Date('2024-01-01'),
   *   merchantName: '스타벅스',
   *   totalAmount: 15000,
   *   items: [
   *     {
   *       itemName: '아메리카노',
   *       quantity: 2,
   *       unitPrice: 4500,
   *       subtotal: 9000
   *     }
   *   ]
   * };
   * 
   * const receipt = await receiptService.createReceipt(data, 'user-123');
   * ```
   */
  async createReceipt(data: CreateReceiptData, userId: string): Promise<Receipt> {
    // 구현 내용...
  }
}
```

## 9. 결론

본 서비스 설계 문서는 Receipt OCR Management System의 구체적인 구현 방안을 제시합니다. 핵심은 **재사용 가능한 OCR Container**와 **Main Application**의 명확한 분리를 통해 확장성과 포터빌리티를 달성하는 것입니다.

### 9.1 핵심 아키텍처 결정사항

1. **마이크로서비스 아키텍처**: 서비스별 독립적인 개발, 배포, 확장 가능
2. **하이브리드 데이터베이스 스키마**: 구조화된 필수 필드와 유연한 선택 필드의 균형
3. **컨테이너 기반 OCR 서비스**: 완전히 독립적이고 이식 가능한 OCR 솔루션
4. **컴퓨터 비전 통합**: 지능형 이미지 전처리로 OCR 정확도 향상
5. **API-First 설계**: 외부 시스템 통합을 고려한 API 중심 아키텍처

### 9.2 예상 성과

- **개발 효율성**: 서비스별 독립 개발로 개발 속도 향상
- **운영 안정성**: 마이크로서비스와 컨테이너를 통한 장애 격리
- **비즈니스 확장성**: OCR Container의 B2B 시장 진출 가능
- **기술적 유연성**: 각 서비스별 기술 스택 선택의 자유도
- **사용자 경험**: 높은 OCR 정확도와 직관적인 UI

### 9.3 다음 단계

1. **Phase 1**: OCR Container 개발 및 Main Application 기본 기능 구현
2. **Phase 2**: 고도화 및 외부 통합 기능 개발
3. **Phase 3**: 상용화 및 생태계 구축
4. **Phase 4**: 운영 최적화 및 확장

이 설계를 바탕으로 개발팀은 구체적인 구현에 착수할 수 있으며, 각 단계별로 점진적인 개선과 확장이 가능한 견고한 아키텍처를 구축할 수 있습니다.