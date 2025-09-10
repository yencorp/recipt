import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
// import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from "@nestjs/schedule";
import * as redisStore from "cache-manager-redis-store";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthController } from "./health/health.controller";
import { DatabaseModule } from "./database/database.module";
import { CommonModule } from "./common/common.module";
import { ConfigModule as AppConfigModule } from "./config/config.module";
import { createDatabaseConfig } from "./config/database.config";

// 비즈니스 모듈 imports
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { EventsModule } from "./modules/events/events.module";
import { BudgetsModule } from "./modules/budgets/budgets.module";
import { SettlementsModule } from "./modules/settlements/settlements.module";

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
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get("REDIS_HOST"),
        port: configService.get("REDIS_PORT"),
        password: configService.get("REDIS_PASSWORD"),
        db: configService.get("REDIS_DB"),
        ttl: configService.get("REDIS_TTL") || 3600,
      }),
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
    EventsModule,
    BudgetsModule,
    SettlementsModule,

    // TODO: 향후 추가 예정 모듈들
    // OrganizationsModule,
    // ReceiptScansModule,
    // OcrModule,
    // PostsModule,
    // AdminModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
