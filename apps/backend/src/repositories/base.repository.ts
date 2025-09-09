import {
  Repository,
  EntityTarget,
  FindOptionsWhere,
  FindOneOptions,
  FindManyOptions,
  SelectQueryBuilder,
  DeepPartial,
  SaveOptions,
  RemoveOptions,
  UpdateResult,
  DeleteResult,
  DataSource,
  QueryRunner,
  EntityManager,
} from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Logger } from "@nestjs/common";
import { QueryOptimizer, QueryOptimizationOptions } from "./query-optimizer";
import { TransactionManager, TransactionOptions } from "./transaction-manager";

/**
 * 페이징 옵션 인터페이스
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * 페이징 결과 인터페이스
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * 정렬 옵션 인터페이스
 */
export interface SortOptions {
  field: string;
  direction: "ASC" | "DESC";
}

/**
 * 필터링 옵션 인터페이스
 */
export interface FilterOptions {
  [key: string]: any;
}

/**
 * 검색 옵션 인터페이스
 */
export interface SearchOptions {
  query?: string;
  fields?: string[];
}

/**
 * 통계 결과 인터페이스
 */
export interface StatisticsResult {
  [key: string]: number | string | Date;
}

/**
 * Base Repository 클래스
 * 모든 Repository가 상속받는 기본 클래스로, 공통적인 CRUD 및 쿼리 기능 제공
 * 쿼리 최적화, 트랜잭션 관리, 성능 모니터링 기능 포함
 */
export abstract class BaseRepository<T> {
  protected repository: Repository<T>;
  protected dataSource: DataSource;
  protected entity: EntityTarget<T>;
  protected queryOptimizer: QueryOptimizer;
  protected transactionManager: TransactionManager;
  protected logger: Logger;

  constructor(dataSource: DataSource, entity: EntityTarget<T>) {
    this.dataSource = dataSource;
    this.entity = entity;
    this.repository = this.dataSource.getRepository(entity);
    this.queryOptimizer = new QueryOptimizer(dataSource);
    this.transactionManager = new TransactionManager(dataSource);
    this.logger = new Logger(`${entity.constructor?.name || "BaseRepository"}`);
  }

  /**
   * 단일 엔티티 생성
   * @param entityData 생성할 엔티티 데이터
   * @param options 저장 옵션
   * @returns 생성된 엔티티
   */
  async create(entityData: DeepPartial<T>, options?: SaveOptions): Promise<T> {
    try {
      const entity = this.repository.create(entityData);
      return await this.repository.save(entity, options);
    } catch (error) {
      throw new Error(`Failed to create entity: ${error.message}`);
    }
  }

  /**
   * 여러 엔티티 일괄 생성
   * @param entitiesData 생성할 엔티티들 데이터
   * @param options 저장 옵션
   * @returns 생성된 엔티티들
   */
  async createMany(
    entitiesData: DeepPartial<T>[],
    options?: SaveOptions
  ): Promise<T[]> {
    try {
      const entities = this.repository.create(entitiesData);
      return await this.repository.save(entities, options);
    } catch (error) {
      throw new Error(`Failed to create entities: ${error.message}`);
    }
  }

  /**
   * ID로 단일 엔티티 조회
   * @param id 엔티티 ID
   * @param options 조회 옵션
   * @returns 조회된 엔티티 또는 null
   */
  async findById(id: string, options?: FindOneOptions<T>): Promise<T | null> {
    try {
      return await this.repository.findOne({
        where: { id } as unknown as FindOptionsWhere<T>,
        ...options,
      });
    } catch (error) {
      throw new Error(`Failed to find entity by ID: ${error.message}`);
    }
  }

  /**
   * 조건으로 단일 엔티티 조회
   * @param where 조회 조건
   * @param options 조회 옵션
   * @returns 조회된 엔티티 또는 null
   */
  async findOne(
    where: FindOptionsWhere<T>,
    options?: FindOneOptions<T>
  ): Promise<T | null> {
    try {
      return await this.repository.findOne({
        where,
        ...options,
      });
    } catch (error) {
      throw new Error(`Failed to find entity: ${error.message}`);
    }
  }

  /**
   * 조건으로 여러 엔티티 조회
   * @param options 조회 옵션
   * @returns 조회된 엔티티들
   */
  async findMany(options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repository.find(options);
    } catch (error) {
      throw new Error(`Failed to find entities: ${error.message}`);
    }
  }

  /**
   * 조건으로 여러 엔티티와 총 개수 조회
   * @param options 조회 옵션
   * @returns [엔티티들, 총 개수]
   */
  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    try {
      return await this.repository.findAndCount(options);
    } catch (error) {
      throw new Error(`Failed to find and count entities: ${error.message}`);
    }
  }

  /**
   * 페이징된 엔티티 조회
   * @param paginationOptions 페이징 옵션
   * @param findOptions 조회 옵션
   * @returns 페이징 결과
   */
  async findWithPagination(
    paginationOptions: PaginationOptions,
    findOptions?: FindManyOptions<T>
  ): Promise<PaginationResult<T>> {
    try {
      const { page = 1, limit = 10, offset } = paginationOptions;
      const skip = offset ?? (page - 1) * limit;

      const [data, total] = await this.repository.findAndCount({
        ...findOptions,
        take: limit,
        skip,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      throw new Error(`Failed to paginate entities: ${error.message}`);
    }
  }

  /**
   * 전체 엔티티 개수 조회
   * @param where 조건
   * @returns 개수
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    try {
      return await this.repository.count({ where });
    } catch (error) {
      throw new Error(`Failed to count entities: ${error.message}`);
    }
  }

  /**
   * 엔티티 존재 여부 확인
   * @param where 조건
   * @returns 존재 여부
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    try {
      const count = await this.repository.count({ where });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to check entity existence: ${error.message}`);
    }
  }

  /**
   * 엔티티 업데이트
   * @param id 엔티티 ID
   * @param updateData 업데이트할 데이터
   * @returns 업데이트된 엔티티
   */
  async update(id: string, updateData: DeepPartial<T>): Promise<T | null> {
    try {
      await this.repository.update(id, updateData as QueryDeepPartialEntity<T>);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update entity: ${error.message}`);
    }
  }

  /**
   * 조건으로 엔티티 업데이트
   * @param where 조건
   * @param updateData 업데이트할 데이터
   * @returns 업데이트 결과
   */
  async updateMany(
    where: FindOptionsWhere<T>,
    updateData: DeepPartial<T>
  ): Promise<UpdateResult> {
    try {
      return await this.repository.update(
        where,
        updateData as QueryDeepPartialEntity<T>
      );
    } catch (error) {
      throw new Error(`Failed to update entities: ${error.message}`);
    }
  }

  /**
   * 엔티티 업서트 (있으면 업데이트, 없으면 생성)
   * @param where 조건
   * @param updateData 업데이트할 데이터
   * @param createData 생성할 데이터 (선택사항)
   * @returns 업서트된 엔티티
   */
  async upsert(
    where: FindOptionsWhere<T>,
    updateData: DeepPartial<T>,
    createData?: DeepPartial<T>
  ): Promise<T> {
    try {
      let entity = await this.findOne(where);

      if (entity) {
        // 업데이트
        Object.assign(entity, updateData);
        return await this.repository.save(entity);
      } else {
        // 생성
        const newEntityData = createData || { ...where, ...updateData };
        return await this.create(newEntityData);
      }
    } catch (error) {
      throw new Error(`Failed to upsert entity: ${error.message}`);
    }
  }

  /**
   * 단일 엔티티 삭제
   * @param id 엔티티 ID
   * @returns 삭제 결과
   */
  async delete(id: string): Promise<DeleteResult> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete entity: ${error.message}`);
    }
  }

  /**
   * 여러 엔티티 삭제
   * @param ids 엔티티 ID들
   * @returns 삭제 결과
   */
  async deleteMany(ids: string[]): Promise<DeleteResult> {
    try {
      return await this.repository.delete(ids);
    } catch (error) {
      throw new Error(`Failed to delete entities: ${error.message}`);
    }
  }

  /**
   * 조건으로 엔티티 삭제
   * @param where 삭제 조건
   * @returns 삭제 결과
   */
  async deleteWhere(where: FindOptionsWhere<T>): Promise<DeleteResult> {
    try {
      return await this.repository.delete(where);
    } catch (error) {
      throw new Error(
        `Failed to delete entities by condition: ${error.message}`
      );
    }
  }

  /**
   * 엔티티 soft delete
   * @param id 엔티티 ID
   * @param options 삭제 옵션
   * @returns 삭제된 엔티티
   */
  async softDelete(id: string, options?: RemoveOptions): Promise<T | null> {
    try {
      const entity = await this.findById(id);
      if (!entity) return null;

      return await this.repository.softRemove(entity, options);
    } catch (error) {
      throw new Error(`Failed to soft delete entity: ${error.message}`);
    }
  }

  /**
   * 엔티티 복원
   * @param id 엔티티 ID
   * @returns 복원 결과
   */
  async restore(id: string): Promise<UpdateResult> {
    try {
      return await this.repository.restore(id);
    } catch (error) {
      throw new Error(`Failed to restore entity: ${error.message}`);
    }
  }

  /**
   * QueryBuilder 생성
   * @param alias 테이블 별명
   * @returns QueryBuilder
   */
  createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  /**
   * 트랜잭션 실행
   * @param operation 트랜잭션 내에서 실행할 작업
   * @returns 작업 결과
   */
  async runInTransaction<R>(
    operation: (queryRunner: QueryRunner) => Promise<R>
  ): Promise<R> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Transaction failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 벌크 삽입 (성능 최적화)
   * @param entities 삽입할 엔티티들
   * @param chunkSize 청크 크기 (기본: 1000)
   * @returns 삽입 결과들
   */
  async bulkInsert(entities: DeepPartial<T>[], chunkSize = 1000): Promise<T[]> {
    const results: T[] = [];

    try {
      for (let i = 0; i < entities.length; i += chunkSize) {
        const chunk = entities.slice(i, i + chunkSize);
        const savedEntities = await this.createMany(chunk);
        results.push(...savedEntities);
      }

      return results;
    } catch (error) {
      throw new Error(`Bulk insert failed: ${error.message}`);
    }
  }

  /**
   * 통계 쿼리 실행
   * @param field 집계할 필드
   * @param where 조건
   * @returns 통계 결과
   */
  async getStatistics(
    field: string,
    where?: FindOptionsWhere<T>
  ): Promise<StatisticsResult> {
    try {
      const queryBuilder = this.createQueryBuilder("entity");

      if (where) {
        queryBuilder.where(where);
      }

      const result = await queryBuilder
        .select(`COUNT(entity.${field})`, "count")
        .addSelect(`AVG(entity.${field})`, "average")
        .addSelect(`MIN(entity.${field})`, "minimum")
        .addSelect(`MAX(entity.${field})`, "maximum")
        .addSelect(`SUM(entity.${field})`, "sum")
        .getRawOne();

      return {
        count: parseInt(result.count) || 0,
        average: parseFloat(result.average) || 0,
        minimum: parseFloat(result.minimum) || 0,
        maximum: parseFloat(result.maximum) || 0,
        sum: parseFloat(result.sum) || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * 원시 Repository 반환 (고급 기능용)
   * @returns TypeORM Repository 인스턴스
   */
  getRepository(): Repository<T> {
    return this.repository;
  }

  /**
   * DataSource 반환
   * @returns TypeORM DataSource 인스턴스
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }

  // ===== 최적화된 쿼리 메서드 =====

  /**
   * 최적화된 쿼리 빌더 생성
   */
  createOptimizedQueryBuilder(
    alias: string,
    options?: QueryOptimizationOptions
  ): SelectQueryBuilder<T> {
    return this.queryOptimizer.createOptimizedQueryBuilder(
      this.entity,
      alias,
      options
    );
  }

  /**
   * 최적화된 검색 쿼리 (전문 검색 지원)
   */
  async searchOptimized(
    searchQuery: string,
    searchFields: string[],
    filters?: Record<string, any>,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<T>> {
    try {
      const queryBuilder = this.createOptimizedQueryBuilder("entity", {
        enableQueryCache: true,
        preventN1Problems: true,
      });

      // 전문 검색 적용
      if (searchQuery?.trim()) {
        this.queryOptimizer.addFullTextSearch(
          queryBuilder,
          searchFields,
          searchQuery
        );
      }

      // 추가 필터 적용
      if (filters) {
        this.queryOptimizer.addConditionalWhere(queryBuilder, filters);
      }

      // 페이징 처리
      if (paginationOptions) {
        const { page = 1, limit = 10 } = paginationOptions;
        this.queryOptimizer.optimizePagination(queryBuilder, page, limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        return {
          data,
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        };
      } else {
        const data = await this.queryOptimizer.executeWithMonitoring(
          queryBuilder
        );
        return {
          data,
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
    } catch (error) {
      throw new Error(`Optimized search failed: ${error.message}`);
    }
  }

  /**
   * 날짜 범위로 엔티티 검색 (최적화됨)
   */
  async findByDateRange(
    dateField: string,
    startDate?: Date,
    endDate?: Date,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<T>> {
    try {
      const queryBuilder = this.createOptimizedQueryBuilder("entity", {
        enableQueryCache: true,
      });

      this.queryOptimizer.addDateRangeFilter(
        queryBuilder,
        dateField,
        startDate,
        endDate
      );

      if (paginationOptions) {
        const { page = 1, limit = 10 } = paginationOptions;
        this.queryOptimizer.optimizePagination(queryBuilder, page, limit);
      }

      const [data, total] = await queryBuilder.getManyAndCount();
      const page = paginationOptions?.page || 1;
      const limit = paginationOptions?.limit || data.length;
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      throw new Error(`Date range search failed: ${error.message}`);
    }
  }

  // ===== 트랜잭션 메서드 =====

  /**
   * 트랜잭션 내에서 작업 실행
   */
  async executeInTransaction<R>(
    operation: (manager: EntityManager) => Promise<R>,
    options?: TransactionOptions
  ): Promise<R> {
    return this.transactionManager.executeTransaction(operation, options);
  }

  /**
   * 배치 작업을 트랜잭션으로 실행
   */
  async executeBatchInTransaction<R>(
    operations: ((manager: EntityManager) => Promise<R>)[],
    options?: TransactionOptions
  ): Promise<R[]> {
    return this.transactionManager.executeBatchTransaction(operations, options);
  }

  /**
   * 낙관적 잠금을 사용한 업데이트
   */
  async updateWithOptimisticLock(
    id: string,
    updateOperation: (entity: T, manager: EntityManager) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    return this.transactionManager.executeWithOptimisticLocking(
      this.entity,
      id,
      updateOperation,
      maxRetries
    );
  }

  /**
   * 비관적 잠금을 사용한 업데이트
   */
  async updateWithPessimisticLock(
    id: string,
    updateOperation: (entity: T, manager: EntityManager) => Promise<T>,
    lockMode: "pessimistic_read" | "pessimistic_write" = "pessimistic_write"
  ): Promise<T> {
    return this.transactionManager.executeWithPessimisticLocking(
      this.entity,
      id,
      updateOperation,
      lockMode
    );
  }

  /**
   * 대량 작업 처리 (청크 단위)
   */
  async executeBulkOperationInChunks<R>(
    items: R[],
    operation: (chunk: R[], manager: EntityManager) => Promise<void>,
    chunkSize = 1000,
    options?: TransactionOptions
  ): Promise<void> {
    return this.transactionManager.executeBulkOperation(
      items,
      operation,
      chunkSize,
      options
    );
  }

  /**
   * 읽기 전용 트랜잭션 실행
   */
  async executeReadOnlyTransaction<R>(
    operation: (manager: EntityManager) => Promise<R>
  ): Promise<R> {
    return this.transactionManager.executeReadOnlyTransaction(operation);
  }

  // ===== 성능 모니터링 메서드 =====

  /**
   * 쿼리 성능 통계 조회
   */
  getQueryPerformanceStats() {
    return this.queryOptimizer.getPerformanceStats();
  }

  /**
   * 인덱스 사용 현황 분석
   */
  async analyzeIndexUsage(): Promise<any[]> {
    const tableName = this.repository.metadata.tableName;
    return this.queryOptimizer.analyzeIndexUsage(tableName);
  }

  /**
   * 쿼리 실행 계획 분석
   */
  async explainQuery(queryBuilder: SelectQueryBuilder<T>): Promise<any[]> {
    return this.queryOptimizer.explainQuery(queryBuilder);
  }

  /**
   * 활성 트랜잭션 모니터링
   */
  getActiveTransactions() {
    return this.transactionManager.getActiveTransactions();
  }

  /**
   * 장기 실행 트랜잭션 감지
   */
  getLongRunningTransactions(thresholdMinutes = 5) {
    return this.transactionManager.getLongRunningTransactions(thresholdMinutes);
  }

  // ===== 헬퍼 메서드 =====

  /**
   * 캐시된 쿼리 실행
   */
  async findWithCache(
    options: FindManyOptions<T>,
    cacheTimeout = 300000
  ): Promise<T[]> {
    const queryBuilder = this.repository
      .createQueryBuilder("entity")
      .cache(cacheTimeout);

    if (options.where) {
      this.queryOptimizer.addConditionalWhere(
        queryBuilder,
        options.where as Record<string, any>
      );
    }

    if (options.order) {
      Object.entries(options.order).forEach(([field, direction]) => {
        queryBuilder.orderBy(`entity.${field}`, direction as "ASC" | "DESC");
      });
    }

    if (options.take) {
      queryBuilder.take(options.take);
    }

    if (options.skip) {
      queryBuilder.skip(options.skip);
    }

    return this.queryOptimizer.executeWithMonitoring(queryBuilder);
  }

  /**
   * 관계 엔티티를 포함한 최적화된 조회
   */
  async findWithOptimizedRelations(
    where: FindOptionsWhere<T>,
    relations: string[],
    options?: FindOneOptions<T>
  ): Promise<T | null> {
    const queryBuilder = this.createOptimizedQueryBuilder("entity", {
      enableQueryCache: true,
      preventN1Problems: true,
    });

    this.queryOptimizer.addConditionalWhere(
      queryBuilder,
      where as Record<string, any>
    );
    this.queryOptimizer.optimizeRelationLoading(queryBuilder, relations);

    if (options?.order) {
      Object.entries(options.order).forEach(([field, direction]) => {
        queryBuilder.orderBy(`entity.${field}`, direction as "ASC" | "DESC");
      });
    }

    return queryBuilder.getOne();
  }
}
