import { Module, Global } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { OwnershipGuard } from "./guards/ownership.guard";
import { CacheInvalidationService } from "./services/cache-invalidation.service";

@Global()
@Module({
  imports: [CacheModule],
  providers: [
    // 글로벌 Validation Pipe 등록
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // Ownership Guard
    OwnershipGuard,
    // Cache Invalidation Service
    CacheInvalidationService,
    // TODO: 추가 글로벌 프로바이더들
    // {
    //   provide: APP_FILTER,
    //   useClass: HttpExceptionFilter,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: LoggingInterceptor,
    // },
  ],
  exports: [OwnershipGuard, CacheInvalidationService],
})
export class CommonModule {}
