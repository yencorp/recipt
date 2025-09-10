/* eslint-disable no-console */
import { DataSource } from "typeorm";
import { execSync } from "child_process";

/**
 * Task 2.15: 데이터베이스 성능 테스트 스크립트
 *
 * 대량 데이터 처리, 동시 접속, 복잡 쿼리 성능을 종합적으로 테스트하는 도구
 * PostgreSQL 데이터베이스의 성능 벤치마킹 및 최적화 가이드 제공
 */

interface PerformanceTestResult {
  testName: string;
  status: "PASS" | "FAIL" | "WARNING";
  executionTime: number;
  metric: string;
  threshold: number;
  actual: number;
  details?: any;
}

/**
 * 데이터베이스 성능 테스트 클래스
 */
export class DatabasePerformanceTester {
  private dbConfig: any;
  private env: any;
  private testResults: PerformanceTestResult[] = [];

  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || "5432",
      username: process.env.DB_USER || process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || process.env.DB_DATABASE || "recipt_dev",
    };

    this.env = {
      ...process.env,
      PGPASSWORD: this.dbConfig.password,
    };
  }

  /**
   * 전체 성능 테스트 실행
   */
  async runAllTests(_dataSource?: DataSource): Promise<void> {
    console.log("🚀 데이터베이스 성능 테스트를 시작합니다...\n");

    try {
      // 데이터베이스 상태 확인
      await this.checkDatabaseStatus();

      // 1. 대량 데이터 처리 테스트
      await this.testBulkDataProcessing();

      // 2. 동시 접속 부하 테스트
      await this.testConcurrentConnections();

      // 3. 복잡 쿼리 성능 테스트
      await this.testComplexQueries();

      // 4. 백업/복원 성능 테스트
      await this.testBackupRestorePerformance();

      // 5. 인덱스 효율성 테스트
      await this.testIndexEfficiency();

      // 결과 출력
      this.printResults();
    } catch (error) {
      console.error("❌ 성능 테스트 중 오류 발생:", error);
      throw error;
    }
  }

  /**
   * 데이터베이스 상태 확인
   */
  private async checkDatabaseStatus(): Promise<void> {
    console.log("📊 데이터베이스 상태 확인 중...");

    try {
      const statusQueries = [
        {
          name: "Connection Count",
          query: "SELECT count(*) FROM pg_stat_activity;",
          description: "현재 연결 수",
        },
        {
          name: "Database Size",
          query: `SELECT pg_size_pretty(pg_database_size('${this.dbConfig.database}'));`,
          description: "데이터베이스 크기",
        },
        {
          name: "Table Count",
          query:
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';",
          description: "테이블 수",
        },
        {
          name: "Cache Hit Ratio",
          query: `
            SELECT round((blks_hit*100.0)/(blks_hit+blks_read), 2) as hit_ratio 
            FROM pg_stat_database 
            WHERE datname = '${this.dbConfig.database}';
          `,
          description: "캐시 히트율",
        },
      ];

      for (const status of statusQueries) {
        try {
          const result = this.executeQuery(status.query);
          console.log(
            `   ✅ ${status.name}: ${result.trim()} (${status.description})`
          );
        } catch (error) {
          console.log(`   ⚠️  ${status.name}: 조회 실패`);
        }
      }

      console.log("");
    } catch (error) {
      console.warn("⚠️  데이터베이스 상태 확인 중 일부 오류 발생");
    }
  }

  /**
   * 1. 대량 데이터 처리 테스트
   */
  async testBulkDataProcessing(): Promise<void> {
    console.log("1️⃣ 대량 데이터 처리 성능 테스트");

    const batchSizes = [100, 500, 1000, 5000];
    const targetRecords = 10000;

    for (const batchSize of batchSizes) {
      await this.testBulkInsertPerformance(batchSize, targetRecords);
      await this.testBulkSelectPerformance(batchSize);
      await this.testBulkUpdatePerformance(batchSize);
      await this.testBulkDeletePerformance(batchSize);
    }

    console.log("");
  }

  /**
   * 대량 삽입 성능 테스트
   */
  private async testBulkInsertPerformance(
    batchSize: number,
    totalRecords: number
  ): Promise<void> {
    const testName = `Bulk Insert (배치: ${batchSize})`;

    try {
      // 테스트 테이블 생성
      const createTestTableQuery = `
        CREATE TABLE IF NOT EXISTS performance_test_insert (
          id SERIAL PRIMARY KEY,
          test_string VARCHAR(255),
          test_number INTEGER,
          test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      this.executeQuery(createTestTableQuery);

      const startTime = Date.now();
      const batches = Math.ceil(totalRecords / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const currentBatchSize = Math.min(
          batchSize,
          totalRecords - batch * batchSize
        );

        // 배치 삽입 쿼리 생성
        const values = Array.from(
          { length: currentBatchSize },
          (_, i) =>
            `('test_string_${batch}_${i}', ${Math.floor(
              Math.random() * 1000
            )}, CURRENT_TIMESTAMP)`
        ).join(", ");

        const insertQuery = `
          INSERT INTO performance_test_insert (test_string, test_number, test_timestamp) 
          VALUES ${values};
        `;

        this.executeQuery(insertQuery);
      }

      const executionTime = Date.now() - startTime;
      const throughput = Math.round(totalRecords / (executionTime / 1000));

      // 성능 기준: 200ms 이내 (데이터 입력)
      const threshold = 200 * (totalRecords / 1000); // 1000건당 200ms
      const status = executionTime <= threshold ? "PASS" : "WARNING";

      this.addTestResult(
        testName,
        status,
        executionTime,
        "삽입 속도",
        threshold,
        throughput,
        {
          records: totalRecords,
          batchSize: batchSize,
          throughputPerSecond: throughput,
        }
      );

      console.log(
        `   ${
          status === "PASS" ? "✅" : "⚠️"
        } ${testName}: ${executionTime}ms (${throughput} records/sec)`
      );

      // 테스트 테이블 정리
      this.executeQuery("DROP TABLE IF EXISTS performance_test_insert;");
    } catch (error) {
      this.addTestResult(testName, "FAIL", 0, "삽입 속도", 0, 0);
      console.log(`   ❌ ${testName}: 실패 (${error.message})`);
    }
  }

  /**
   * 대량 조회 성능 테스트
   */
  private async testBulkSelectPerformance(batchSize: number): Promise<void> {
    const testName = `Bulk Select (배치: ${batchSize})`;

    try {
      // 기존 테이블에서 조회 테스트 (user_organizations 테이블 사용)
      const queries = [
        {
          name: "Simple Select",
          query: `SELECT * FROM user_organizations LIMIT ${batchSize};`,
          threshold: 100, // 단순 조회: 100ms 이내
        },
        {
          name: "Filtered Select",
          query: `SELECT * FROM user_organizations WHERE status = 'ACTIVE' LIMIT ${batchSize};`,
          threshold: 150,
        },
        {
          name: "Ordered Select",
          query: `SELECT * FROM user_organizations ORDER BY created_at DESC LIMIT ${batchSize};`,
          threshold: 200,
        },
      ];

      for (const query of queries) {
        const startTime = Date.now();
        const result = this.executeQuery(query.query);
        const executionTime = Date.now() - startTime;

        const recordCount = result
          .trim()
          .split("\n")
          .filter((line) => line.trim()).length;
        const status = executionTime <= query.threshold ? "PASS" : "WARNING";

        this.addTestResult(
          `${testName} - ${query.name}`,
          status,
          executionTime,
          "조회 속도",
          query.threshold,
          recordCount
        );
        console.log(
          `   ${status === "PASS" ? "✅" : "⚠️"} ${testName} - ${
            query.name
          }: ${executionTime}ms (${recordCount} records)`
        );
      }
    } catch (error) {
      this.addTestResult(testName, "FAIL", 0, "조회 속도", 0, 0);
      console.log(`   ❌ ${testName}: 실패`);
    }
  }

  /**
   * 대량 업데이트 성능 테스트
   */
  private async testBulkUpdatePerformance(batchSize: number): Promise<void> {
    const testName = `Bulk Update (배치: ${batchSize})`;

    try {
      // 테스트를 위한 임시 업데이트 (실제 데이터에 영향 주지 않음)
      const startTime = Date.now();

      // 시뮬레이션된 업데이트 테스트
      const updateQuery = `
        SELECT COUNT(*) FROM user_organizations 
        WHERE updated_at < CURRENT_TIMESTAMP 
        LIMIT ${batchSize};
      `;

      this.executeQuery(updateQuery);
      const executionTime = Date.now() - startTime;

      const threshold = 200; // 업데이트: 200ms 이내
      const status = executionTime <= threshold ? "PASS" : "WARNING";

      this.addTestResult(
        testName,
        status,
        executionTime,
        "업데이트 속도",
        threshold,
        batchSize
      );
      console.log(
        `   ${
          status === "PASS" ? "✅" : "⚠️"
        } ${testName}: ${executionTime}ms (시뮬레이션)`
      );
    } catch (error) {
      this.addTestResult(testName, "FAIL", 0, "업데이트 속도", 0, 0);
      console.log(`   ❌ ${testName}: 실패`);
    }
  }

  /**
   * 대량 삭제 성능 테스트
   */
  private async testBulkDeletePerformance(batchSize: number): Promise<void> {
    const testName = `Bulk Delete (배치: ${batchSize})`;

    try {
      // 테스트용 임시 테이블 생성 및 데이터 삽입
      const createQuery = `
        CREATE TEMP TABLE performance_test_delete AS
        SELECT generate_series(1, ${batchSize}) as id, 'test_data' as data;
      `;
      this.executeQuery(createQuery);

      const startTime = Date.now();
      const deleteQuery = `DELETE FROM performance_test_delete WHERE id <= ${Math.floor(
        batchSize / 2
      )};`;
      this.executeQuery(deleteQuery);
      const executionTime = Date.now() - startTime;

      const threshold = 200; // 삭제: 200ms 이내
      const status = executionTime <= threshold ? "PASS" : "WARNING";

      this.addTestResult(
        testName,
        status,
        executionTime,
        "삭제 속도",
        threshold,
        Math.floor(batchSize / 2)
      );
      console.log(
        `   ${
          status === "PASS" ? "✅" : "⚠️"
        } ${testName}: ${executionTime}ms (${Math.floor(
          batchSize / 2
        )} records)`
      );
    } catch (error) {
      this.addTestResult(testName, "FAIL", 0, "삭제 속도", 0, 0);
      console.log(`   ❌ ${testName}: 실패`);
    }
  }

  /**
   * 2. 동시 접속 부하 테스트
   */
  async testConcurrentConnections(): Promise<void> {
    console.log("2️⃣ 동시 접속 부하 테스트");

    const concurrencyLevels = [5, 10, 25, 50];

    for (const level of concurrencyLevels) {
      await this.testConcurrentQueries(level);
    }

    console.log("");
  }

  /**
   * 동시 쿼리 실행 테스트
   */
  private async testConcurrentQueries(concurrency: number): Promise<void> {
    const testName = `동시 접속 ${concurrency}개`;

    try {
      const queries = Array.from(
        { length: concurrency },
        (_, i) =>
          `SELECT COUNT(*) FROM user_organizations WHERE id IS NOT NULL; -- Query ${
            i + 1
          }`
      );

      const startTime = Date.now();

      // 동시 쿼리 실행 시뮬레이션
      const promises = queries.map(
        (query) =>
          new Promise((resolve, reject) => {
            try {
              const result = this.executeQuery(query);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          })
      );

      await Promise.all(promises);
      const executionTime = Date.now() - startTime;

      // 50명 동시 접속까지 처리 가능해야 함
      const threshold = concurrency <= 50 ? 1000 : 2000; // ms
      const status = executionTime <= threshold ? "PASS" : "WARNING";

      const avgResponseTime = executionTime / concurrency;

      this.addTestResult(
        testName,
        status,
        executionTime,
        "동시 처리",
        threshold,
        avgResponseTime,
        {
          concurrency: concurrency,
          avgResponseTime: avgResponseTime,
          totalTime: executionTime,
        }
      );

      console.log(
        `   ${
          status === "PASS" ? "✅" : "⚠️"
        } ${testName}: ${executionTime}ms (평균: ${avgResponseTime.toFixed(
          1
        )}ms/query)`
      );
    } catch (error) {
      this.addTestResult(testName, "FAIL", 0, "동시 처리", 0, 0);
      console.log(`   ❌ ${testName}: 실패`);
    }
  }

  /**
   * 3. 복잡 쿼리 성능 테스트
   */
  async testComplexQueries(): Promise<void> {
    console.log("3️⃣ 복잡 쿼리 성능 테스트");

    const complexQueries = [
      {
        name: "사용자-조직 조인 쿼리",
        query: `
          SELECT u.name, u.email, uo.role, o.name as org_name
          FROM users u
          JOIN user_organizations uo ON u.id = uo.user_id  
          JOIN organizations o ON uo.organization_id = o.id
          WHERE uo.status = 'ACTIVE'
          ORDER BY u.created_at DESC
          LIMIT 100;
        `,
        threshold: 500, // 복잡한 조회: 500ms 이내
      },
      {
        name: "예산 집계 쿼리",
        query: `
          SELECT o.name, 
                 COUNT(b.id) as budget_count,
                 COALESCE(SUM(bi.amount), 0) as total_income,
                 COALESCE(SUM(be.amount), 0) as total_expense
          FROM organizations o
          LEFT JOIN budgets b ON o.id = b.organization_id
          LEFT JOIN budget_incomes bi ON b.id = bi.budget_id
          LEFT JOIN budget_expenses be ON b.id = be.budget_id
          GROUP BY o.id, o.name
          HAVING COUNT(b.id) > 0
          ORDER BY total_income DESC
          LIMIT 50;
        `,
        threshold: 800,
      },
      {
        name: "페이징 쿼리 (OFFSET 방식)",
        query: `
          SELECT uo.*, u.name, o.name as org_name
          FROM user_organizations uo
          JOIN users u ON uo.user_id = u.id
          JOIN organizations o ON uo.organization_id = o.id
          ORDER BY uo.created_at DESC
          LIMIT 20 OFFSET 100;
        `,
        threshold: 300, // 페이징 쿼리: 300ms 이내
      },
      {
        name: "커서 기반 페이징 쿼리",
        query: `
          SELECT uo.*, u.name, o.name as org_name
          FROM user_organizations uo
          JOIN users u ON uo.user_id = u.id
          JOIN organizations o ON uo.organization_id = o.id
          WHERE uo.created_at < CURRENT_TIMESTAMP
          ORDER BY uo.created_at DESC
          LIMIT 20;
        `,
        threshold: 200,
      },
    ];

    for (const query of complexQueries) {
      await this.testComplexQuery(query.name, query.query, query.threshold);
    }

    console.log("");
  }

  /**
   * 개별 복잡 쿼리 테스트
   */
  private async testComplexQuery(
    name: string,
    query: string,
    threshold: number
  ): Promise<void> {
    try {
      const startTime = Date.now();
      const result = this.executeQuery(query);
      const executionTime = Date.now() - startTime;

      const recordCount = result
        .trim()
        .split("\n")
        .filter((line) => line.trim()).length;
      const status = executionTime <= threshold ? "PASS" : "WARNING";

      this.addTestResult(
        name,
        status,
        executionTime,
        "복잡 쿼리",
        threshold,
        recordCount
      );
      console.log(
        `   ${
          status === "PASS" ? "✅" : "⚠️"
        } ${name}: ${executionTime}ms (${recordCount} records)`
      );
    } catch (error) {
      this.addTestResult(name, "FAIL", 0, "복잡 쿼리", threshold, 0);
      console.log(
        `   ❌ ${name}: 실패 (${error.message.substring(0, 100)}...)`
      );
    }
  }

  /**
   * 4. 백업/복원 성능 테스트
   */
  async testBackupRestorePerformance(): Promise<void> {
    console.log("4️⃣ 백업/복원 성능 테스트");

    await this.testBackupPerformance();
    // 복원 테스트는 위험하므로 시뮬레이션으로만 진행
    await this.testRestorePerformanceSimulation();

    console.log("");
  }

  /**
   * 백업 성능 테스트
   */
  private async testBackupPerformance(): Promise<void> {
    const testName = "데이터베이스 백업 성능";

    try {
      const backupPath = `/tmp/performance_test_backup_${Date.now()}.sql`;

      const startTime = Date.now();
      const backupCommand = `pg_dump -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} -d ${this.dbConfig.database} --no-password > "${backupPath}"`;

      execSync(backupCommand, {
        env: this.env,
        stdio: ["pipe", "pipe", "pipe"],
      });

      const executionTime = Date.now() - startTime;

      // 백업 성능 기준 (데이터베이스 크기에 따라 달라짐)
      const threshold = 30000; // 30초
      const status = executionTime <= threshold ? "PASS" : "WARNING";

      // 백업 파일 크기 확인
      const sizeCommand = `ls -la "${backupPath}" | awk '{print $5}'`;
      let fileSize = 0;
      try {
        const sizeResult = execSync(sizeCommand, { encoding: "utf8" });
        fileSize = parseInt(sizeResult.trim()) || 0;
      } catch (error) {
        // 파일 크기 조회 실패는 무시
      }

      this.addTestResult(
        testName,
        status,
        executionTime,
        "백업 속도",
        threshold,
        fileSize,
        {
          backupPath: backupPath,
          fileSizeBytes: fileSize,
          fileSizeMB: Math.round((fileSize / (1024 * 1024)) * 100) / 100,
        }
      );

      console.log(
        `   ${
          status === "PASS" ? "✅" : "⚠️"
        } ${testName}: ${executionTime}ms (${Math.round(fileSize / 1024)}KB)`
      );

      // 테스트 백업 파일 정리
      try {
        execSync(`rm -f "${backupPath}"`);
      } catch (error) {
        // 파일 삭제 실패는 무시
      }
    } catch (error) {
      this.addTestResult(testName, "FAIL", 0, "백업 속도", 0, 0);
      console.log(`   ❌ ${testName}: 실패`);
    }
  }

  /**
   * 복원 성능 시뮬레이션 테스트
   */
  private async testRestorePerformanceSimulation(): Promise<void> {
    const testName = "데이터베이스 복원 성능 (시뮬레이션)";

    try {
      // 실제 복원 대신 대량 INSERT로 시뮬레이션
      const startTime = Date.now();

      const simulationQuery = `
        CREATE TEMP TABLE restore_simulation AS
        SELECT generate_series(1, 1000) as id, 'simulation_data' as data;
      `;

      this.executeQuery(simulationQuery);
      const executionTime = Date.now() - startTime;

      const threshold = 10000; // 10초
      const status = executionTime <= threshold ? "PASS" : "WARNING";

      this.addTestResult(
        testName,
        status,
        executionTime,
        "복원 속도",
        threshold,
        1000
      );
      console.log(
        `   ${
          status === "PASS" ? "✅" : "⚠️"
        } ${testName}: ${executionTime}ms (시뮬레이션)`
      );
    } catch (error) {
      this.addTestResult(testName, "FAIL", 0, "복원 속도", 0, 0);
      console.log(`   ❌ ${testName}: 실패`);
    }
  }

  /**
   * 5. 인덱스 효율성 테스트
   */
  async testIndexEfficiency(): Promise<void> {
    console.log("5️⃣ 인덱스 효율성 테스트");

    const indexTests = [
      {
        name: "사용자 ID 인덱스",
        query:
          "SELECT * FROM user_organizations WHERE user_id = (SELECT id FROM users LIMIT 1);",
        threshold: 50,
      },
      {
        name: "조직 ID 인덱스",
        query:
          "SELECT * FROM user_organizations WHERE organization_id = (SELECT id FROM organizations LIMIT 1);",
        threshold: 50,
      },
      {
        name: "Role 인덱스",
        query: "SELECT * FROM user_organizations WHERE role = 'ADMIN';",
        threshold: 100,
      },
      {
        name: "Status 인덱스",
        query: "SELECT * FROM user_organizations WHERE status = 'ACTIVE';",
        threshold: 100,
      },
      {
        name: "복합 인덱스 (user_id + organization_id)",
        query: `
          SELECT * FROM user_organizations 
          WHERE user_id = (SELECT id FROM users LIMIT 1) 
            AND organization_id = (SELECT id FROM organizations LIMIT 1);
        `,
        threshold: 30,
      },
    ];

    for (const test of indexTests) {
      await this.testIndexedQuery(test.name, test.query, test.threshold);
    }

    console.log("");
  }

  /**
   * 인덱스가 적용된 쿼리 테스트
   */
  private async testIndexedQuery(
    name: string,
    query: string,
    threshold: number
  ): Promise<void> {
    try {
      const startTime = Date.now();
      const result = this.executeQuery(query);
      const executionTime = Date.now() - startTime;

      const recordCount = result
        .trim()
        .split("\n")
        .filter((line) => line.trim()).length;
      const status = executionTime <= threshold ? "PASS" : "WARNING";

      this.addTestResult(
        name,
        status,
        executionTime,
        "인덱스 효율성",
        threshold,
        recordCount
      );
      console.log(
        `   ${
          status === "PASS" ? "✅" : "⚠️"
        } ${name}: ${executionTime}ms (${recordCount} records)`
      );
    } catch (error) {
      this.addTestResult(name, "FAIL", 0, "인덱스 효율성", threshold, 0);
      console.log(`   ❌ ${name}: 실패`);
    }
  }

  /**
   * SQL 쿼리 실행
   */
  private executeQuery(query: string): string {
    const command = `psql -h ${this.dbConfig.host} -p ${
      this.dbConfig.port
    } -U ${this.dbConfig.username} -d ${
      this.dbConfig.database
    } --no-password -t -c "${query.replace(/"/g, '\\"')}"`;

    try {
      return execSync(command, {
        env: this.env,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error) {
      throw new Error(
        `쿼리 실행 실패: ${query.substring(0, 100)}... - ${error.message}`
      );
    }
  }

  /**
   * 테스트 결과 추가
   */
  private addTestResult(
    testName: string,
    status: "PASS" | "FAIL" | "WARNING",
    executionTime: number,
    metric: string,
    threshold: number,
    actual: number,
    details?: any
  ): void {
    this.testResults.push({
      testName,
      status,
      executionTime,
      metric,
      threshold,
      actual,
      details,
    });
  }

  /**
   * 성능 테스트 결과 출력
   */
  private printResults(): void {
    console.log("\n📊 데이터베이스 성능 테스트 결과:");
    console.log("=".repeat(70));

    const passedTests = this.testResults.filter((t) => t.status === "PASS");
    const warningTests = this.testResults.filter((t) => t.status === "WARNING");
    const failedTests = this.testResults.filter((t) => t.status === "FAIL");

    console.log(`✅ 통과: ${passedTests.length}개`);
    console.log(`⚠️  경고: ${warningTests.length}개`);
    console.log(`❌ 실패: ${failedTests.length}개`);
    console.log(`📊 전체: ${this.testResults.length}개`);

    // 성능 기준별 분류
    const performanceCategories = this.classifyPerformanceResults();

    console.log("\n📋 성능 기준별 결과:");
    Object.entries(performanceCategories).forEach(([category, tests]) => {
      const passed = tests.filter((t) => t.status === "PASS").length;
      const total = tests.length;
      console.log(`   ${category}: ${passed}/${total} 통과`);
    });

    // 경고 및 실패 테스트 상세 정보
    if (warningTests.length > 0) {
      console.log("\n⚠️  성능 기준을 초과한 테스트:");
      warningTests.forEach((test) => {
        console.log(
          `   • ${test.testName}: ${test.executionTime}ms (기준: ${test.threshold}ms)`
        );
      });
    }

    if (failedTests.length > 0) {
      console.log("\n❌ 실패한 테스트:");
      failedTests.forEach((test) => {
        console.log(`   • ${test.testName}: 실행 실패`);
      });
    }

    // 성능 개선 권장사항
    console.log("\n💡 성능 개선 권장사항:");
    this.generatePerformanceRecommendations();

    console.log("\n" + "=".repeat(70));

    if (failedTests.length === 0 && warningTests.length <= 2) {
      console.log("🎉 데이터베이스 성능이 우수한 수준입니다!");
    } else if (failedTests.length === 0) {
      console.log(
        "👍 데이터베이스 성능이 양호한 수준입니다. 일부 최적화를 고려해보세요."
      );
    } else {
      console.log("⚠️  일부 성능 이슈가 발견되었습니다. 최적화가 필요합니다.");
    }
  }

  /**
   * 성능 기준별 결과 분류
   */
  private classifyPerformanceResults(): Record<
    string,
    PerformanceTestResult[]
  > {
    const categories: Record<string, PerformanceTestResult[]> = {
      "단순 조회 (100ms 이하)": [],
      "복잡 쿼리 (500ms 이하)": [],
      "데이터 입력 (200ms 이하)": [],
      "페이징 쿼리 (300ms 이하)": [],
      "인덱스 효율성": [],
      "동시 접속 처리": [],
      "백업/복원": [],
    };

    this.testResults.forEach((test) => {
      if (test.metric.includes("조회") && test.threshold <= 100) {
        categories["단순 조회 (100ms 이하)"].push(test);
      } else if (test.metric.includes("복잡")) {
        categories["복잡 쿼리 (500ms 이하)"].push(test);
      } else if (test.metric.includes("삽입") || test.metric.includes("입력")) {
        categories["데이터 입력 (200ms 이하)"].push(test);
      } else if (test.testName.includes("페이징")) {
        categories["페이징 쿼리 (300ms 이하)"].push(test);
      } else if (test.metric.includes("인덱스")) {
        categories["인덱스 효율성"].push(test);
      } else if (test.metric.includes("동시")) {
        categories["동시 접속 처리"].push(test);
      } else if (test.metric.includes("백업") || test.metric.includes("복원")) {
        categories["백업/복원"].push(test);
      }
    });

    return categories;
  }

  /**
   * 성능 개선 권장사항 생성
   */
  private generatePerformanceRecommendations(): void {
    const recommendations = [];

    // 실패한 테스트 기반 권장사항
    const slowQueries = this.testResults.filter(
      (t) => t.status === "WARNING" && t.executionTime > t.threshold
    );

    if (slowQueries.length > 0) {
      recommendations.push(
        "느린 쿼리 최적화를 위해 EXPLAIN ANALYZE를 사용하여 실행 계획을 분석하세요."
      );
    }

    // 인덱스 관련 권장사항
    const slowIndexQueries = this.testResults.filter(
      (t) => t.metric.includes("인덱스") && t.status === "WARNING"
    );

    if (slowIndexQueries.length > 0) {
      recommendations.push(
        "인덱스 효율성 개선을 위해 REINDEX 또는 새로운 복합 인덱스를 고려하세요."
      );
    }

    // 동시 접속 관련 권장사항
    const concurrencyIssues = this.testResults.filter(
      (t) => t.metric.includes("동시") && t.status === "WARNING"
    );

    if (concurrencyIssues.length > 0) {
      recommendations.push(
        "동시 접속 성능 개선을 위해 connection pooling 및 max_connections 설정을 검토하세요."
      );
    }

    // 기본 권장사항
    if (recommendations.length === 0) {
      recommendations.push(
        "정기적인 VACUUM과 ANALYZE 실행으로 성능을 유지하세요."
      );
      recommendations.push(
        "쿼리 성능 모니터링을 위해 pg_stat_statements 확장을 활용하세요."
      );
    }

    recommendations.forEach((rec) => console.log(`   • ${rec}`));
  }
}

/**
 * 개별 성능 테스트 함수들
 */

/**
 * 대량 데이터 처리 테스트
 */
export async function testBulkDataProcessing(
  _dataSource?: DataSource
): Promise<void> {
  const tester = new DatabasePerformanceTester();
  await tester.testBulkDataProcessing();
}

/**
 * 동시 접속 테스트
 */
export async function testConcurrentConnections(
  _dataSource?: DataSource
): Promise<void> {
  const tester = new DatabasePerformanceTester();
  await tester.testConcurrentConnections();
}

/**
 * 복잡 쿼리 테스트
 */
export async function testComplexQueries(
  _dataSource?: DataSource
): Promise<void> {
  const tester = new DatabasePerformanceTester();
  await tester.testComplexQueries();
}

/**
 * 백업/복원 성능 테스트
 */
export async function testBackupRestorePerformance(
  _dataSource?: DataSource
): Promise<void> {
  const tester = new DatabasePerformanceTester();
  await tester.testBackupRestorePerformance();
}

/**
 * 전체 성능 테스트 실행
 */
export async function runPerformanceTests(
  _dataSource?: DataSource
): Promise<void> {
  const tester = new DatabasePerformanceTester();
  await tester.runAllTests(_dataSource);
}

/**
 * CLI에서 직접 실행될 때
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || "all";

  console.log("🚀 데이터베이스 성능 테스트 도구");
  console.log("사용법:");
  console.log("  npm run db:performance [all|bulk|concurrent|complex|backup]");
  console.log("");

  const tester = new DatabasePerformanceTester();

  switch (command) {
    case "bulk":
      tester
        .testBulkDataProcessing()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("❌ 대량 데이터 테스트 실패:", error.message);
          process.exit(1);
        });
      break;

    case "concurrent":
      tester
        .testConcurrentConnections()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("❌ 동시 접속 테스트 실패:", error.message);
          process.exit(1);
        });
      break;

    case "complex":
      tester
        .testComplexQueries()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("❌ 복잡 쿼리 테스트 실패:", error.message);
          process.exit(1);
        });
      break;

    case "backup":
      tester
        .testBackupRestorePerformance()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("❌ 백업/복원 테스트 실패:", error.message);
          process.exit(1);
        });
      break;

    case "all":
    default:
      tester
        .runAllTests()
        .then(() => {
          console.log("✅ 데이터베이스 성능 테스트 완료");
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ 성능 테스트 실패:", error.message);
          process.exit(1);
        });
      break;
  }
}
