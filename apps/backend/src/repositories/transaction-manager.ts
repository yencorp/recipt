import { DataSource, QueryRunner, EntityManager, EntityTarget } from "typeorm";
import { Logger, Injectable } from "@nestjs/common";

/**
 * 트랜잭션 옵션
 */
export interface TransactionOptions {
  isolationLevel?:
    | "READ UNCOMMITTED"
    | "READ COMMITTED"
    | "REPEATABLE READ"
    | "SERIALIZABLE";
  timeout?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
  onRollback?: (error: Error) => Promise<void> | void;
  onCommit?: () => Promise<void> | void;
}

/**
 * 트랜잭션 컨텍스트
 */
export interface TransactionContext {
  queryRunner: QueryRunner;
  manager: EntityManager;
  isActive: boolean;
  startTime: Date;
  operations: TransactionOperation[];
}

/**
 * 트랜잭션 작업 기록
 */
export interface TransactionOperation {
  type: "INSERT" | "UPDATE" | "DELETE" | "SELECT";
  entity: string;
  data?: any;
  timestamp: Date;
}

/**
 * 사가 패턴을 위한 보상 작업 인터페이스
 */
export interface CompensationAction {
  execute(context: TransactionContext): Promise<void>;
  description: string;
}

/**
 * 분산 트랜잭션 관리자
 * ACID 속성 보장, 사가 패턴 구현, 중첩 트랜잭션 지원
 */
@Injectable()
export class TransactionManager {
  private readonly logger = new Logger(TransactionManager.name);
  private readonly activeTransactions = new Map<string, TransactionContext>();

  constructor(private readonly dataSource: DataSource) {}

  /**
   * 단일 트랜잭션 실행
   */
  async executeTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    const transactionId = this.generateTransactionId();

    await queryRunner.connect();

    const context: TransactionContext = {
      queryRunner,
      manager: queryRunner.manager,
      isActive: true,
      startTime: new Date(),
      operations: [],
    };

    this.activeTransactions.set(transactionId, context);

    try {
      // 격리 수준 설정
      if (options.isolationLevel) {
        await queryRunner.query(
          `SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`
        );
      }

      await queryRunner.startTransaction();

      // 타임아웃 설정
      if (options.timeout) {
        global.setTimeout(() => {
          if (context.isActive) {
            queryRunner
              .rollbackTransaction()
              .catch((err) =>
                this.logger.error(
                  `Transaction timeout rollback failed: ${err.message}`
                )
              );
          }
        }, options.timeout);
      }

      const result = await operation(queryRunner.manager);

      await queryRunner.commitTransaction();

      if (options.onCommit) {
        await options.onCommit();
      }

      context.isActive = false;
      this.logTransactionSuccess(transactionId, context);

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (options.onRollback) {
        await options.onRollback(error);
      }

      context.isActive = false;
      this.logTransactionError(transactionId, context, error);

      // 재시도 로직
      if (options.retryAttempts && options.retryAttempts > 0) {
        this.logger.warn(
          `Transaction failed, retrying... (${options.retryAttempts} attempts left)`
        );
        await this.delay(options.retryDelay || 1000);

        return this.executeTransaction(operation, {
          ...options,
          retryAttempts: options.retryAttempts - 1,
        });
      }

      throw error;
    } finally {
      await queryRunner.release();
      this.activeTransactions.delete(transactionId);
    }
  }

  /**
   * 배치 작업 트랜잭션 (여러 작업을 하나의 트랜잭션으로)
   */
  async executeBatchTransaction<T>(
    operations: ((manager: EntityManager) => Promise<T>)[],
    options: TransactionOptions = {}
  ): Promise<T[]> {
    return this.executeTransaction(async (manager) => {
      const results: T[] = [];

      for (const operation of operations) {
        const result = await operation(manager);
        results.push(result);
      }

      return results;
    }, options);
  }

  /**
   * 사가 패턴 구현 (분산 트랜잭션)
   */
  async executeSaga<T>(
    operations: ((manager: EntityManager) => Promise<T>)[],
    compensations: CompensationAction[],
    options: TransactionOptions = {}
  ): Promise<T[]> {
    const results: T[] = [];
    const executedCompensations: CompensationAction[] = [];

    try {
      return await this.executeTransaction(async (manager) => {
        for (let i = 0; i < operations.length; i++) {
          const operation = operations[i];
          const compensation = compensations[i];

          try {
            const result = await operation(manager);
            results.push(result);

            if (compensation) {
              executedCompensations.push(compensation);
            }
          } catch (error) {
            // 실패한 작업의 보상 작업 실행
            await this.executeCompensations(executedCompensations.reverse(), {
              queryRunner: null,
              manager,
              isActive: true,
              startTime: new Date(),
              operations: [],
            });
            throw error;
          }
        }

        return results;
      }, options);
    } catch (error) {
      this.logger.error(`Saga transaction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 중첩 트랜잭션 지원 (세이브포인트 사용)
   */
  async executeNestedTransaction<T>(
    parentManager: EntityManager,
    operation: (manager: EntityManager) => Promise<T>,
    savepointName?: string
  ): Promise<T> {
    const savepoint = savepointName || `sp_${Date.now()}`;
    const queryRunner = parentManager.queryRunner;

    if (!queryRunner) {
      throw new Error(
        "Parent transaction context is required for nested transactions"
      );
    }

    try {
      await queryRunner.query(`SAVEPOINT ${savepoint}`);

      const result = await operation(parentManager);

      await queryRunner.query(`RELEASE SAVEPOINT ${savepoint}`);

      return result;
    } catch (error) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      throw error;
    }
  }

  /**
   * 읽기 전용 트랜잭션
   */
  async executeReadOnlyTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>
  ): Promise<T> {
    return this.executeTransaction(async (manager) => {
      await manager.queryRunner?.query("SET TRANSACTION READ ONLY");
      return operation(manager);
    });
  }

  /**
   * 낙관적 잠금 처리
   */
  async executeWithOptimisticLocking<T>(
    entity: EntityTarget<T>,
    id: string,
    operation: (entity: T, manager: EntityManager) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.executeTransaction(async (manager) => {
          const repository = manager.getRepository(entity);
          const currentEntity = await repository.findOne({
            where: { id } as any,
            lock: { mode: "optimistic", version: undefined },
          });

          if (!currentEntity) {
            throw new Error(`Entity with id ${id} not found`);
          }

          return await operation(currentEntity, manager);
        });
      } catch (error) {
        if (
          error.message.includes("OptimisticLockVersionMismatch") &&
          attempt < maxRetries - 1
        ) {
          attempt++;
          this.logger.warn(
            `Optimistic lock conflict, retrying... (attempt ${attempt})`
          );
          await this.delay(100 * attempt); // 백오프
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      `Failed to execute operation with optimistic locking after ${maxRetries} attempts`
    );
  }

  /**
   * 비관적 잠금 처리
   */
  async executeWithPessimisticLocking<T>(
    entity: EntityTarget<T>,
    id: string,
    operation: (entity: T, manager: EntityManager) => Promise<T>,
    lockMode: "pessimistic_read" | "pessimistic_write" = "pessimistic_write"
  ): Promise<T> {
    return this.executeTransaction(async (manager) => {
      const repository = manager.getRepository(entity);
      const lockedEntity = await repository.findOne({
        where: { id } as any,
        lock: { mode: lockMode },
      });

      if (!lockedEntity) {
        throw new Error(`Entity with id ${id} not found`);
      }

      return await operation(lockedEntity, manager);
    });
  }

  /**
   * 대량 작업 트랜잭션 (청크 단위 처리)
   */
  async executeBulkOperation<T>(
    items: T[],
    operation: (chunk: T[], manager: EntityManager) => Promise<void>,
    chunkSize = 1000,
    options: TransactionOptions = {}
  ): Promise<void> {
    const chunks = this.chunkArray(items, chunkSize);

    for (const chunk of chunks) {
      await this.executeTransaction(async (manager) => {
        await operation(chunk, manager);
      }, options);
    }
  }

  /**
   * 트랜잭션 상태 모니터링
   */
  getActiveTransactions(): Map<string, TransactionContext> {
    return new Map(this.activeTransactions);
  }

  /**
   * 장기 실행 트랜잭션 모니터링
   */
  getLongRunningTransactions(thresholdMinutes = 5): TransactionContext[] {
    const threshold = Date.now() - thresholdMinutes * 60 * 1000;

    return Array.from(this.activeTransactions.values()).filter(
      (context) => context.startTime.getTime() < threshold
    );
  }

  /**
   * 보상 작업 실행
   */
  private async executeCompensations(
    compensations: CompensationAction[],
    context: TransactionContext
  ): Promise<void> {
    for (const compensation of compensations) {
      try {
        this.logger.log(`Executing compensation: ${compensation.description}`);
        await compensation.execute(context);
      } catch (error) {
        this.logger.error(
          `Compensation failed: ${compensation.description} - ${error.message}`
        );
        // 보상 작업 실패는 로그만 남기고 계속 진행
      }
    }
  }

  /**
   * 배열을 청크로 분할
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => global.setTimeout(resolve, ms));
  }

  /**
   * 트랜잭션 ID 생성
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 트랜잭션 성공 로그
   */
  private logTransactionSuccess(
    transactionId: string,
    context: TransactionContext
  ): void {
    const duration = Date.now() - context.startTime.getTime();
    this.logger.log(
      `Transaction completed successfully: ${transactionId} (${duration}ms, ${context.operations.length} operations)`
    );
  }

  /**
   * 트랜잭션 오류 로그
   */
  private logTransactionError(
    transactionId: string,
    context: TransactionContext,
    error: Error
  ): void {
    const duration = Date.now() - context.startTime.getTime();
    this.logger.error(
      `Transaction failed: ${transactionId} (${duration}ms, ${context.operations.length} operations) - ${error.message}`
    );
  }
}
