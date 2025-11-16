import { Module, Global } from "@nestjs/common";
import { APP_PIPE, APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { OwnershipGuard } from "./guards/ownership.guard";
import { CacheInvalidationService } from "./services/cache-invalidation.service";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { AllExceptionsFilter } from "./filters/all-exceptions.filter";
import { ResponseTransformInterceptor } from "./interceptors/response-transform.interceptor";

@Global()
@Module({
  imports: [],
  providers: [
    // 글로벌 Validation Pipe 등록
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // 글로벌 예외 필터
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 글로벌 응답 변환 인터셉터
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    // Ownership Guard
    OwnershipGuard,
    // Cache Invalidation Service
    CacheInvalidationService,
  ],
  exports: [OwnershipGuard, CacheInvalidationService],
})
export class CommonModule {}
