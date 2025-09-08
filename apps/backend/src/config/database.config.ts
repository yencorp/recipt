import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * 데이터베이스 설정 팩토리
 * NestJS TypeORM 모듈에서 사용하는 설정
 */
export const createDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST') || 'localhost',
  port: parseInt(configService.get('DATABASE_PORT')) || 5432,
  username: configService.get('DATABASE_USER') || 'recipt',
  password: configService.get('DATABASE_PASSWORD') || 'recipt123',
  database: configService.get('DATABASE_NAME') || 'recipt_db',
  schema: configService.get('DATABASE_SCHEMA') || 'public',
  
  // 엔티티 및 마이그레이션 경로
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  
  // 개발 환경 설정
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('ENABLE_QUERY_LOGGING') === 'true' ? true : ['error'],
  
  // 자동 로드 및 재시도 설정
  autoLoadEntities: true,
  retryAttempts: 3,
  retryDelay: 3000,
  
  // 연결 풀 설정 (성능 최적화)
  extra: {
    max: 20,           // 최대 연결 수
    min: 5,            // 최소 연결 수
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    statement_timeout: 60000,
    query_timeout: 60000,
  },
  
  // SSL 설정 (프로덕션 환경)
  ssl: configService.get('NODE_ENV') === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // 캐시 설정
  cache: {
    duration: 30000, // 30초
  },
  
  // 마이그레이션 설정
  migrationsRun: false, // 애플리케이션 시작 시 자동 마이그레이션 실행하지 않음
  migrationsTableName: 'typeorm_migrations',
});

/**
 * 환경별 데이터베이스 설정
 */
export const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig = {
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'recipt',
    password: process.env.DATABASE_PASSWORD || 'recipt123',
    database: process.env.DATABASE_NAME || 'recipt_db',
    schema: process.env.DATABASE_SCHEMA || 'public',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsTableName: 'typeorm_migrations',
  };

  // 환경별 설정 차이
  switch (env) {
    case 'production':
      return {
        ...baseConfig,
        synchronize: false,
        logging: ['error'],
        ssl: {
          rejectUnauthorized: false
        },
        extra: {
          max: 30,
          min: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
          statement_timeout: 60000,
          query_timeout: 60000,
        },
      };
    
    case 'test':
      return {
        ...baseConfig,
        database: process.env.TEST_DATABASE_NAME || 'recipt_test_db',
        synchronize: true,
        logging: false,
        dropSchema: true,
        keepConnectionAlive: true,
      };
    
    case 'development':
    default:
      return {
        ...baseConfig,
        synchronize: true,
        logging: true,
        extra: {
          max: 20,
          min: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      };
  }
};