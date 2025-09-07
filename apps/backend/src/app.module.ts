import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
// import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import * as redisStore from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // 환경 설정 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
      cache: true,
    }),

    // 데이터베이스 모듈
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        schema: configService.get('DATABASE_SCHEMA'),
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('ENABLE_QUERY_LOGGING') === 'true',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        retryAttempts: 3,
        retryDelay: 3000,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    // Redis 캐시 모듈
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB'),
        ttl: configService.get('REDIS_TTL') || 3600,
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

    // 비즈니스 모듈들 (향후 추가 예정)
    // AuthModule,
    // UsersModule,
    // OrganizationsModule,
    // ProjectsModule,
    // BudgetsModule,
    // SettlementsModule,
    // ReceiptsModule,
    // DocumentsModule,
    // BlogModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}