/* eslint-disable no-console */
import { DataSource } from "typeorm";
import { initializeDatabase as connectToDatabase } from "../data-source";
import { runAllSeeds } from "../seeds";

/**
 * Task 2.12: 데이터베이스 초기화 자동화 스크립트
 *
 * 완전한 데이터베이스 초기화를 수행합니다:
 * - 스키마 동기화 (테이블 생성/수정)
 * - 기본 시드 데이터 삽입
 * - 인덱스 최적화
 * - 데이터 무결성 검증
 */

export interface InitializationOptions {
  dropSchema: boolean; // 기존 스키마 삭제 여부
  runSeeds: boolean; // 시드 데이터 실행 여부
  createIndexes: boolean; // 인덱스 생성 여부
  validateData: boolean; // 데이터 검증 여부
  skipConfirmation: boolean; // 확인 프롬프트 건너뛰기
}

const DEFAULT_OPTIONS: InitializationOptions = {
  dropSchema: false,
  runSeeds: true,
  createIndexes: true,
  validateData: true,
  skipConfirmation: false,
};

/**
 * 데이터베이스 완전 초기화
 */
export async function initializeDatabase(
  options: Partial<InitializationOptions> = {},
  dataSource?: DataSource
): Promise<void> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  console.log("🚀 데이터베이스 초기화 시작...\n");

  if (!config.skipConfirmation && config.dropSchema) {
    console.log("⚠️  WARNING: 기존 데이터가 모두 삭제됩니다!");
    console.log("계속하려면 'yes'를 입력하세요:");

    // CLI 환경에서만 확인
    if (require.main === module) {
      const { createInterface } = await import("readline");
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question("", resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== "yes") {
        console.log("❌ 초기화가 취소되었습니다.");
        return;
      }
    }
  }

  const startTime = Date.now();
  let currentDataSource = dataSource;
  let shouldCloseConnection = false;

  try {
    // 1. 데이터베이스 연결
    console.log("📡 데이터베이스 연결 중...");
    if (!currentDataSource) {
      currentDataSource = await connectToDatabase();
      shouldCloseConnection = true;
    }
    console.log("✅ 데이터베이스 연결 성공\n");

    // 2. 스키마 초기화
    if (config.dropSchema) {
      await dropSchema(currentDataSource);
    }
    await synchronizeSchema(currentDataSource);

    // 3. PostgreSQL 확장 및 함수 설정
    await setupDatabaseExtensions(currentDataSource);

    // 4. 기본 시드 데이터 실행
    if (config.runSeeds) {
      await runSeedData(currentDataSource);
    }

    // 5. 인덱스 최적화
    if (config.createIndexes) {
      await optimizeIndexes(currentDataSource);
    }

    // 6. 데이터 무결성 검증
    if (config.validateData) {
      await validateDataIntegrity(currentDataSource);
    }

    // 7. 초기화 완료
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log("\n🎉 데이터베이스 초기화 완료!");
    console.log(`⏱️  총 소요 시간: ${duration.toFixed(2)}초`);
    console.log("\n📊 초기화 요약:");
    console.log(`   - 스키마 삭제: ${config.dropSchema ? "✅" : "⏭️"}`);
    console.log(`   - 스키마 동기화: ✅`);
    console.log(`   - 확장 기능 설정: ✅`);
    console.log(`   - 시드 데이터: ${config.runSeeds ? "✅" : "⏭️"}`);
    console.log(`   - 인덱스 최적화: ${config.createIndexes ? "✅" : "⏭️"}`);
    console.log(`   - 데이터 검증: ${config.validateData ? "✅" : "⏭️"}`);
  } catch (error) {
    console.error("\n❌ 데이터베이스 초기화 실패:", error);
    throw error;
  } finally {
    if (shouldCloseConnection && currentDataSource?.isInitialized) {
      await currentDataSource.destroy();
      console.log("\n🔌 데이터베이스 연결 종료");
    }
  }
}

/**
 * 스키마 삭제
 */
async function dropSchema(dataSource: DataSource): Promise<void> {
  console.log("🗑️  기존 스키마 삭제 중...");

  try {
    await dataSource.dropDatabase();
    console.log("✅ 스키마 삭제 완료");
  } catch (error) {
    console.warn("⚠️  스키마 삭제 중 오류:", error.message);
    // 스키마 삭제는 실패해도 계속 진행
  }
}

/**
 * 스키마 동기화
 */
async function synchronizeSchema(dataSource: DataSource): Promise<void> {
  console.log("🔄 스키마 동기화 중...");

  try {
    await dataSource.synchronize();
    console.log("✅ 스키마 동기화 완료");
  } catch (error) {
    console.error("❌ 스키마 동기화 실패:", error);
    throw error;
  }
}

/**
 * PostgreSQL 확장 및 함수 설정
 */
async function setupDatabaseExtensions(dataSource: DataSource): Promise<void> {
  console.log("🔧 데이터베이스 확장 설정 중...");

  try {
    // UUID 확장
    await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    console.log("   ✅ UUID 확장 활성화");

    // 암호화 확장
    await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    console.log("   ✅ 암호화 확장 활성화");

    // 전문 검색 확장
    await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);
    console.log("   ✅ 전문 검색 확장 활성화");

    // updated_at 자동 업데이트 함수
    await dataSource.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("   ✅ updated_at 트리거 함수 생성");

    // 통계 업데이트 함수
    await dataSource.query(`
      CREATE OR REPLACE FUNCTION update_table_statistics()
      RETURNS void AS $$
      BEGIN
          ANALYZE users;
          ANALYZE organizations;
          ANALYZE user_organizations;
          ANALYZE events;
          ANALYZE budgets;
          ANALYZE budget_incomes;
          ANALYZE budget_expenses;
          ANALYZE settlements;
          ANALYZE settlement_incomes;
          ANALYZE settlement_expenses;
          ANALYZE receipt_scans;
          ANALYZE posts;
          ANALYZE refresh_tokens;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("   ✅ 통계 업데이트 함수 생성");

    console.log("✅ 데이터베이스 확장 설정 완료");
  } catch (error) {
    console.error("❌ 확장 설정 실패:", error);
    throw error;
  }
}

/**
 * 시드 데이터 실행
 */
async function runSeedData(dataSource: DataSource): Promise<void> {
  console.log("🌱 기본 시드 데이터 실행 중...");

  try {
    await runAllSeeds(dataSource);
    console.log("✅ 시드 데이터 실행 완료");
  } catch (error) {
    console.error("❌ 시드 데이터 실행 실패:", error);
    throw error;
  }
}

/**
 * 인덱스 최적화
 */
async function optimizeIndexes(dataSource: DataSource): Promise<void> {
  console.log("🔍 인덱스 최적화 중...");

  try {
    // 복합 인덱스 생성
    const complexIndexes = [
      // 이벤트 관련 복합 인덱스
      {
        table: "events",
        name: "idx_events_org_date",
        columns: ["organization_id", "start_date"],
        description: "조직별 행사 날짜 조회 최적화",
      },
      {
        table: "events",
        name: "idx_events_org_status",
        columns: ["organization_id", "status"],
        description: "조직별 행사 상태 조회 최적화",
      },
      // 예산 관련 복합 인덱스
      {
        table: "budget_incomes",
        name: "idx_budget_incomes_budget_order",
        columns: ["budget_id", "display_order"],
        description: "예산 수입 정렬 최적화",
      },
      {
        table: "budget_expenses",
        name: "idx_budget_expenses_budget_order",
        columns: ["budget_id", "display_order"],
        description: "예산 지출 정렬 최적화",
      },
      // 결산 관련 복합 인덱스
      {
        table: "settlement_incomes",
        name: "idx_settlement_incomes_settlement_order",
        columns: ["settlement_id", "display_order"],
        description: "결산 수입 정렬 최적화",
      },
      {
        table: "settlement_expenses",
        name: "idx_settlement_expenses_settlement_order",
        columns: ["settlement_id", "display_order"],
        description: "결산 지출 정렬 최적화",
      },
      // 영수증 관련 복합 인덱스
      {
        table: "receipt_scans",
        name: "idx_receipts_settlement_status",
        columns: ["settlement_id", "processing_status"],
        description: "결산별 영수증 처리 상태 조회 최적화",
      },
      {
        table: "receipt_scans",
        name: "idx_receipts_settlement_date",
        columns: ["settlement_id", "uploaded_at"],
        description: "결산별 영수증 업로드 날짜 조회 최적화",
      },
    ];

    for (const index of complexIndexes) {
      try {
        const query = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${
          index.table
        } (${index.columns.join(", ")});`;
        await dataSource.query(query);
        console.log(`   ✅ ${index.description}`);
      } catch (indexError) {
        console.warn(
          `   ⚠️  인덱스 생성 실패 (${index.name}):`,
          indexError.message
        );
      }
    }

    // 부분 인덱스 생성
    const partialIndexes = [
      // 활성 사용자만
      {
        query: `CREATE INDEX IF NOT EXISTS idx_users_active_admin ON users(id) WHERE is_active = TRUE AND role = 'ADMIN';`,
        description: "활성 관리자 조회 최적화",
      },
      // 활성 조직만
      {
        query: `CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(id) WHERE is_active = TRUE;`,
        description: "활성 조직 조회 최적화",
      },
      // 활성 사용자-조직 관계만
      {
        query: `CREATE INDEX IF NOT EXISTS idx_user_organizations_active ON user_organizations(user_id, organization_id) WHERE is_active = TRUE;`,
        description: "활성 사용자-조직 관계 최적화",
      },
      // 진행 중인 행사
      {
        query: `CREATE INDEX IF NOT EXISTS idx_events_in_progress ON events(start_date) WHERE status IN ('PLANNING', 'IN_PROGRESS');`,
        description: "진행 중인 행사 조회 최적화",
      },
      // 처리 완료된 영수증
      {
        query: `CREATE INDEX IF NOT EXISTS idx_receipts_processed ON receipt_scans(uploaded_at) WHERE processing_status = 'COMPLETED';`,
        description: "처리 완료 영수증 조회 최적화",
      },
    ];

    for (const index of partialIndexes) {
      try {
        await dataSource.query(index.query);
        console.log(`   ✅ ${index.description}`);
      } catch (indexError) {
        console.warn(`   ⚠️  부분 인덱스 생성 실패:`, indexError.message);
      }
    }

    // 통계 업데이트
    await dataSource.query("SELECT update_table_statistics();");
    console.log("   ✅ 테이블 통계 업데이트");

    console.log("✅ 인덱스 최적화 완료");
  } catch (error) {
    console.error("❌ 인덱스 최적화 실패:", error);
    throw error;
  }
}

/**
 * 데이터 무결성 검증
 */
async function validateDataIntegrity(dataSource: DataSource): Promise<void> {
  console.log("🔍 데이터 무결성 검증 중...");

  try {
    const validations = [
      // 사용자 데이터 검증
      {
        name: "사용자 이메일 중복 검증",
        query: `
          SELECT COUNT(*) as count FROM (
            SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1
          ) duplicates;
        `,
        expected: 0,
      },
      // 조직 데이터 검증
      {
        name: "조직명 중복 검증",
        query: `
          SELECT COUNT(*) as count FROM (
            SELECT name FROM organizations GROUP BY name HAVING COUNT(*) > 1
          ) duplicates;
        `,
        expected: 0,
      },
      // 사용자-조직 관계 검증
      {
        name: "사용자-조직 관계 중복 검증",
        query: `
          SELECT COUNT(*) as count FROM (
            SELECT user_id, organization_id FROM user_organizations 
            GROUP BY user_id, organization_id HAVING COUNT(*) > 1
          ) duplicates;
        `,
        expected: 0,
      },
      // 외래키 무결성 검증
      {
        name: "고아 사용자-조직 관계 검증",
        query: `
          SELECT COUNT(*) as count FROM user_organizations uo
          LEFT JOIN users u ON uo.user_id = u.id
          LEFT JOIN organizations o ON uo.organization_id = o.id
          WHERE u.id IS NULL OR o.id IS NULL;
        `,
        expected: 0,
      },
      // 행사-예산 관계 검증
      {
        name: "고아 예산 검증",
        query: `
          SELECT COUNT(*) as count FROM budgets b
          LEFT JOIN events e ON b.event_id = e.id
          WHERE e.id IS NULL;
        `,
        expected: 0,
      },
      // 행사-결산 관계 검증
      {
        name: "고아 결산 검증",
        query: `
          SELECT COUNT(*) as count FROM settlements s
          LEFT JOIN events e ON s.event_id = e.id  
          WHERE e.id IS NULL;
        `,
        expected: 0,
      },
    ];

    let allValid = true;

    for (const validation of validations) {
      try {
        const result = await dataSource.query(validation.query);
        const count = parseInt(result[0].count);

        if (count === validation.expected) {
          console.log(`   ✅ ${validation.name}`);
        } else {
          console.error(
            `   ❌ ${validation.name}: ${count}개 문제 발견 (예상: ${validation.expected})`
          );
          allValid = false;
        }
      } catch (validationError) {
        console.error(
          `   ⚠️  ${validation.name} 검증 실패:`,
          validationError.message
        );
        allValid = false;
      }
    }

    // 기본 데이터 존재 검증
    const basicDataChecks = [
      { table: "organizations", name: "조직" },
      { table: "users", name: "사용자" },
      { table: "user_organizations", name: "사용자-조직 관계" },
    ];

    for (const check of basicDataChecks) {
      try {
        const result = await dataSource.query(
          `SELECT COUNT(*) as count FROM ${check.table};`
        );
        const count = parseInt(result[0].count);

        if (count > 0) {
          console.log(`   ✅ ${check.name}: ${count}개 존재`);
        } else {
          console.warn(`   ⚠️  ${check.name}: 데이터 없음`);
        }
      } catch (error) {
        console.error(`   ❌ ${check.name} 확인 실패:`, error.message);
      }
    }

    if (allValid) {
      console.log("✅ 데이터 무결성 검증 완료 - 모든 검증 통과");
    } else {
      console.warn("⚠️  데이터 무결성 검증 완료 - 일부 문제 발견");
    }
  } catch (error) {
    console.error("❌ 데이터 무결성 검증 실패:", error);
    throw error;
  }
}

/**
 * CLI에서 직접 실행될 때
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  // 기본 옵션
  const options: Partial<InitializationOptions> = {};

  // 명령줄 인자 파싱
  args.forEach((arg) => {
    switch (arg) {
      case "--drop-schema":
        options.dropSchema = true;
        break;
      case "--no-seeds":
        options.runSeeds = false;
        break;
      case "--no-indexes":
        options.createIndexes = false;
        break;
      case "--no-validation":
        options.validateData = false;
        break;
      case "--yes":
      case "-y":
        options.skipConfirmation = true;
        break;
    }
  });

  console.log("🚀 데이터베이스 초기화 도구");
  console.log(
    "사용법: npm run db:init [--drop-schema] [--no-seeds] [--no-indexes] [--no-validation] [--yes]"
  );
  console.log("");

  initializeDatabase(options)
    .then(() => {
      console.log("✅ 데이터베이스 초기화 완료");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 데이터베이스 초기화 실패:", error);
      process.exit(1);
    });
}
