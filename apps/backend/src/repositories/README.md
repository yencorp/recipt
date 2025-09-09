# Repository 패턴 구현

Receipt OCR Management System의 Repository 패턴 구현입니다. 모든 데이터 액세스 로직을 캡슐화하고 쿼리 최적화, 트랜잭션 관리, 성능 모니터링을 제공합니다.

## 🏗️ 아키텍처 구조

```
repositories/
├── base.repository.ts              # 기본 Repository 클래스
├── user.repository.ts              # 사용자 Repository
├── event.repository.ts             # 행사 Repository  
├── budget.repository.ts            # 예산 Repository
├── query-optimizer.ts              # 쿼리 최적화 유틸리티
├── transaction-manager.ts          # 트랜잭션 관리자
├── index.ts                        # 모듈 exports
├── repository.integration-test.ts  # 통합 테스트
├── validate-repositories.ts        # 유효성 검사 스크립트
└── README.md                       # 문서
```

## 📋 주요 기능

### 1. BaseRepository 기능
- **기본 CRUD**: create, read, update, delete
- **페이징**: 대용량 데이터 페이징 처리
- **검색**: 조건부 검색 및 전문 검색
- **통계**: 집계 쿼리 및 통계 데이터
- **트랜잭션**: ACID 트랜잭션 지원
- **캐싱**: 쿼리 결과 캐싱
- **최적화**: N+1 문제 해결 및 쿼리 최적화

### 2. 쿼리 최적화 (QueryOptimizer)
- **성능 모니터링**: 쿼리 실행 시간 추적
- **캐싱**: 결과 캐싱 및 캐시 관리
- **N+1 해결**: 관계 로딩 최적화
- **전문 검색**: PostgreSQL FTS 활용
- **인덱스 분석**: 인덱스 사용 현황 분석

### 3. 트랜잭션 관리 (TransactionManager)
- **ACID 보장**: 트랜잭션 무결성 
- **중첩 트랜잭션**: 세이브포인트 지원
- **사가 패턴**: 분산 트랜잭션 지원
- **잠금**: 낙관적/비관적 잠금
- **배치 처리**: 대량 데이터 처리
- **모니터링**: 활성 트랜잭션 추적

## 🚀 사용법

### 기본 사용법

```typescript
import { UserRepository } from './repositories';
import { DataSource } from 'typeorm';

// Repository 인스턴스 생성
const dataSource = new DataSource(/* config */);
const userRepository = new UserRepository(dataSource);

// 기본 CRUD
const user = await userRepository.create({
  email: 'user@example.com',
  username: 'user123',
  fullName: '사용자'
});

const foundUser = await userRepository.findById(user.id);
const updatedUser = await userRepository.update(user.id, { fullName: '수정된 사용자' });
await userRepository.delete(user.id);
```

### 페이징 검색

```typescript
const result = await userRepository.findWithPagination(
  { page: 1, limit: 10 },
  { where: { isActive: true } }
);

console.log({
  data: result.data,
  total: result.total,
  hasNextPage: result.hasNextPage
});
```

### 최적화된 검색

```typescript
const searchResult = await userRepository.searchOptimized(
  'John Doe',                    // 검색어
  ['fullName', 'email'],         // 검색 필드
  { isActive: true },            // 추가 필터
  { page: 1, limit: 20 }         // 페이징
);
```

### 트랜잭션 사용

```typescript
const result = await userRepository.executeInTransaction(async (manager) => {
  const user = await manager.save(User, userData);
  const profile = await manager.save(UserProfile, profileData);
  return { user, profile };
});
```

### 배치 처리

```typescript
const users = Array(1000).fill(null).map((_, i) => ({ email: `user${i}@example.com` }));

await userRepository.executeBulkOperationInChunks(
  users,
  async (chunk, manager) => {
    await manager.save(User, chunk);
  },
  100  // 청크 크기
);
```

## 🔧 성능 최적화

### 쿼리 캐싱

```typescript
const cachedUsers = await userRepository.findWithCache(
  { where: { isActive: true } },
  300000  // 5분 캐시
);
```

### 관계 로딩 최적화

```typescript
const userWithOrganization = await userRepository.findWithOptimizedRelations(
  { id: userId },
  ['organization', 'userOrganizations']
);
```

### 성능 모니터링

```typescript
const stats = userRepository.getQueryPerformanceStats();
console.log({
  totalQueries: stats.totalQueries,
  averageTime: stats.averageExecutionTime,
  slowQueries: stats.slowQueries
});
```

## 🧪 테스트

### 유효성 검사 실행

```bash
# TypeScript 컴파일 후 실행
npx ts-node src/repositories/validate-repositories.ts
```

### 통합 테스트 실행

```bash
# Jest를 사용한 테스트
npm test -- src/repositories/repository.integration-test.ts
```

## 📊 모니터링

### 쿼리 성능 분석

```typescript
// 느린 쿼리 조회
const stats = userRepository.getQueryPerformanceStats();
const slowQueries = stats.slowQueries;

// 인덱스 사용 현황
const indexUsage = await userRepository.analyzeIndexUsage();

// 쿼리 실행 계획
const queryBuilder = userRepository.createOptimizedQueryBuilder('user');
const plan = await userRepository.explainQuery(queryBuilder);
```

### 트랜잭션 모니터링

```typescript
// 활성 트랜잭션
const activeTransactions = userRepository.getActiveTransactions();

// 장기 실행 트랜잭션 (5분 이상)
const longRunning = userRepository.getLongRunningTransactions(5);
```

## 🛡️ 보안 및 베스트 프랙티스

### 1. SQL 인젝션 방지
- 모든 쿼리에서 파라미터화된 쿼리 사용
- 동적 WHERE 절 안전 처리

### 2. 데이터 무결성
- 트랜잭션을 통한 일관성 보장
- 낙관적/비관적 잠금 지원

### 3. 성능 최적화
- 쿼리 캐싱 및 결과 캐싱
- N+1 문제 방지
- 인덱스 최적화

### 4. 에러 처리
- 구체적인 에러 메시지
- 트랜잭션 롤백 처리
- 재시도 메커니즘

## 🔍 디버깅

### 쿼리 로깅 활성화

```typescript
const queryBuilder = userRepository.createOptimizedQueryBuilder('user', {
  enableLogging: true,
  enableQueryCache: false  // 디버깅 시 캐시 비활성화
});
```

### 성능 프로파일링

```typescript
const result = await userRepository.executeWithMonitoring(queryBuilder);
// 자동으로 성능 메트릭이 수집됨
```

## 📋 체크리스트

Repository 구현 완료 체크리스트:

- [x] BaseRepository 구현
- [x] 특화된 Repository 구현 (User, Event, Budget)  
- [x] 쿼리 최적화 유틸리티
- [x] 트랜잭션 관리자
- [x] 페이징 및 검색 기능
- [x] 성능 모니터링 기능
- [x] 캐싱 기능
- [x] 통합 테스트
- [x] 유효성 검사 스크립트
- [x] 문서화

## 🔗 관련 문서

- [Entity 클래스 정의](../entities/README.md)
- [Database 마이그레이션](../database/migrations/README.md)
- [API 문서](../../docs/api/README.md)
- [성능 튜닝 가이드](../../docs/performance/README.md)