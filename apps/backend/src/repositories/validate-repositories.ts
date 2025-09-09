import * as fs from "fs";
import * as path from "path";

// Import repositories for validation
import { UserRepository } from "./user.repository";
import { EventRepository } from "./event.repository";
import { BudgetRepository } from "./budget.repository";
import { QueryOptimizer } from "./query-optimizer";
import { TransactionManager } from "./transaction-manager";

/**
 * Repository 패턴 유효성 검사 및 일관성 검증 스크립트
 */
class RepositoryValidator {
  private issues: string[] = [];
  private warnings: string[] = [];

  /**
   * 전체 검증 프로세스 실행
   */
  async validateAll(): Promise<void> {
    console.log("🔍 Repository 패턴 유효성 검사 시작...\n");

    await this.validateFileStructure();
    await this.validateImportsExports();
    await this.validateRepositoryInheritance();
    await this.validateMethodConsistency();
    await this.validateTypeDefinitions();
    await this.validateUtilityClasses();

    this.printResults();
  }

  /**
   * 파일 구조 검증
   */
  private async validateFileStructure(): Promise<void> {
    console.log("📁 파일 구조 검증 중...");

    const requiredFiles = [
      "base.repository.ts",
      "user.repository.ts",
      "event.repository.ts",
      "budget.repository.ts",
      "query-optimizer.ts",
      "transaction-manager.ts",
      "index.ts",
    ];

    const repositoryDir = __dirname;

    for (const file of requiredFiles) {
      const filePath = path.join(repositoryDir, file);
      if (!fs.existsSync(filePath)) {
        this.issues.push(`❌ 필수 파일이 누락됨: ${file}`);
      } else {
        console.log(`  ✅ ${file}`);
      }
    }

    // 테스트 파일 확인
    const testFile = path.join(repositoryDir, "repository.integration-test.ts");
    if (fs.existsSync(testFile)) {
      console.log(`  ✅ repository.integration-test.ts`);
    } else {
      this.warnings.push(
        `⚠️  통합 테스트 파일이 없음: repository.integration-test.ts`
      );
    }

    console.log("");
  }

  /**
   * Import/Export 검증
   */
  private async validateImportsExports(): Promise<void> {
    console.log("📦 Import/Export 검증 중...");

    try {
      // index.ts에서 모든 클래스가 제대로 export되는지 확인
      const indexModule = await import("./index");

      const requiredExports = [
        "BaseRepository",
        "UserRepository",
        "EventRepository",
        "BudgetRepository",
        "QueryOptimizer",
        "TransactionManager",
      ];

      for (const exportName of requiredExports) {
        if (indexModule[exportName]) {
          console.log(`  ✅ ${exportName} export 확인`);
        } else {
          this.issues.push(`❌ ${exportName}이 index.ts에서 export되지 않음`);
        }
      }

      // 런타임에서는 타입 확인이 제한적이므로 경고만 표시
      this.warnings.push("⚠️  타입 정의는 컴파일 타임에 확인 필요");
    } catch (error) {
      this.issues.push(`❌ Import/Export 검증 실패: ${error.message}`);
    }

    console.log("");
  }

  /**
   * Repository 상속 관계 검증
   */
  private async validateRepositoryInheritance(): Promise<void> {
    console.log("🏗️  Repository 상속 관계 검증 중...");

    try {
      // DataSource mock 생성 (실제 DB 연결 없이 검증)
      const mockDataSource = {
        getRepository: () => ({
          createQueryBuilder: () => ({}),
          metadata: { tableName: "test_table" },
        }),
      } as any;

      // 각 Repository가 BaseRepository를 상속받는지 확인
      const repositories = [
        { name: "UserRepository", class: UserRepository },
        { name: "EventRepository", class: EventRepository },
        { name: "BudgetRepository", class: BudgetRepository },
      ];

      for (const { name, class: RepoClass } of repositories) {
        try {
          const instance = new RepoClass(mockDataSource);

          // BaseRepository의 주요 메서드들이 있는지 확인
          const requiredMethods = [
            "create",
            "createMany",
            "findById",
            "findOne",
            "findMany",
            "update",
            "delete",
            "executeInTransaction",
            "createOptimizedQueryBuilder",
          ];

          for (const method of requiredMethods) {
            if (typeof instance[method] === "function") {
              console.log(`  ✅ ${name}.${method}() 메서드 확인`);
            } else {
              this.issues.push(`❌ ${name}에서 ${method} 메서드가 누락됨`);
            }
          }
        } catch (error) {
          this.issues.push(`❌ ${name} 인스턴스 생성 실패: ${error.message}`);
        }
      }
    } catch (error) {
      this.issues.push(`❌ Repository 상속 관계 검증 실패: ${error.message}`);
    }

    console.log("");
  }

  /**
   * 메서드 일관성 검증
   */
  private async validateMethodConsistency(): Promise<void> {
    console.log("🔧 메서드 일관성 검증 중...");

    try {
      const mockDataSource = {
        getRepository: () => ({
          createQueryBuilder: () => ({}),
          metadata: { tableName: "test_table" },
        }),
        createQueryRunner: () => ({
          connect: async () => {},
          startTransaction: async () => {},
          commitTransaction: async () => {},
          rollbackTransaction: async () => {},
          release: async () => {},
        }),
      } as any;

      const userRepo = new UserRepository(mockDataSource);
      const eventRepo = new EventRepository(mockDataSource);
      const budgetRepo = new BudgetRepository(mockDataSource);

      // 공통 인터페이스 확인
      const commonMethods = [
        "searchOptimized",
        "findByDateRange",
        "executeInTransaction",
        "getQueryPerformanceStats",
        "analyzeIndexUsage",
      ];

      for (const method of commonMethods) {
        const userHas = typeof userRepo[method] === "function";
        const eventHas = typeof eventRepo[method] === "function";
        const budgetHas = typeof budgetRepo[method] === "function";

        if (userHas && eventHas && budgetHas) {
          console.log(`  ✅ ${method}() 메서드가 모든 Repository에 존재`);
        } else {
          this.issues.push(`❌ ${method} 메서드 일관성 문제`);
        }
      }

      // 전용 메서드 확인
      if (typeof userRepo.findByEmail === "function") {
        console.log(`  ✅ UserRepository 전용 메서드 확인`);
      }

      if (typeof eventRepo.findUpcomingEvents === "function") {
        console.log(`  ✅ EventRepository 전용 메서드 확인`);
      }

      if (typeof budgetRepo.getBudgetExecutionTrend === "function") {
        console.log(`  ✅ BudgetRepository 전용 메서드 확인`);
      }
    } catch (error) {
      this.issues.push(`❌ 메서드 일관성 검증 실패: ${error.message}`);
    }

    console.log("");
  }

  /**
   * 타입 정의 검증
   */
  private async validateTypeDefinitions(): Promise<void> {
    console.log("📝 타입 정의 검증 중...");

    // 파일 내용을 읽어서 중요한 타입 정의가 있는지 확인
    const filesToCheck = [
      {
        file: "base.repository.ts",
        types: ["PaginationOptions", "PaginationResult"],
      },
      {
        file: "query-optimizer.ts",
        types: ["QueryOptimizationOptions", "QueryPerformanceMetrics"],
      },
      {
        file: "transaction-manager.ts",
        types: ["TransactionOptions", "TransactionContext"],
      },
    ];

    for (const { file, types } of filesToCheck) {
      try {
        const filePath = path.join(__dirname, file);
        const content = fs.readFileSync(filePath, "utf-8");

        for (const type of types) {
          if (
            content.includes(`interface ${type}`) ||
            content.includes(`type ${type}`)
          ) {
            console.log(`  ✅ ${file}에서 ${type} 타입 정의 확인`);
          } else {
            this.issues.push(`❌ ${file}에서 ${type} 타입 정의가 없음`);
          }
        }
      } catch (error) {
        this.issues.push(`❌ ${file} 파일 읽기 실패: ${error.message}`);
      }
    }

    console.log("");
  }

  /**
   * 유틸리티 클래스 검증
   */
  private async validateUtilityClasses(): Promise<void> {
    console.log("🛠️  유틸리티 클래스 검증 중...");

    try {
      const mockDataSource = {
        getRepository: () => ({}),
        createQueryRunner: () => ({}),
      } as any;

      // QueryOptimizer 검증
      const queryOptimizer = new QueryOptimizer(mockDataSource);
      const optimizerMethods = [
        "createOptimizedQueryBuilder",
        "addFullTextSearch",
        "addDateRangeFilter",
        "getPerformanceStats",
      ];

      for (const method of optimizerMethods) {
        if (typeof queryOptimizer[method] === "function") {
          console.log(`  ✅ QueryOptimizer.${method}() 메서드 확인`);
        } else {
          this.issues.push(`❌ QueryOptimizer에서 ${method} 메서드가 누락됨`);
        }
      }

      // TransactionManager 검증
      const transactionManager = new TransactionManager(mockDataSource);
      const transactionMethods = [
        "executeTransaction",
        "executeBatchTransaction",
        "executeWithOptimisticLocking",
        "executeWithPessimisticLocking",
      ];

      for (const method of transactionMethods) {
        if (typeof transactionManager[method] === "function") {
          console.log(`  ✅ TransactionManager.${method}() 메서드 확인`);
        } else {
          this.issues.push(
            `❌ TransactionManager에서 ${method} 메서드가 누락됨`
          );
        }
      }
    } catch (error) {
      this.issues.push(`❌ 유틸리티 클래스 검증 실패: ${error.message}`);
    }

    console.log("");
  }

  /**
   * 검증 결과 출력
   */
  private printResults(): void {
    console.log("📊 검증 결과:");
    console.log("=".repeat(50));

    if (this.issues.length === 0) {
      console.log("🎉 모든 검증을 통과했습니다!");
    } else {
      console.log(`❌ ${this.issues.length}개의 문제가 발견되었습니다:`);
      this.issues.forEach((issue) => console.log(`  ${issue}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length}개의 경고사항:`);
      this.warnings.forEach((warning) => console.log(`  ${warning}`));
    }

    console.log("\n" + "=".repeat(50));

    if (this.issues.length === 0) {
      console.log("✅ Repository 패턴이 올바르게 구현되었습니다.");
      process.exit(0);
    } else {
      console.log("❌ 위 문제들을 해결한 후 다시 시도해주세요.");
      process.exit(1);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const validator = new RepositoryValidator();
  validator.validateAll().catch((error) => {
    console.error("❌ 검증 중 오류가 발생했습니다:", error.message);
    process.exit(1);
  });
}

export { RepositoryValidator };
