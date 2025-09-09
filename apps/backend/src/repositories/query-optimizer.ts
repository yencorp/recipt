import { SelectQueryBuilder, EntityTarget, DataSource } from "typeorm";
import { Logger } from "@nestjs/common";

/**
 * 쿼리 최적화 옵션
 */
export interface QueryOptimizationOptions {
  enableQueryCache?: boolean;
  cacheTimeout?: number;
  enableLogging?: boolean;
  maxExecutionTime?: number;
  preventN1Problems?: boolean;
}

/**
 * 쿼리 성능 메트릭
 */
export interface QueryPerformanceMetrics {
  executionTime: number;
  queryText: string;
  affectedRows?: number;
  cacheHit: boolean;
  timestamp: Date;
}

/**
 * 쿼리 최적화 유틸리티 클래스
 * 성능 모니터링, 캐싱, N+1 문제 방지 등의 기능 제공
 */
export class QueryOptimizer {
  private readonly logger = new Logger(QueryOptimizer.name);
  private readonly performanceMetrics: QueryPerformanceMetrics[] = [];

  constructor(private readonly dataSource: DataSource) {}

  /**
   * 성능 최적화된 쿼리 빌더 생성
   */
  createOptimizedQueryBuilder<T>(
    entity: EntityTarget<T>,
    alias: string,
    options?: QueryOptimizationOptions
  ): SelectQueryBuilder<T> {
    const repository = this.dataSource.getRepository(entity);
    const queryBuilder = repository.createQueryBuilder(alias);

    if (options?.enableQueryCache) {
      queryBuilder.cache(options.cacheTimeout || 300000); // 5분 기본 캐시
    }

    return queryBuilder;
  }

  /**
   * N+1 쿼리 문제 방지를 위한 관계 로딩 최적화
   */
  optimizeRelationLoading<T>(
    queryBuilder: SelectQueryBuilder<T>,
    relations: string[]
  ): SelectQueryBuilder<T> {
    relations.forEach((relation) => {
      queryBuilder.leftJoinAndSelect(
        `${queryBuilder.alias}.${relation}`,
        relation
      );
    });

    return queryBuilder;
  }

  /**
   * 페이징 쿼리 최적화
   */
  optimizePagination<T>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number,
    limit: number
  ): SelectQueryBuilder<T> {
    const offset = (page - 1) * limit;

    // 대용량 데이터의 경우 OFFSET 성능 최적화
    if (offset > 10000) {
      // 커서 기반 페이징 권장 로그
      this.logger.warn(
        `Large offset detected (${offset}). Consider using cursor-based pagination for better performance.`
      );
    }

    return queryBuilder.skip(offset).take(limit);
  }

  /**
   * 조건부 쿼리 빌딩 (동적 WHERE 절)
   */
  addConditionalWhere<T>(
    queryBuilder: SelectQueryBuilder<T>,
    conditions: Record<string, any>
  ): SelectQueryBuilder<T> {
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          queryBuilder.andWhere(
            `${queryBuilder.alias}.${key} IN (:...${key})`,
            {
              [key]: value,
            }
          );
        } else if (typeof value === "string" && value.includes("%")) {
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} LIKE :${key}`, {
            [key]: value,
          });
        } else {
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} = :${key}`, {
            [key]: value,
          });
        }
      }
    });

    return queryBuilder;
  }

  /**
   * 날짜 범위 쿼리 최적화
   */
  addDateRangeFilter<T>(
    queryBuilder: SelectQueryBuilder<T>,
    dateField: string,
    startDate?: Date,
    endDate?: Date
  ): SelectQueryBuilder<T> {
    if (startDate) {
      queryBuilder.andWhere(
        `${queryBuilder.alias}.${dateField} >= :startDate`,
        {
          startDate,
        }
      );
    }

    if (endDate) {
      queryBuilder.andWhere(`${queryBuilder.alias}.${dateField} <= :endDate`, {
        endDate,
      });
    }

    return queryBuilder;
  }

  /**
   * 전문 검색 쿼리 최적화 (PostgreSQL의 FTS 활용)
   */
  addFullTextSearch<T>(
    queryBuilder: SelectQueryBuilder<T>,
    fields: string[],
    searchQuery: string
  ): SelectQueryBuilder<T> {
    if (!searchQuery?.trim()) return queryBuilder;

    const searchConditions = fields
      .map(
        (field, index) =>
          `to_tsvector('korean', ${queryBuilder.alias}.${field}) @@ plainto_tsquery('korean', :searchQuery${index})`
      )
      .join(" OR ");

    queryBuilder.andWhere(
      `(${searchConditions})`,
      fields.reduce(
        (params, _, index) => ({
          ...params,
          [`searchQuery${index}`]: searchQuery.trim(),
        }),
        {}
      )
    );

    return queryBuilder;
  }

  /**
   * 쿼리 실행 성능 모니터링
   */
  async executeWithMonitoring<T>(
    queryBuilder: SelectQueryBuilder<T>
  ): Promise<T[]> {
    const startTime = Date.now();
    const queryText = queryBuilder.getSql();

    try {
      const result = await queryBuilder.getMany();
      const executionTime = Date.now() - startTime;

      const metrics: QueryPerformanceMetrics = {
        executionTime,
        queryText,
        affectedRows: result.length,
        cacheHit: false, // 실제 캐시 히트 확인은 더 복잡한 로직 필요
        timestamp: new Date(),
      };

      this.recordPerformanceMetric(metrics);

      if (executionTime > 1000) {
        this.logger.warn(
          `Slow query detected: ${executionTime}ms - ${queryText.substring(
            0,
            100
          )}...`
        );
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Query execution failed after ${executionTime}ms: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * 쿼리 성능 메트릭 기록
   */
  private recordPerformanceMetric(metric: QueryPerformanceMetrics): void {
    this.performanceMetrics.push(metric);

    // 최대 1000개 메트릭만 메모리에 유지
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics.shift();
    }
  }

  /**
   * 성능 통계 조회
   */
  getPerformanceStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: QueryPerformanceMetrics[];
    recentQueries: QueryPerformanceMetrics[];
  } {
    const totalQueries = this.performanceMetrics.length;
    const averageExecutionTime =
      totalQueries > 0
        ? this.performanceMetrics.reduce(
            (sum, metric) => sum + metric.executionTime,
            0
          ) / totalQueries
        : 0;

    const slowQueries = this.performanceMetrics
      .filter((metric) => metric.executionTime > 500)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    const recentQueries = this.performanceMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalQueries,
      averageExecutionTime,
      slowQueries,
      recentQueries,
    };
  }

  /**
   * 인덱스 사용 현황 분석
   */
  async analyzeIndexUsage(tableName: string): Promise<any[]> {
    const query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch,
        idx_scan
      FROM pg_stat_user_indexes 
      WHERE tablename = $1
      ORDER BY idx_scan DESC;
    `;

    const result = await this.dataSource.query(query, [tableName]);
    return result;
  }

  /**
   * 쿼리 실행 계획 분석
   */
  async explainQuery(queryBuilder: SelectQueryBuilder<any>): Promise<any[]> {
    const sql = queryBuilder.getSql();
    const parameters = queryBuilder.getParameters();

    // 파라미터를 실제 값으로 치환
    let explainSql = sql;
    Object.entries(parameters).forEach(([key, value]) => {
      explainSql = explainSql.replace(
        new RegExp(`\\$${key}`, "g"),
        typeof value === "string" ? `'${value}'` : String(value)
      );
    });

    const result = await this.dataSource.query(`EXPLAIN ANALYZE ${explainSql}`);
    return result;
  }
}
