# 성능 최적화 명세서

## 성능 목표

- **웹 페이지 로딩**: 3초 이내 (3G 네트워크)
- **API 응답 시간**: 평균 200ms 이하
- **OCR 처리**: 영수증 1장당 5초 이내
- **동시 사용자**: 50명 이상 지원
- **데이터베이스 쿼리**: 95% 쿼리 100ms 이하

## 프론트엔드 최적화

### 1. 번들 최적화

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ 
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 벤더 라이브러리 분할
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          store: ['@reduxjs/toolkit', 'react-redux'],
          utils: ['date-fns', 'lodash-es'],
        },
      },
    },
    // 청크 크기 최적화
    chunkSizeWarningLimit: 1000,
    // CSS 코드 분할
    cssCodeSplit: true,
    // 소스맵 최적화 (프로덕션에서는 hidden)
    sourcemap: process.env.NODE_ENV === 'development' ? true : 'hidden',
  },
  // 개발 서버 최적화
  server: {
    hmr: {
      overlay: false, // 에러 오버레이 비활성화로 성능 향상
    },
  },
  // 의존성 사전 번들링 최적화
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@radix-ui/react-icons'], // 큰 아이콘 라이브러리 제외
  },
});
```

### 2. 코드 스플리팅 및 지연 로딩

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from './components/ui/loading-spinner';

// 페이지별 코드 스플리팅
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const EventListPage = lazy(() => import('./pages/events/EventListPage'));
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage'));
const BudgetPage = lazy(() => import('./pages/budget/BudgetPage'));
const OCRPage = lazy(() => import('./pages/ocr/OCRPage'));

// 관리자 페이지는 별도 청크로 분리
const AdminPages = lazy(() => import('./pages/admin/AdminPages'));

export const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/budget" element={<BudgetPage />} />
        <Route path="/ocr/:settlementId" element={<OCRPage />} />
        <Route path="/admin/*" element={<AdminPages />} />
      </Routes>
    </Suspense>
  );
};
```

### 3. 이미지 최적화

```typescript
// src/components/ui/OptimizedImage.tsx
import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
}) => {
  const [imageSrc, setImageSrc] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // WebP 지원 확인
    const canvas = document.createElement('canvas');
    const webpSupported = canvas.toDataURL('image/webp').indexOf('webp') > -1;
    
    // 적절한 형식 선택
    const optimizedSrc = webpSupported && src.includes('.jpg') 
      ? src.replace('.jpg', '.webp')
      : src;
    
    setImageSrc(optimizedSrc);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    // WebP 로드 실패 시 원본 이미지로 대체
    if (imageSrc?.includes('.webp')) {
      setImageSrc(src);
    }
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
};
```

### 4. 메모이제이션 최적화

```typescript
// src/hooks/useMemoizedQuery.ts
import { useMemo } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export function useMemoizedQuery<T>(
  key: any[],
  queryFn: () => Promise<T>,
  options?: UseQueryOptions<T>,
  deps: any[] = []
) {
  // 의존성 배열을 메모이제이션하여 불필요한 재실행 방지
  const memoizedKey = useMemo(() => key, deps);
  const memoizedFn = useMemo(() => queryFn, deps);
  
  return useQuery({
    queryKey: memoizedKey,
    queryFn: memoizedFn,
    ...options,
  });
}

// 컴포넌트에서 사용
const EventList = React.memo(({ organizationId }: { organizationId: string }) => {
  const { data: events } = useMemoizedQuery(
    ['events', organizationId],
    () => eventsApi.getEvents({ organizationId }),
    { enabled: !!organizationId },
    [organizationId] // 의존성 배열
  );

  const memoizedEvents = useMemo(() => {
    return events?.filter(event => event.status === 'ACTIVE') ?? [];
  }, [events]);

  return (
    <div>
      {memoizedEvents.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
});
```

## 백엔드 최적화

### 1. 데이터베이스 쿼리 최적화

```typescript
// backend/src/modules/events/events.service.ts
@Injectable()
export class EventsService {
  // ✅ N+1 문제 해결 - JOIN으로 한 번에 로드
  async findAllWithDetails(): Promise<Event[]> {
    return this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organization', 'org')
      .leftJoinAndSelect('event.budget', 'budget')
      .leftJoinAndSelect('event.settlement', 'settlement')
      .leftJoinAndSelect('settlement.receipts', 'receipts')
      .where('event.isActive = :isActive', { isActive: true })
      .orderBy('event.startDate', 'DESC')
      .getMany();
  }

  // ✅ 페이지네이션 적용
  async findPaginated(page: number, limit: number): Promise<{events: Event[], total: number}> {
    const [events, total] = await this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organization', 'org')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { events, total };
  }

  // ✅ 선택적 필드 로딩
  async findEventSummary(): Promise<Partial<Event>[]> {
    return this.eventsRepository
      .createQueryBuilder('event')
      .select([
        'event.id',
        'event.name', 
        'event.startDate',
        'event.status',
        'org.name'
      ])
      .leftJoin('event.organization', 'org')
      .getMany();
  }

  // ✅ 집계 쿼리 최적화
  async getEventStatistics(organizationId: string) {
    return this.eventsRepository
      .createQueryBuilder('event')
      .select([
        'COUNT(*) as totalEvents',
        'COUNT(CASE WHEN event.status = :completed THEN 1 END) as completedEvents',
        'SUM(CASE WHEN budget.total_expense IS NOT NULL THEN budget.total_expense ELSE 0 END) as totalBudget'
      ])
      .leftJoin('event.budget', 'budget')
      .where('event.organizationId = :organizationId', { organizationId })
      .setParameter('completed', EventStatus.COMPLETED)
      .getRawOne();
  }
}
```

### 2. 캐싱 전략

```typescript
// backend/src/common/decorators/cache.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

export const CacheResult = (key: string, ttl: number = 300) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY, key)(target, propertyName, descriptor);
    SetMetadata(CACHE_TTL, ttl)(target, propertyName, descriptor);
  };
};

// backend/src/common/interceptors/cache.interceptor.ts
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const reflector = new Reflector();
    const cacheKey = reflector.get<string>(CACHE_KEY, context.getHandler());
    const ttl = reflector.get<number>(CACHE_TTL, context.getHandler());

    if (!cacheKey) {
      return next.handle();
    }

    // 요청 파라미터를 포함한 캐시 키 생성
    const request = context.switchToHttp().getRequest();
    const fullCacheKey = `${cacheKey}:${this.generateKeyFromRequest(request)}`;

    // 캐시에서 조회
    const cachedResult = await this.cacheManager.get(fullCacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    // 캐시 미스 시 실제 실행 후 캐시 저장
    return next.handle().pipe(
      tap(async (result) => {
        await this.cacheManager.set(fullCacheKey, result, { ttl });
      })
    );
  }

  private generateKeyFromRequest(request: any): string {
    const { query, params, user } = request;
    return Buffer.from(JSON.stringify({ query, params, userId: user?.id }))
      .toString('base64');
  }
}

// 사용 예시
@Controller('events')
export class EventsController {
  @Get()
  @CacheResult('events_list', 300) // 5분 캐시
  async findAll(@Query() query: EventListQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  @CacheResult('event_detail', 600) // 10분 캐시
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
}
```

### 3. 비동기 처리 최적화

```typescript
// backend/src/modules/ocr/ocr.service.ts
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class OCRService {
  constructor(
    @InjectQueue('ocr-processing') private ocrQueue: Queue,
  ) {}

  async processReceiptsAsync(files: UploadFile[], jobId: string) {
    // 큰 작업을 작은 청크로 분할
    const chunks = this.chunkArray(files, 5); // 5개씩 처리
    
    for (const [index, chunk] of chunks.entries()) {
      await this.ocrQueue.add('process-chunk', {
        jobId,
        chunkIndex: index,
        files: chunk,
      }, {
        delay: index * 1000, // 1초씩 지연하여 부하 분산
        priority: 10 - index, // 첫 번째 청크 우선 처리
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
    }
  }

  @Process('process-chunk')
  async processChunk(job: Job<any>) {
    const { jobId, chunkIndex, files } = job.data;
    
    try {
      // 병렬 처리로 청크 내 파일들 동시 처리
      const results = await Promise.allSettled(
        files.map(file => this.processSingleFile(file))
      );

      // 진행률 업데이트
      await this.updateJobProgress(jobId, chunkIndex, results);
      
    } catch (error) {
      throw error; // Bull이 자동으로 재시도 처리
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
```

### 4. 연결 풀링 최적화

```typescript
// backend/src/config/database.config.ts
export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // 연결 풀 최적화
  extra: {
    // 최대 연결 수
    max: 20,
    // 최소 연결 수 (항상 유지)
    min: 2,
    // 유휴 연결 제거 시간 (30초)
    idle_in_transaction_session_timeout: 30000,
    // 연결 타임아웃 (10초)
    connectionTimeoutMillis: 10000,
    // 유휴 타임아웃 (30초)
    idleTimeoutMillis: 30000,
    // 연결 수명 (1시간)
    maxLifetimeSeconds: 3600,
  },
  
  // 쿼리 로깅 (개발환경에서만)
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  
  // 자동 스키마 동기화 비활성화 (프로덕션)
  synchronize: false,
  
  // 마이그레이션 자동 실행
  migrationsRun: process.env.NODE_ENV === 'production',
});
```

## OCR 최적화

### 1. 이미지 전처리 최적화

```python
# ocr_service/app/core/processors/optimized_processor.py
import cv2
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import asyncio

class OptimizedImageProcessor:
    def __init__(self):
        self.thread_pool = ThreadPoolExecutor(max_workers=4)
    
    async def process_batch(self, image_paths: list) -> list:
        """배치 이미지 처리"""
        loop = asyncio.get_event_loop()
        
        # 병렬 처리
        tasks = [
            loop.run_in_executor(
                self.thread_pool, 
                self.process_image_sync, 
                path
            ) for path in image_paths
        ]
        
        return await asyncio.gather(*tasks, return_exceptions=True)
    
    def process_image_sync(self, image_path: str) -> str:
        """동기식 이미지 처리 (스레드에서 실행)"""
        image = cv2.imread(image_path)
        
        # 이미지 크기에 따른 적응형 처리
        height, width = image.shape[:2]
        
        if width > 1200:
            # 큰 이미지는 단계적 축소
            scale = 800 / width
            image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        
        # GPU 가속 사용 가능 시 활용
        if cv2.cuda.getCudaEnabledDeviceCount() > 0:
            return self._process_with_gpu(image)
        else:
            return self._process_with_cpu(image)
    
    def _process_with_cpu(self, image: np.ndarray) -> str:
        """CPU 기반 처리"""
        # 멀티스레딩 활용한 필터 적용
        blurred = cv2.GaussianBlur(image, (5, 5), 0)
        gray = cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY)
        
        # 적응형 이진화
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        return self._save_processed_image(binary)
    
    def _process_with_gpu(self, image: np.ndarray) -> str:
        """GPU 가속 처리"""
        gpu_image = cv2.cuda_GpuMat()
        gpu_image.upload(image)
        
        # GPU에서 전처리 수행
        gpu_gray = cv2.cuda.cvtColor(gpu_image, cv2.COLOR_BGR2GRAY)
        gpu_binary = cv2.cuda.threshold(gpu_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        
        result = gpu_binary.download()
        return self._save_processed_image(result)
```

### 2. OCR 엔진 최적화

```python
# ocr_service/app/core/engines/optimized_ocr.py
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

class OptimizedOCREngine:
    def __init__(self):
        self.tesseract_pool = ThreadPoolExecutor(max_workers=2)
        self.easyocr_pool = ThreadPoolExecutor(max_workers=2)
        
        # 모델 예열
        asyncio.create_task(self._warm_up_engines())
    
    async def _warm_up_engines(self):
        """엔진 예열로 첫 실행 지연 최소화"""
        dummy_image = np.ones((100, 100, 3), dtype=np.uint8) * 255
        
        try:
            await asyncio.gather(
                self._tesseract_extract(dummy_image),
                self._easyocr_extract(dummy_image),
                return_exceptions=True
            )
        except:
            pass  # 예열 실패는 무시
    
    async def extract_parallel(self, image: np.ndarray) -> dict:
        """두 엔진을 병렬로 실행하여 더 나은 결과 선택"""
        tasks = [
            self._tesseract_extract(image),
            self._easyocr_extract(image)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 결과 비교 및 최선 선택
        tesseract_result = results[0] if not isinstance(results[0], Exception) else None
        easyocr_result = results[1] if not isinstance(results[1], Exception) else None
        
        return self._select_best_result(tesseract_result, easyocr_result)
    
    async def _tesseract_extract(self, image: np.ndarray) -> dict:
        """Tesseract 비동기 실행"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.tesseract_pool, 
            self._tesseract_sync, 
            image
        )
    
    async def _easyocr_extract(self, image: np.ndarray) -> dict:
        """EasyOCR 비동기 실행"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.easyocr_pool, 
            self._easyocr_sync, 
            image
        )
    
    @lru_cache(maxsize=100)
    def _cached_config(self, image_size: tuple) -> str:
        """이미지 크기별 최적화된 Tesseract 설정"""
        width, height = image_size
        
        if width < 400 or height < 400:
            return '--oem 3 --psm 8 -l kor+eng'  # 단일 단어용
        elif width > 1000:
            return '--oem 3 --psm 4 -l kor+eng'  # 큰 이미지용
        else:
            return '--oem 3 --psm 6 -l kor+eng'  # 기본 설정
    
    def _select_best_result(self, tesseract_result: dict, easyocr_result: dict) -> dict:
        """두 결과 중 더 나은 것 선택"""
        if not tesseract_result and not easyocr_result:
            return {"text": "", "confidence": 0.0, "engine": "none"}
        
        if not tesseract_result:
            return {**easyocr_result, "engine": "easyocr"}
        
        if not easyocr_result:
            return {**tesseract_result, "engine": "tesseract"}
        
        # 신뢰도와 텍스트 길이를 종합하여 판단
        tesseract_score = (tesseract_result.get('confidence', 0) * 0.7 + 
                          len(tesseract_result.get('text', '')) * 0.3)
        easyocr_score = (easyocr_result.get('confidence', 0) * 0.7 + 
                        len(easyocr_result.get('text', '')) * 0.3)
        
        if tesseract_score > easyocr_score:
            return {**tesseract_result, "engine": "tesseract"}
        else:
            return {**easyocr_result, "engine": "easyocr"}
```

## 모니터링 및 성능 분석

### 1. 성능 메트릭 수집

```typescript
// backend/src/common/interceptors/performance.interceptor.ts
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('PerformanceInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 성능 메트릭 로깅
        this.logger.log({
          method,
          url,
          duration,
          timestamp: new Date().toISOString(),
        });

        // 느린 쿼리 감지 (500ms 이상)
        if (duration > 500) {
          this.logger.warn(`Slow request detected: ${method} ${url} - ${duration}ms`);
        }
      })
    );
  }
}
```

### 2. 메모리 사용량 모니터링

```typescript
// backend/src/common/services/health-check.service.ts
@Injectable()
export class HealthCheckService {
  @Cron('*/30 * * * * *') // 30초마다 실행
  checkSystemHealth() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    };

    // 메모리 사용량이 500MB를 초과하면 경고
    if (metrics.memory.heapUsed > 500) {
      Logger.warn(`High memory usage: ${metrics.memory.heapUsed}MB`);
    }

    // 메트릭 저장 또는 외부 모니터링 시스템으로 전송
    this.sendMetrics(metrics);
  }

  private sendMetrics(metrics: any) {
    // Prometheus, DataDog 등으로 메트릭 전송
    // 또는 로컬 파일에 저장
  }
}
```

---

*이 성능 최적화 명세서는 시스템의 응답성과 확장성을 보장합니다.*