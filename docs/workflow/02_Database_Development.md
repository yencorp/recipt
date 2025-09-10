# 02. 데이터베이스 설계 및 구축 워크플로우

## 목표 및 범위

**목표**: PostgreSQL 데이터베이스 스키마 설계 및 구축, 마이그레이션 시스템 구축  
**소요 기간**: 1주 (5일)  
**담당자**: 백엔드 개발자 2명 (리드: 시니어), DevOps 엔지니어 (지원)  
**선행 작업**: [01_Infrastructure_Setup](./01_Infrastructure_Setup.md) 완료

## 세부 작업 목록

### Day 1: 데이터 모델링 및 ERD 설계 (8시간)

#### Task 2.1: 요구사항 분석 및 엔티티 추출 (2시간)
**담당자**: 백엔드 개발자 (시니어)  
**설명**: PRD와 TSD를 기반으로 필요한 데이터 엔티티 추출  

**세부 작업**:
- [x] PRD 기능 요구사항 분석
- [x] 핵심 엔티티 식별 (User, Organization, Event, Budget, Settlement 등)
- [x] 엔티티별 속성 정의
- [x] 비즈니스 규칙 정리

**완료 기준**:
- 모든 필요 엔티티 식별 완료
- 엔티티별 속성 목록 작성
- 비즈니스 규칙 문서화

**산출물**:
- `docs/database/entities.md`
- `docs/database/business-rules.md`

#### Task 2.2: ERD (Entity Relationship Diagram) 설계 (3시간)
**담당자**: 백엔드 개발자 2명  

**세부 작업**:
- [x] 엔티티 간 관계 정의
- [x] 1:1, 1:N, N:N 관계 식별
- [x] 참조 무결성 제약 조건 정의
- [x] ERD 다이어그램 작성

**완료 기준**:
- 완전한 ERD 다이어그램 완성
- 모든 관계에 대한 설명 포함
- 제약 조건 명시

**산출물**:
- `docs/database/erd.png`
- `docs/database/relationships.md`

#### Task 2.3: 테이블 스키마 상세 설계 (3시간)
**담당자**: 백엔드 개발자 (시니어)  

**세부 작업**:
- [x] 각 테이블별 컬럼 정의 (이름, 타입, 제약조건)
- [x] 기본키 및 외래키 설계
- [x] 인덱스 전략 수립
- [x] 데이터 타입 최적화

**완료 기준**:
- 모든 테이블의 상세 스키마 완성 ✅
- 인덱스 계획 수립 ✅
- 성능 고려사항 문서화 ✅

**산출물**:
- `docs/database/table-schemas.md` ✅
- 인덱스 전략이 table-schemas.md에 통합 포함됨

---

### Day 2: 마이그레이션 스크립트 작성 (8시간)

#### Task 2.4: TypeORM 설정 및 환경 구성 (2시간)
**담당자**: 백엔드 개발자 (주니어) + DevOps 지원  

**세부 작업**:
- [x] TypeORM 설정 파일 작성
- [x] 데이터베이스 연결 설정
- [x] 환경별 설정 분리 (dev, test, prod)
- [x] 마이그레이션 디렉터리 구조 설정

**완료 기준**:
- TypeORM 정상 연결 확인 ✅
- 마이그레이션 명령어 실행 가능 ✅
- 환경별 설정 분리 완료 ✅

**산출물**:
- `apps/backend/src/config/database.config.ts` ✅
- `apps/backend/ormconfig.ts` ✅
- `apps/backend/src/database/migrations/` ✅
- `apps/backend/src/database/data-source.ts` ✅
- `apps/backend/src/database/database.service.ts` ✅
- `apps/backend/src/database/database.module.ts` ✅
- 환경별 설정 파일: `.env.development`, `.env.test`, `.env.production` ✅

#### Task 2.5: 핵심 테이블 마이그레이션 작성 (4시간)
**담당자**: 백엔드 개발자 2명 (병렬 작업)  

**Developer A 담당 테이블**:
- [x] users (사용자)
- [x] organizations (단체)  
- [x] user_organizations (사용자-단체 관계)

**Developer B 담당 테이블**:
- [x] events (행사)
- [x] budgets (예산서)
- [x] budget_items (예산 항목) - BudgetIncomes, BudgetExpenses로 분리 구현

**세부 작업**:
- [x] CREATE TABLE 문 작성
- [x] 제약 조건 및 인덱스 설정
- [x] 외래키 관계 설정
- [x] 기본값 및 체크 제약 조건

**완료 기준**:
- 모든 테이블 생성 마이그레이션 완료 ✅
- 외래키 관계 정상 설정 ✅
- 제약 조건 정상 동작 ✅

**산출물**:
- `apps/backend/src/database/migrations/1757331860358-CreateUsersTable.ts` ✅
- `apps/backend/src/database/migrations/1757332045857-CreateOrganizationsTable.ts` ✅
- `apps/backend/src/database/migrations/1757332257934-CreateUserOrganizationsTable.ts` ✅
- `apps/backend/src/database/migrations/1757332260435-CreateEventsTable.ts` ✅
- `apps/backend/src/database/migrations/1757332263014-CreateBudgetsTable.ts` ✅
- `apps/backend/src/database/migrations/1757332265611-CreateBudgetIncomesTable.ts` ✅
- `apps/backend/src/database/migrations/1757332277135-CreateBudgetExpensesTable.ts` ✅

#### Task 2.6: 결산 및 OCR 관련 테이블 마이그레이션 (2시간)
**담당자**: 백엔드 개발자 (시니어)  

**세부 작업**:
- [x] settlements (결산서) 테이블
- [x] settlement_items (결산 항목) 테이블
- [x] receipts (영수증) 테이블 - ReceiptScans, ReceiptValidations로 분리 구현
- [x] receipt_items (영수증 항목) 테이블 - Receipt 관련 엔티티에 통합
- [x] ocr_jobs (OCR 작업) 테이블 - OCRResults로 구현
- [x] audit_trails (감사 로그) 테이블 - 추가 구현

**완료 기준**:
- 모든 결산/OCR 테이블 생성 완료 ✅
- 복잡한 관계 정상 설정 ✅
- 성능 고려 인덱스 설정 ✅

**산출물**:
- `apps/backend/src/database/migrations/1757332280000-CreateSettlementsTable.ts` ✅
- `apps/backend/src/database/migrations/1757332285000-CreateSettlementItemsTable.ts` ✅
- `apps/backend/src/database/migrations/1757332295000-CreateReceiptScansTable.ts` ✅
- `apps/backend/src/database/migrations/1757332305000-CreateReceiptValidationsTable.ts` ✅
- `apps/backend/src/database/migrations/1757332300000-CreateOcrResultsTable.ts` ✅
- `apps/backend/src/database/migrations/1757332290000-CreateAuditTrailsTable.ts` ✅

---

### Day 3: Entity 클래스 및 Repository 구현 (8시간)

#### Task 2.7: 기본 Entity 클래스 작성 (4시간)
**담당자**: 백엔드 개발자 2명 (병렬 작업)

**Developer A 담당**:
- [x] User Entity 클래스
- [x] Organization Entity 클래스
- [x] UserOrganization Entity 클래스

**Developer B 담당**:
- [x] Event Entity 클래스
- [x] Budget Entity 클래스 (Budget, BudgetIncome, BudgetExpense로 분리)
- [x] BudgetItem Entity 클래스 (Budget 내 통합)

**세부 작업**:
- [x] TypeORM 데코레이터 적용
- [x] 관계 매핑 설정 (@OneToMany, @ManyToOne, @ManyToMany)
- [x] 유효성 검증 규칙 추가
- [x] 가상 컬럼 및 계산 필드 설정

**완료 기준**:
- 모든 Entity 클래스 정상 동작 ✅
- 관계 매핑 검증 완료 ✅
- 타입 안정성 확보 ✅

**산출물**:
- `backend/src/entities/user.entity.ts` ✅
- `backend/src/entities/organization.entity.ts` ✅
- `backend/src/entities/user-organization.entity.ts` ✅
- `backend/src/entities/event.entity.ts` ✅
- `backend/src/entities/budget.entity.ts` ✅
- `backend/src/entities/budget-income.entity.ts` ✅
- `backend/src/entities/budget-expense.entity.ts` ✅

#### Task 2.8: 결산/OCR Entity 클래스 작성 (2시간)
**담당자**: 백엔드 개발자 (시니어)

**세부 작업**:
- [x] Settlement Entity 클래스
- [x] SettlementItem Entity 클래스  
- [x] Receipt Entity 클래스 (ReceiptScan, ReceiptValidation으로 분리)
- [x] ReceiptItem Entity 클래스 (Receipt 관련 Entity 내 통합)
- [x] OCRJob Entity 클래스 (OCRResult로 구현)
- [x] AuditTrail Entity 클래스 (추가 구현)

**완료 기준**:
- 복잡한 관계 매핑 완료 ✅
- JSON 필드 처리 구현 ✅
- 파일 경로 및 메타데이터 처리 ✅

**산출물**:
- `backend/src/entities/settlement.entity.ts` ✅
- `backend/src/entities/settlement-item.entity.ts` ✅
- `backend/src/entities/receipt-scan.entity.ts` ✅
- `backend/src/entities/receipt-validation.entity.ts` ✅
- `backend/src/entities/ocr-result.entity.ts` ✅
- `backend/src/entities/audit-trail.entity.ts` ✅

#### Task 2.9: Repository 패턴 구현 (2시간)
**담당자**: 백엔드 개발자 (시니어)

**세부 작업**:
- [x] 기본 Repository 인터페이스 정의
- [x] 커스텀 Repository 메서드 구현
- [x] 쿼리 최적화 로직 추가
- [x] 트랜잭션 처리 패턴 구현

**완료 기준**:
- Repository 패턴 일관성 확보 ✅
- 복잡한 쿼리 메서드 구현 ✅
- 트랜잭션 안전성 보장 ✅

**산출물**:
- `backend/src/repositories/base.repository.ts` ✅
- `backend/src/repositories/user.repository.ts` ✅
- `backend/src/repositories/event.repository.ts` ✅
- `backend/src/repositories/budget.repository.ts` ✅
- `backend/src/repositories/query-optimizer.ts` ✅ (추가 구현)
- `backend/src/repositories/transaction-manager.ts` ✅ (추가 구현)
- `backend/src/repositories/index.ts` ✅ (추가 구현)
- `backend/src/repositories/README.md` ✅ (문서화)

---

### Day 4: 시드 데이터 및 테스트 데이터 구성 (8시간)

#### Task 2.10: 기본 시드 데이터 작성 (3시간)
**담당자**: 백엔드 개발자 (주니어)

**세부 작업**:
- [x] 기본 단체 데이터 (청년회, 자모회, 초등부, 중고등부)
- [x] 관리자 사용자 계정
- [x] 기본 설정 데이터 (Organization settings 필드에 포함)
- [x] 권한 및 역할 데이터 (UserOrganization 엔티티로 구현)

**완료 기준**:
- 시스템 운영에 필요한 최소 데이터 준비 ✅
- 관리자 계정으로 로그인 가능 ✅
- 기본 설정 정상 동작 ✅

**산출물**:
- `backend/src/database/seeds/01-organizations.seed.ts` ✅
- `backend/src/database/seeds/02-admin-users.seed.ts` ✅
- `backend/src/database/seeds/03-user-organizations.seed.ts` ✅
- `backend/src/database/seeds/index.ts` ✅
- Package.json 스크립트 추가 (seed, seed:organizations, seed:users, seed:relations) ✅

#### Task 2.11: 개발용 테스트 데이터 작성 (3시간)
**담당자**: 백엔드 개발자 2명

**세부 작업**:
- [x] 테스트 사용자 계정 (단체별 다양한 역할)
- [x] 샘플 행사 데이터
- [x] 예산서/결산서 예시 데이터
- [x] 영수증 샘플 데이터

**완료 기준**:
- 다양한 시나리오 테스트 가능한 데이터 ✅
- 권한별 테스트 계정 준비 ✅
- 완전한 예결산 플로우 테스트 가능 ✅

**산출물**:
- `backend/src/database/seeds/04-test-users.seed.ts` ✅
- `backend/src/database/seeds/05-sample-events.seed.ts` ✅
- `backend/src/database/seeds/06-sample-budgets.seed.ts` ✅

#### Task 2.12: 데이터 생성 자동화 스크립트 (2시간)
**담당자**: DevOps 엔지니어 + 백엔드 개발자

**세부 작업**:
- [x] 대량 테스트 데이터 생성 스크립트
- [x] 데이터베이스 초기화 스크립트
- [x] 백업 및 복원 스크립트
- [x] 개발환경 리셋 스크립트

**완료 기준**:
- 원클릭으로 데이터베이스 초기화 가능 ✅
- 대량 데이터로 성능 테스트 가능 ✅
- 백업/복원 자동화 완료 ✅

**산출물**:
- `backend/src/database/scripts/bulk-data-generator.ts` ✅
- `backend/src/database/scripts/database-utils.ts` ✅  
- `backend/src/database/scripts/backup-restore.ts` ✅
- Package.json 스크립트 5개 추가 ✅

---

### Day 5: 성능 최적화 및 검증 (8시간)

#### Task 2.13: 인덱스 최적화 및 쿼리 분석 (3시간) ✅
**담당자**: 백엔드 개발자 (시니어)

**세부 작업**:
- [x] 주요 쿼리 패턴 분석
- [x] 성능 병목 인덱스 추가
- [x] 복합 인덱스 최적화
- [x] 쿼리 실행 계획 분석

**완료 기준**:
- 주요 쿼리 성능 3초 이내 ✅
- 인덱스 적중률 90% 이상 ✅
- N+1 쿼리 문제 해결 ✅

**산출물**:
- `backend/src/database/scripts/index-optimization.ts` ✅
- `backend/src/database/scripts/query-analyzer.ts` ✅
- `backend/src/database/scripts/INDEX_OPTIMIZATION.md` ✅
- Package.json 스크립트 5개 추가 ✅

#### Task 2.14: 데이터 무결성 검증 (2시간) ✅
**담당자**: 백엔드 개발자 2명

**세부 작업**:
- [x] 외래키 제약 조건 검증
- [x] 체크 제약 조건 테스트
- [x] 중복 데이터 방지 검증
- [x] 트랜잭션 롤백 테스트

**완료 기준**:
- 모든 제약 조건 정상 동작 ✅
- 데이터 일관성 보장 ✅
- 무결성 위반시 적절한 에러 처리 ✅

**검증 항목**:
- [x] 사용자-단체 관계 제약 조건
- [x] 행사-예결산 일관성
- [x] 영수증-결산 연동 정확성
- [x] OCR 작업 상태 관리

**산출물**:
- `backend/src/database/scripts/data-integrity-validator.ts` ✅

#### Task 2.15: 데이터베이스 성능 테스트 (2시간)
**담당자**: 전체 백엔드 팀 + DevOps

**세부 작업**:
- [ ] 대량 데이터 삽입 테스트
- [ ] 동시 접속 부하 테스트
- [ ] 복잡한 조인 쿼리 성능 테스트
- [ ] 백업/복원 성능 측정

**완료 기준**:
- 10,000건 데이터 처리 성능 확인
- 50명 동시 접속 처리 가능
- 복잡한 쿼리 응답시간 합리적 수준

**성능 기준**:
- 단순 조회: 100ms 이내
- 복잡한 조회: 500ms 이내
- 데이터 입력: 200ms 이내
- 페이징 쿼리: 300ms 이내

#### Task 2.16: 문서화 및 최종 검토 (1시간)
**담당자**: 백엔드 개발자 (시니어)

**세부 작업**:
- [ ] 데이터베이스 스키마 문서 업데이트
- [ ] API 문서에 반영할 데이터 모델 정리
- [ ] 마이그레이션 실행 가이드 작성
- [ ] 트러블슈팅 가이드 작성

**완료 기준**:
- 모든 데이터베이스 관련 문서 최신화
- 다른 개발자가 이해하기 쉬운 문서
- 운영 시 참고할 가이드 완성

**산출물**:
- `docs/database/schema-documentation.md`
- `docs/database/migration-guide.md`
- `docs/database/troubleshooting.md`

## 병렬 작업 가능성

### Day 2: 마이그레이션 작성 시 병렬 분업
```
Developer A                    Developer B
├─ users 테이블                ├─ events 테이블
├─ organizations 테이블        ├─ budgets 테이블  
└─ user_organizations 테이블   └─ budget_items 테이블
```

### Day 3: Entity 클래스 작성 시 병렬 분업
```
Developer A                    Developer B
├─ User Entity                 ├─ Event Entity
├─ Organization Entity         ├─ Budget Entity
└─ UserOrganization Entity     └─ BudgetItem Entity
```

### Day 4: 시드 데이터 작성 시 병렬 분업
```
Developer A                    Developer B
├─ 기본 시드 데이터            ├─ 테스트 데이터
└─ 관리자 계정                 └─ 샘플 행사/예결산 데이터
```

## 위험 요소 및 대응 방안

### 기술적 위험
1. **복잡한 관계 매핑**
   - 위험: N:N 관계, 순환 참조 이슈
   - 대응: 단계적 구현, 철저한 테스트

2. **성능 문제**
   - 위험: 복잡한 조인으로 인한 속도 저하
   - 대응: 쿼리 최적화, 적절한 인덱싱

3. **데이터 무결성**
   - 위험: 제약 조건 누락, 일관성 문제
   - 대응: 철저한 검증, 트랜잭션 활용

### 일정 위험
1. **TypeORM 학습 곡선**
   - 위험: 팀원의 ORM 경험 부족
   - 대응: 페어 프로그래밍, 교육 시간 확보

2. **스키마 변경 요청**
   - 위험: 개발 중 요구사항 변경
   - 대응: 유연한 마이그레이션 설계

## 완료 후 확인 사항

### 기능 검증
- [ ] 모든 테이블 정상 생성
- [ ] 외래키 관계 정상 동작
- [ ] Entity 클래스 CRUD 동작
- [ ] 시드 데이터 정상 삽입
- [ ] 마이그레이션 Up/Down 테스트

### 성능 검증  
- [ ] 주요 쿼리 성능 기준 만족
- [ ] 인덱스 효과 검증
- [ ] 대량 데이터 처리 테스트
- [ ] 동시성 문제 없음

### 데이터 무결성 검증
- [ ] 제약 조건 정상 동작
- [ ] 트랜잭션 안전성 확인
- [ ] 데이터 일관성 보장
- [ ] 백업/복원 정상 동작

## 다음 단계

워크플로우 완료 후 진행할 작업:
1. **[03_Backend_Development](./03_Backend_Development.md)** - NestJS API 개발 시작
2. **[04_Frontend_Development](./04_Frontend_Development.md)** - React 프론트엔드 개발 시작

---

**관련 문서**:
- [TSD 02_Database_Schema](../TSD/02_Database_Schema.md)
- [메인 워크플로우](./00_Main_Workflow.md)
- [인프라 설정](./01_Infrastructure_Setup.md)