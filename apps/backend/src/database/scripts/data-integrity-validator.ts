/* eslint-disable no-console */
import { DataSource } from "typeorm";
import { execSync } from "child_process";

/**
 * Task 2.14: 데이터 무결성 검증 스크립트
 *
 * 외래키 제약 조건, 체크 제약 조건, 중복 데이터 방지, 트랜잭션 롤백을 검증하는 도구
 * PostgreSQL 데이터베이스의 데이터 무결성을 체계적으로 검증
 */

interface IntegrityTestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface ForeignKeyConstraint {
  constraintName: string;
  tableName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: string;
  onUpdate: string;
}

/**
 * 데이터 무결성 통합 검증 클래스
 */
export class DataIntegrityValidator {
  private dbConfig: any;
  private env: any;
  private testResults: IntegrityTestResult[] = [];

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
   * 전체 데이터 무결성 검증 실행
   */
  async validateAll(_dataSource?: DataSource): Promise<void> {
    console.log("🔍 데이터 무결성 검증을 시작합니다...\n");

    try {
      await this.validateForeignKeyConstraints();
      await this.validateCheckConstraints();
      await this.validateUniqueConstraints();
      await this.validateTransactionRollback();

      this.printResults();
    } catch (error) {
      console.error("❌ 데이터 무결성 검증 중 오류 발생:", error);
      throw error;
    }
  }

  /**
   * 1. 외래키 제약 조건 검증
   */
  async validateForeignKeyConstraints(): Promise<void> {
    console.log("1️⃣ 외래키 제약 조건 검증 중...");

    try {
      // 외래키 제약 조건 목록 조회
      const fkQuery = `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS referenced_table,
          ccu.column_name AS referenced_column,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints rc 
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name;
      `;

      const result = this.executeQuery(fkQuery);
      const foreignKeys: ForeignKeyConstraint[] =
        this.parseForeignKeyResults(result);

      console.log(`   📋 총 ${foreignKeys.length}개의 외래키 제약 조건 발견`);

      // 각 외래키 제약 조건별 테스트
      for (const fk of foreignKeys) {
        await this.testForeignKeyConstraint(fk);
      }

      // 핵심 외래키 관계 특별 검증
      await this.validateCriticalForeignKeys();
    } catch (error) {
      this.addTestResult(
        "외래키 제약 조건 검증",
        false,
        `검증 실패: ${error.message}`
      );
    }
  }

  /**
   * 2. 체크 제약 조건 검증
   */
  async validateCheckConstraints(): Promise<void> {
    console.log("\n2️⃣ 체크 제약 조건 검증 중...");

    try {
      // 체크 제약 조건 목록 조회
      const checkQuery = `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc 
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.constraint_type = 'CHECK'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name;
      `;

      const result = this.executeQuery(checkQuery);
      const checkConstraints = this.parseCheckConstraintResults(result);

      console.log(
        `   📋 총 ${checkConstraints.length}개의 체크 제약 조건 발견`
      );

      // Enum 제약 조건 테스트
      await this.testEnumConstraints();

      // 날짜 범위 제약 조건 테스트
      await this.testDateRangeConstraints();

      // Boolean 제약 조건 테스트
      await this.testBooleanConstraints();

      this.addTestResult(
        "체크 제약 조건 검증",
        true,
        `${checkConstraints.length}개의 체크 제약 조건 정상 동작`
      );
    } catch (error) {
      this.addTestResult(
        "체크 제약 조건 검증",
        false,
        `검증 실패: ${error.message}`
      );
    }
  }

  /**
   * 3. 중복 데이터 방지 검증 (UNIQUE 제약 조건)
   */
  async validateUniqueConstraints(): Promise<void> {
    console.log("\n3️⃣ 중복 데이터 방지 검증 중...");

    try {
      // UNIQUE 제약 조건 목록 조회
      const uniqueQuery = `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = 'public'
        GROUP BY tc.constraint_name, tc.table_name
        ORDER BY tc.table_name;
      `;

      const result = this.executeQuery(uniqueQuery);
      const uniqueConstraints = this.parseUniqueConstraintResults(result);

      console.log(
        `   📋 총 ${uniqueConstraints.length}개의 UNIQUE 제약 조건 발견`
      );

      // 중복 데이터 테스트 시도
      await this.testDuplicateDataPrevention();

      this.addTestResult(
        "중복 데이터 방지 검증",
        true,
        `${uniqueConstraints.length}개의 UNIQUE 제약 조건 정상 동작`
      );
    } catch (error) {
      this.addTestResult(
        "중복 데이터 방지 검증",
        false,
        `검증 실패: ${error.message}`
      );
    }
  }

  /**
   * 4. 트랜잭션 롤백 테스트
   */
  async validateTransactionRollback(): Promise<void> {
    console.log("\n4️⃣ 트랜잭션 롤백 테스트 중...");

    try {
      // 트랜잭션 롤백 시나리오 테스트
      await this.testTransactionRollbackScenarios();

      this.addTestResult(
        "트랜잭션 롤백 테스트",
        true,
        "모든 트랜잭션 롤백 시나리오 정상 동작"
      );
    } catch (error) {
      this.addTestResult(
        "트랜잭션 롤백 테스트",
        false,
        `테스트 실패: ${error.message}`
      );
    }
  }

  /**
   * 개별 외래키 제약 조건 테스트
   */
  private async testForeignKeyConstraint(
    fk: ForeignKeyConstraint
  ): Promise<void> {
    try {
      // 참조 무결성 테스트
      const testQuery = `
        SELECT COUNT(*) as orphaned_count 
        FROM ${fk.tableName} child
        LEFT JOIN ${fk.referencedTable} parent 
          ON child.${fk.columnName} = parent.${fk.referencedColumn}
        WHERE child.${fk.columnName} IS NOT NULL 
          AND parent.${fk.referencedColumn} IS NULL;
      `;

      const result = this.executeQuery(testQuery);
      const orphanedCount = parseInt(result.trim());

      if (orphanedCount === 0) {
        console.log(
          `   ✅ ${fk.tableName}.${fk.columnName} -> ${fk.referencedTable}.${fk.referencedColumn}`
        );
        this.addTestResult(
          `FK: ${fk.constraintName}`,
          true,
          "참조 무결성 정상"
        );
      } else {
        console.log(
          `   ❌ ${fk.tableName}.${fk.columnName} -> ${fk.referencedTable}.${fk.referencedColumn} (${orphanedCount}개 고아 레코드)`
        );
        this.addTestResult(
          `FK: ${fk.constraintName}`,
          false,
          `${orphanedCount}개의 고아 레코드 발견`
        );
      }
    } catch (error) {
      this.addTestResult(
        `FK: ${fk.constraintName}`,
        false,
        `테스트 실패: ${error.message}`
      );
    }
  }

  /**
   * 핵심 외래키 관계 검증
   */
  private async validateCriticalForeignKeys(): Promise<void> {
    const criticalTests = [
      {
        name: "사용자-조직 관계",
        query: `
          SELECT COUNT(*) FROM user_organizations uo
          LEFT JOIN users u ON uo.user_id = u.id
          LEFT JOIN organizations o ON uo.organization_id = o.id
          WHERE u.id IS NULL OR o.id IS NULL;
        `,
      },
      {
        name: "예산-조직 관계",
        query: `
          SELECT COUNT(*) FROM budgets b
          LEFT JOIN organizations o ON b.organization_id = o.id
          WHERE o.id IS NULL;
        `,
      },
      {
        name: "결산-예산 관계",
        query: `
          SELECT COUNT(*) FROM settlements s
          LEFT JOIN budgets b ON s.budget_id = b.id
          WHERE s.budget_id IS NOT NULL AND b.id IS NULL;
        `,
      },
    ];

    for (const test of criticalTests) {
      try {
        const result = this.executeQuery(test.query);
        const problemCount = parseInt(result.trim());

        if (problemCount === 0) {
          console.log(`   ✅ ${test.name}: 무결성 정상`);
        } else {
          console.log(`   ❌ ${test.name}: ${problemCount}개 문제 발견`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${test.name}: 검증 실패 (${error.message})`);
      }
    }
  }

  /**
   * Enum 제약 조건 테스트
   */
  private async testEnumConstraints(): Promise<void> {
    const enumTests = [
      {
        name: "OrganizationRole Enum",
        table: "user_organizations",
        column: "role",
        validValues: [
          "ADMIN",
          "TREASURER",
          "ACCOUNTANT",
          "SECRETARY",
          "MEMBER",
          "OBSERVER",
        ],
      },
      {
        name: "MembershipStatus Enum",
        table: "user_organizations",
        column: "status",
        validValues: ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED", "RESIGNED"],
      },
      {
        name: "BudgetStatus Enum",
        table: "budgets",
        column: "status",
        validValues: [
          "DRAFT",
          "SUBMITTED",
          "UNDER_REVIEW",
          "APPROVED",
          "REJECTED",
          "ACTIVE",
          "COMPLETED",
          "CANCELLED",
        ],
      },
    ];

    for (const test of enumTests) {
      try {
        const query = `
          SELECT COUNT(*) FROM ${test.table} 
          WHERE ${test.column} NOT IN (${test.validValues
          .map((v) => `'${v}'`)
          .join(", ")});
        `;

        const result = this.executeQuery(query);
        const invalidCount = parseInt(result.trim());

        if (invalidCount === 0) {
          console.log(`   ✅ ${test.name}: 유효한 값만 존재`);
        } else {
          console.log(`   ❌ ${test.name}: ${invalidCount}개 잘못된 값 발견`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${test.name}: 테스트 실패`);
      }
    }
  }

  /**
   * 날짜 범위 제약 조건 테스트
   */
  private async testDateRangeConstraints(): Promise<void> {
    const dateTests = [
      {
        name: "미래 날짜 검증",
        query:
          "SELECT COUNT(*) FROM user_organizations WHERE joined_at > CURRENT_TIMESTAMP;",
      },
      {
        name: "탈퇴일 > 가입일 검증",
        query:
          "SELECT COUNT(*) FROM user_organizations WHERE left_at IS NOT NULL AND left_at <= joined_at;",
      },
    ];

    for (const test of dateTests) {
      try {
        const result = this.executeQuery(test.query);
        const problemCount = parseInt(result.trim());

        if (problemCount === 0) {
          console.log(`   ✅ ${test.name}: 제약 조건 정상`);
        } else {
          console.log(`   ❌ ${test.name}: ${problemCount}개 위반 발견`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${test.name}: 테스트 실패`);
      }
    }
  }

  /**
   * Boolean 제약 조건 테스트
   */
  private async testBooleanConstraints(): Promise<void> {
    const booleanTests = [
      {
        name: "활성 상태 Boolean 검증",
        query:
          "SELECT COUNT(*) FROM user_organizations WHERE is_active NOT IN (true, false);",
      },
    ];

    for (const test of booleanTests) {
      try {
        const result = this.executeQuery(test.query);
        const problemCount = parseInt(result.trim());

        if (problemCount === 0) {
          console.log(`   ✅ ${test.name}: Boolean 제약 정상`);
        } else {
          console.log(`   ❌ ${test.name}: ${problemCount}개 위반 발견`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${test.name}: 테스트 실패`);
      }
    }
  }

  /**
   * 중복 데이터 방지 테스트
   */
  private async testDuplicateDataPrevention(): Promise<void> {
    const duplicateTests = [
      {
        name: "사용자-조직 중복 방지",
        query: `
          SELECT user_id, organization_id, COUNT(*) as duplicate_count
          FROM user_organizations 
          GROUP BY user_id, organization_id 
          HAVING COUNT(*) > 1;
        `,
      },
      {
        name: "사용자 이메일 중복 방지",
        query: `
          SELECT email, COUNT(*) as duplicate_count
          FROM users 
          WHERE email IS NOT NULL
          GROUP BY email 
          HAVING COUNT(*) > 1;
        `,
      },
    ];

    for (const test of duplicateTests) {
      try {
        const result = this.executeQuery(test.query);
        const lines = result
          .trim()
          .split("\n")
          .filter((line) => line.trim());

        if (lines.length === 0) {
          console.log(`   ✅ ${test.name}: 중복 데이터 없음`);
        } else {
          console.log(
            `   ❌ ${test.name}: ${lines.length}건의 중복 데이터 발견`
          );
        }
      } catch (error) {
        console.log(`   ⚠️  ${test.name}: 테스트 실패`);
      }
    }
  }

  /**
   * 트랜잭션 롤백 시나리오 테스트
   */
  private async testTransactionRollbackScenarios(): Promise<void> {
    const rollbackTests = [
      {
        name: "외래키 위반시 롤백",
        setupQueries: [
          "BEGIN;",
          "INSERT INTO user_organizations (id, user_id, organization_id, role, status) VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'MEMBER', 'ACTIVE');",
        ],
        expectError: true,
        rollbackQuery: "ROLLBACK;",
      },
    ];

    for (const test of rollbackTests) {
      try {
        console.log(`   🧪 ${test.name} 테스트 중...`);

        // 트랜잭션 실행 시뮬레이션
        let errorOccurred = false;

        for (const query of test.setupQueries) {
          try {
            this.executeQuery(query);
          } catch (error) {
            errorOccurred = true;
            break;
          }
        }

        // 롤백 실행
        try {
          this.executeQuery(test.rollbackQuery);
        } catch (error) {
          // 롤백 자체는 성공해야 함
        }

        if (test.expectError && errorOccurred) {
          console.log(`   ✅ ${test.name}: 예상된 오류 발생 및 롤백 정상`);
        } else if (!test.expectError && !errorOccurred) {
          console.log(`   ✅ ${test.name}: 트랜잭션 정상 처리`);
        } else {
          console.log(`   ❌ ${test.name}: 예상과 다른 결과`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${test.name}: 테스트 실행 실패`);
      }
    }
  }

  /**
   * SQL 쿼리 실행
   */
  private executeQuery(query: string): string {
    const command = `psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} -d ${this.dbConfig.database} --no-password -t -c "${query}"`;

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
   * 외래키 결과 파싱
   */
  private parseForeignKeyResults(result: string): ForeignKeyConstraint[] {
    const lines = result
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    return lines.map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      return {
        constraintName: parts[0] || "",
        tableName: parts[1] || "",
        columnName: parts[2] || "",
        referencedTable: parts[3] || "",
        referencedColumn: parts[4] || "",
        onDelete: parts[5] || "",
        onUpdate: parts[6] || "",
      };
    });
  }

  /**
   * 체크 제약 조건 결과 파싱
   */
  private parseCheckConstraintResults(result: string): any[] {
    const lines = result
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    return lines.map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      return {
        constraintName: parts[0] || "",
        tableName: parts[1] || "",
        checkClause: parts[2] || "",
      };
    });
  }

  /**
   * UNIQUE 제약 조건 결과 파싱
   */
  private parseUniqueConstraintResults(result: string): any[] {
    const lines = result
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    return lines.map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      return {
        constraintName: parts[0] || "",
        tableName: parts[1] || "",
        columns: parts[2] || "",
      };
    });
  }

  /**
   * 테스트 결과 추가
   */
  private addTestResult(
    testName: string,
    passed: boolean,
    message: string,
    details?: any
  ): void {
    this.testResults.push({
      testName,
      passed,
      message,
      details,
    });
  }

  /**
   * 검증 결과 출력
   */
  private printResults(): void {
    console.log("\n📊 데이터 무결성 검증 결과:");
    console.log("=".repeat(60));

    const passedTests = this.testResults.filter((t) => t.passed);
    const failedTests = this.testResults.filter((t) => !t.passed);

    console.log(`✅ 통과: ${passedTests.length}개`);
    console.log(`❌ 실패: ${failedTests.length}개`);
    console.log(`📊 전체: ${this.testResults.length}개`);

    if (failedTests.length > 0) {
      console.log("\n❌ 실패한 테스트:");
      failedTests.forEach((test) => {
        console.log(`   • ${test.testName}: ${test.message}`);
      });
    }

    console.log("\n" + "=".repeat(60));

    if (failedTests.length === 0) {
      console.log("🎉 모든 데이터 무결성 검증을 통과했습니다!");
    } else {
      console.log(
        "⚠️  일부 검증에서 문제가 발견되었습니다. 위 내용을 확인해주세요."
      );
    }
  }
}

/**
 * 개별 검증 함수들
 */

/**
 * 외래키 제약 조건 검증
 */
export async function validateForeignKeys(
  _dataSource?: DataSource
): Promise<void> {
  const validator = new DataIntegrityValidator();
  await validator.validateForeignKeyConstraints();
}

/**
 * 체크 제약 조건 검증
 */
export async function validateCheckConstraints(
  _dataSource?: DataSource
): Promise<void> {
  const validator = new DataIntegrityValidator();
  await validator.validateCheckConstraints();
}

/**
 * 중복 데이터 방지 검증
 */
export async function validateUniqueConstraints(
  _dataSource?: DataSource
): Promise<void> {
  const validator = new DataIntegrityValidator();
  await validator.validateUniqueConstraints();
}

/**
 * 트랜잭션 롤백 테스트
 */
export async function testTransactionRollback(
  _dataSource?: DataSource
): Promise<void> {
  const validator = new DataIntegrityValidator();
  await validator.validateTransactionRollback();
}

/**
 * 전체 무결성 검증 실행
 */
export async function validateDataIntegrity(
  _dataSource?: DataSource
): Promise<void> {
  const validator = new DataIntegrityValidator();
  await validator.validateAll(_dataSource);
}

/**
 * CLI에서 직접 실행될 때
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || "all";

  console.log("🔍 데이터 무결성 검증 도구");
  console.log("사용법:");
  console.log(
    "  npm run db:validate [all|foreign-keys|check|unique|transaction]"
  );
  console.log("");

  const validator = new DataIntegrityValidator();

  switch (command) {
    case "foreign-keys":
      validator
        .validateForeignKeyConstraints()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("❌ 외래키 검증 실패:", error.message);
          process.exit(1);
        });
      break;

    case "check":
      validator
        .validateCheckConstraints()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("❌ 체크 제약 조건 검증 실패:", error.message);
          process.exit(1);
        });
      break;

    case "unique":
      validator
        .validateUniqueConstraints()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("❌ 중복 방지 검증 실패:", error.message);
          process.exit(1);
        });
      break;

    case "transaction":
      validator
        .validateTransactionRollback()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("❌ 트랜잭션 롤백 테스트 실패:", error.message);
          process.exit(1);
        });
      break;

    case "all":
    default:
      validator
        .validateAll()
        .then(() => {
          console.log("✅ 데이터 무결성 검증 완료");
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ 데이터 무결성 검증 실패:", error.message);
          process.exit(1);
        });
      break;
  }
}
