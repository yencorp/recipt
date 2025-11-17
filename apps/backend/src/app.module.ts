import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
// import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthController } from "./health/health.controller";
import { DatabaseModule } from "./database/database.module";
import { CommonModule } from "./common/common.module";
import { ConfigModule as AppConfigModule } from "./config/config.module";

// 보안 미들웨어 imports
import { RateLimitMiddleware } from "./common/middlewares/rate-limit.middleware";
import { SecurityMiddleware } from "./common/middlewares/security.middleware";
import { RequestLoggingMiddleware } from "./common/middlewares/request-logging.middleware";
import { createDatabaseConfig } from "./config/database.config";

// 비즈니스 모듈 imports
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { EventsModule } from "./modules/events/events.module";
import { BudgetsModule } from "./modules/budgets/budgets.module";
import { BudgetItemsModule } from "./modules/budget-items/budget-items.module";
import { SettlementsModule } from "./modules/settlements/settlements.module";
import { SettlementItemsModule } from "./modules/settlement-items/settlement-items.module";
import { ReceiptsModule } from "./modules/receipts/receipts.module";
import { PostsModule } from "./modules/posts/posts.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AdminModule } from "./modules/admin/admin.module";
import { FilesModule } from "./modules/files/files.module";
import { OcrModule } from "./modules/ocr/ocr.module";
import { PrintModule } from "./modules/print/print.module";

@Module({
  imports: [
    // 환경 설정 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || "development"}`, ".env"],
      cache: true,
      expandVariables: true,
    }),

    // 데이터베이스 모듈
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return createDatabaseConfig(configService);
      },
      inject: [ConfigService],
    }),

    // Redis 캐시 모듈
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // @ts-ignore - cache-manager-redis-yet 타입 정의 이슈 우회
        const { redisStore } = await import("cache-manager-redis-yet");
        return {
          // @ts-ignore
          store: await redisStore({
            socket: {
              host: configService.get("REDIS_HOST") || "redis",
              port: configService.get("REDIS_PORT") || 6379,
            },
            password: configService.get("REDIS_PASSWORD"),
            ttl: 3600 * 1000, // 1시간 (밀리초)
          }),
        };
      },
      inject: [ConfigService],
    }),

    // Rate Limiting 모듈 (임시 주석 처리)
    // ThrottlerModule.forRoot([
    //   {
    //     ttl: 60 * 1000,
    //     limit: 10,
    //   },
    // ]),

    // 스케줄러 모듈 (백그라운드 작업용)
    ScheduleModule.forRoot(),

    // 공통 모듈들
    CommonModule,
    AppConfigModule,
    DatabaseModule,

    // 비즈니스 모듈들
    AuthModule,
    UsersModule,
    OrganizationsModule,
    EventsModule,
    BudgetsModule,
    BudgetItemsModule,
    SettlementsModule,
    SettlementItemsModule,
    ReceiptsModule,
    PostsModule,
    NotificationsModule,
    AdminModule,
    FilesModule,
    OcrModule,
    PrintModule,

    // TODO: 향후 추가 예정 모듈들
    // ReceiptScansModule,
    // OcrModule,
    // PostsModule,
    // AdminModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 보안 헤더 미들웨어 (모든 라우트에 적용)
    consumer.apply(SecurityMiddleware).forRoutes("*");

    // 요청 로깅 미들웨어 (모든 라우트에 적용)
    consumer.apply(RequestLoggingMiddleware).forRoutes("*");

    // Rate Limiting 미들웨어 (API 라우트에만 적용)
    consumer.apply(RateLimitMiddleware).forRoutes("/api/*");
  }
}
