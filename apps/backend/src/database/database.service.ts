import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * 데이터베이스 서비스
 * 데이터베이스 연결 상태 관리 및 헬스 체크
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.checkConnection();
  }

  async onModuleDestroy() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.log('데이터베이스 연결이 종료되었습니다.');
    }
  }

  /**
   * 데이터베이스 연결 상태 확인
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      // 간단한 쿼리로 연결 테스트
      await this.dataSource.query('SELECT 1');
      
      this.logger.log('데이터베이스 연결이 정상적으로 작동 중입니다.');
      return true;
    } catch (error) {
      this.logger.error('데이터베이스 연결 실패:', error.message);
      return false;
    }
  }

  /**
   * 데이터베이스 상태 정보 반환
   */
  async getStatus() {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          current_database() as database_name,
          current_schema() as schema_name,
          version() as version,
          current_timestamp as current_time,
          pg_database_size(current_database()) as database_size
      `);

      const options = this.dataSource.options as any;
      const connectionInfo = {
        isConnected: this.dataSource.isInitialized,
        driverVersion: this.dataSource.driver?.version || 'unknown',
        host: options.host,
        port: options.port,
        database: options.database,
        schema: options.schema,
      };

      return {
        connection: connectionInfo,
        database: result[0],
      };
    } catch (error) {
      this.logger.error('데이터베이스 상태 확인 실패:', error.message);
      return {
        connection: { isConnected: false },
        error: error.message,
      };
    }
  }

  /**
   * 마이그레이션 상태 확인
   */
  async getMigrationStatus() {
    try {
      const migrations = await this.dataSource.runMigrations({ transaction: 'none' });
      const pendingMigrations = await this.dataSource.showMigrations();
      
      return {
        executedMigrations: migrations.length,
        pendingMigrations: pendingMigrations,
        lastMigration: migrations[migrations.length - 1]?.name || null,
      };
    } catch (error) {
      this.logger.error('마이그레이션 상태 확인 실패:', error.message);
      return {
        error: error.message,
      };
    }
  }

  /**
   * 테이블 목록 조회
   */
  async getTables() {
    try {
      const tables = await this.dataSource.query(`
        SELECT 
          table_name,
          table_type,
          table_schema
        FROM information_schema.tables 
        WHERE table_schema = current_schema()
        ORDER BY table_name
      `);

      return tables;
    } catch (error) {
      this.logger.error('테이블 목록 조회 실패:', error.message);
      return [];
    }
  }

  /**
   * 데이터베이스 통계 정보
   */
  async getStatistics() {
    try {
      const stats = await this.dataSource.query(`
        SELECT 
          schemaname as schema_name,
          tablename as table_name,
          attname as column_name,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = current_schema()
        ORDER BY tablename, attname
      `);

      const connectionStats = await this.dataSource.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      return {
        tableStats: stats,
        connectionStats: connectionStats[0],
      };
    } catch (error) {
      this.logger.error('데이터베이스 통계 조회 실패:', error.message);
      return {
        error: error.message,
      };
    }
  }

  /**
   * 트랜잭션 실행 헬퍼
   */
  async executeTransaction<T>(
    callback: (queryRunner: any) => Promise<T>
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      const result = await callback(queryRunner);
      
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('트랜잭션 실행 실패:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Raw 쿼리 실행 (개발 환경에서만)
   */
  async executeRawQuery(query: string, parameters: any[] = []) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('프로덕션 환경에서는 Raw 쿼리 실행이 허용되지 않습니다.');
    }

    try {
      const result = await this.dataSource.query(query, parameters);
      this.logger.debug(`Raw 쿼리 실행: ${query}`);
      return result;
    } catch (error) {
      this.logger.error('Raw 쿼리 실행 실패:', error.message);
      throw error;
    }
  }
}