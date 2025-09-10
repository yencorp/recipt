/* eslint-disable no-console */
import { DataSource } from "typeorm";

/**
 * Task 2.13: 인덱스 최적화 및 쿼리 분석
 *
 * 데이터베이스 성능 최적화를 위한 인덱스 구조 개선
 * - 복합 인덱스 추가
 * - 부분 인덱스 최적화
 * - 전문 검색 인덱스 구현
 * - 쿼리 성능 분석
 */

interface IndexOptimizationResult {
  indexName: string;
  tableName: string;
  indexType: "COMPOSITE" | "PARTIAL" | "GIN" | "BTREE";
  status: "CREATED" | "EXISTS" | "FAILED";
  executionTime?: number;
  error?: string;
}

interface QueryAnalysisResult {
  query: string;
  executionTime: number;
  planCost: number;
  indexesUsed: string[];
  recommendations: string[];
}

/**
 * 복합 인덱스 최적화
 * 자주 함께 조회되는 컬럼들을 위한 복합 인덱스 생성
 */
export async function createCompositeIndexes(
  dataSource: DataSource
): Promise<IndexOptimizationResult[]> {
  const results: IndexOptimizationResult[] = [];
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // 복합 인덱스 정의
    const compositeIndexes = [
      // Events: 조직별 날짜 범위 조회 최적화
      {
        name: "idx_events_org_date_range",
        table: "events",
        columns: ["organization_id", "start_date", "end_date"],
        condition: null,
      },

      // Events: 조직별 상태 조회 최적화
      {
        name: "idx_events_org_status",
        table: "events",
        columns: ["organization_id", "status", "start_date"],
        condition: null,
      },

      // Settlements: 조직별 기간 조회 최적화
      {
        name: "idx_settlements_org_period",
        table: "settlements",
        columns: ["organization_id", "settlement_year", "settlement_month"],
        condition: null,
      },

      // Settlements: 상태별 날짜 조회 최적화
      {
        name: "idx_settlements_status_date",
        table: "settlements",
        columns: ["status", "period_start_date", "period_end_date"],
        condition: null,
      },

      // Receipt Scans: 조직별 날짜 조회 최적화
      {
        name: "idx_receipt_scans_org_date",
        table: "receipt_scans",
        columns: ["organization_id", "receipt_date", "status"],
        condition: null,
      },

      // Receipt Scans: 처리 상태별 업로드 일시 최적화
      {
        name: "idx_receipt_scans_processing_upload",
        table: "receipt_scans",
        columns: ["processing_status", "uploaded_at"],
        condition: null,
      },

      // Settlement Items: 결산별 유형 및 금액 최적화
      {
        name: "idx_settlement_items_settlement_type",
        table: "settlement_items",
        columns: ["settlement_id", "type", "actual_amount"],
        condition: null,
      },

      // Settlement Items: 카테고리별 날짜 조회 최적화
      {
        name: "idx_settlement_items_category_date",
        table: "settlement_items",
        columns: ["category", "transaction_date"],
        condition: "category IS NOT NULL",
      },

      // User Organizations: 조직별 역할 및 상태 최적화
      {
        name: "idx_user_organizations_org_role_status",
        table: "user_organizations",
        columns: ["organization_id", "role", "status"],
        condition: null,
      },
    ];

    for (const indexDef of compositeIndexes) {
      const startTime = Date.now();

      try {
        // 인덱스 존재 여부 확인
        const existsQuery = `
          SELECT 1 FROM pg_indexes 
          WHERE indexname = $1 AND tablename = $2
        `;
        const exists = await queryRunner.query(existsQuery, [
          indexDef.name,
          indexDef.table,
        ]);

        if (exists.length > 0) {
          results.push({
            indexName: indexDef.name,
            tableName: indexDef.table,
            indexType: "COMPOSITE",
            status: "EXISTS",
            executionTime: Date.now() - startTime,
          });
          continue;
        }

        // 복합 인덱스 생성
        const columnsStr = indexDef.columns.join(", ");
        const whereClause = indexDef.condition
          ? ` WHERE ${indexDef.condition}`
          : "";

        const createIndexQuery = `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexDef.name}
          ON ${indexDef.table} (${columnsStr})${whereClause}
        `;

        await queryRunner.query(createIndexQuery);

        results.push({
          indexName: indexDef.name,
          tableName: indexDef.table,
          indexType: "COMPOSITE",
          status: "CREATED",
          executionTime: Date.now() - startTime,
        });

        console.log(
          `✅ Created composite index: ${indexDef.name} on ${indexDef.table}`
        );
      } catch (error) {
        results.push({
          indexName: indexDef.name,
          tableName: indexDef.table,
          indexType: "COMPOSITE",
          status: "FAILED",
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
        });

        console.error(
          `❌ Failed to create composite index ${indexDef.name}:`,
          error
        );
      }
    }
  } finally {
    await queryRunner.release();
  }

  return results;
}

/**
 * 부분 인덱스 최적화
 * 조건부 인덱스로 성능 향상 및 저장공간 절약
 */
export async function createPartialIndexes(
  dataSource: DataSource
): Promise<IndexOptimizationResult[]> {
  const results: IndexOptimizationResult[] = [];
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // 부분 인덱스 정의
    const partialIndexes = [
      // 활성 사용자만 대상으로 하는 인덱스
      {
        name: "idx_users_active_email",
        table: "users",
        columns: ["email"],
        condition: "status = 'ACTIVE' AND is_active = true",
      },

      // 활성 관리자 사용자만 대상으로 하는 인덱스
      {
        name: "idx_users_active_admin",
        table: "users",
        columns: ["role", "last_login_at"],
        condition:
          "role IN ('SUPER_ADMIN', 'ORGANIZATION_ADMIN') AND status = 'ACTIVE'",
      },

      // 현재년도 이벤트만 대상으로 하는 인덱스
      {
        name: "idx_events_current_year",
        table: "events",
        columns: ["start_date", "organization_id"],
        condition: "start_date >= CURRENT_DATE - INTERVAL '1 year'",
      },

      // 진행중인 이벤트만 대상으로 하는 인덱스
      {
        name: "idx_events_active",
        table: "events",
        columns: ["status", "start_date"],
        condition:
          "status IN ('APPROVED', 'IN_PROGRESS') AND is_cancelled = false",
      },

      // 처리 대기중인 영수증만 대상으로 하는 인덱스
      {
        name: "idx_receipt_scans_pending",
        table: "receipt_scans",
        columns: ["uploaded_at", "organization_id"],
        condition: "processing_status IN ('PENDING', 'IN_QUEUE')",
      },

      // 오류 발생한 영수증만 대상으로 하는 인덱스
      {
        name: "idx_receipt_scans_errors",
        table: "receipt_scans",
        columns: ["processing_completed_at", "error_message"],
        condition: "processing_status = 'FAILED' OR status = 'ERROR'",
      },

      // 검증이 필요한 결산 항목만 대상으로 하는 인덱스
      {
        name: "idx_settlement_items_needs_validation",
        table: "settlement_items",
        columns: ["settlement_id", "actual_amount"],
        condition: "is_validated = false AND status = 'PENDING'",
      },

      // 높은 금액의 지출 항목만 대상으로 하는 인덱스
      {
        name: "idx_settlement_items_high_amount",
        table: "settlement_items",
        columns: ["actual_amount", "transaction_date"],
        condition: "type = 'EXPENSE' AND actual_amount > 100000",
      },

      // 활성 조직 멤버십만 대상으로 하는 인덱스
      {
        name: "idx_user_organizations_active_members",
        table: "user_organizations",
        columns: ["organization_id", "role"],
        condition: "status = 'ACTIVE' AND is_active = true",
      },
    ];

    for (const indexDef of partialIndexes) {
      const startTime = Date.now();

      try {
        // 인덱스 존재 여부 확인
        const existsQuery = `
          SELECT 1 FROM pg_indexes 
          WHERE indexname = $1 AND tablename = $2
        `;
        const exists = await queryRunner.query(existsQuery, [
          indexDef.name,
          indexDef.table,
        ]);

        if (exists.length > 0) {
          results.push({
            indexName: indexDef.name,
            tableName: indexDef.table,
            indexType: "PARTIAL",
            status: "EXISTS",
            executionTime: Date.now() - startTime,
          });
          continue;
        }

        // 부분 인덱스 생성
        const columnsStr = indexDef.columns.join(", ");
        const createIndexQuery = `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexDef.name}
          ON ${indexDef.table} (${columnsStr})
          WHERE ${indexDef.condition}
        `;

        await queryRunner.query(createIndexQuery);

        results.push({
          indexName: indexDef.name,
          tableName: indexDef.table,
          indexType: "PARTIAL",
          status: "CREATED",
          executionTime: Date.now() - startTime,
        });

        console.log(
          `✅ Created partial index: ${indexDef.name} on ${indexDef.table}`
        );
      } catch (error) {
        results.push({
          indexName: indexDef.name,
          tableName: indexDef.table,
          indexType: "PARTIAL",
          status: "FAILED",
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
        });

        console.error(
          `❌ Failed to create partial index ${indexDef.name}:`,
          error
        );
      }
    }
  } finally {
    await queryRunner.release();
  }

  return results;
}

/**
 * 전문 검색 인덱스 생성 (GIN)
 * 텍스트 검색 성능 최적화
 */
export async function createFullTextSearchIndexes(
  dataSource: DataSource
): Promise<IndexOptimizationResult[]> {
  const results: IndexOptimizationResult[] = [];
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // pg_trgm 확장 기능 활성화 확인
    try {
      await queryRunner.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
      console.log("✅ pg_trgm extension enabled");
    } catch (error) {
      console.warn("⚠️ pg_trgm extension may already exist:", error);
    }

    // GIN 인덱스 정의
    const ginIndexes = [
      // Events 제목 검색
      {
        name: "idx_events_title_gin",
        table: "events",
        column: "title",
        operator: "gin_trgm_ops",
      },

      // Events 설명 검색
      {
        name: "idx_events_description_gin",
        table: "events",
        column: "description",
        operator: "gin_trgm_ops",
      },

      // Receipt Scans 업체명 검색
      {
        name: "idx_receipt_scans_vendor_gin",
        table: "receipt_scans",
        column: "vendor_name",
        operator: "gin_trgm_ops",
      },

      // Receipt Scans OCR 텍스트 검색
      {
        name: "idx_receipt_scans_ocr_text_gin",
        table: "receipt_scans",
        column: "raw_ocr_text",
        operator: "gin_trgm_ops",
      },

      // Settlement Items 항목명 검색
      {
        name: "idx_settlement_items_name_gin",
        table: "settlement_items",
        column: "item_name",
        operator: "gin_trgm_ops",
      },

      // Settlement Items 공급업체 검색
      {
        name: "idx_settlement_items_vendor_gin",
        table: "settlement_items",
        column: "vendor",
        operator: "gin_trgm_ops",
      },

      // Settlements 제목 검색
      {
        name: "idx_settlements_title_gin",
        table: "settlements",
        column: "title",
        operator: "gin_trgm_ops",
      },

      // Users 이름 검색
      {
        name: "idx_users_name_gin",
        table: "users",
        column: "name",
        operator: "gin_trgm_ops",
      },
    ];

    for (const indexDef of ginIndexes) {
      const startTime = Date.now();

      try {
        // 인덱스 존재 여부 확인
        const existsQuery = `
          SELECT 1 FROM pg_indexes 
          WHERE indexname = $1 AND tablename = $2
        `;
        const exists = await queryRunner.query(existsQuery, [
          indexDef.name,
          indexDef.table,
        ]);

        if (exists.length > 0) {
          results.push({
            indexName: indexDef.name,
            tableName: indexDef.table,
            indexType: "GIN",
            status: "EXISTS",
            executionTime: Date.now() - startTime,
          });
          continue;
        }

        // GIN 인덱스 생성 (null 값 제외)
        const createIndexQuery = `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexDef.name}
          ON ${indexDef.table} USING gin (${indexDef.column} ${indexDef.operator})
          WHERE ${indexDef.column} IS NOT NULL
        `;

        await queryRunner.query(createIndexQuery);

        results.push({
          indexName: indexDef.name,
          tableName: indexDef.table,
          indexType: "GIN",
          status: "CREATED",
          executionTime: Date.now() - startTime,
        });

        console.log(
          `✅ Created GIN index: ${indexDef.name} on ${indexDef.table}.${indexDef.column}`
        );
      } catch (error) {
        results.push({
          indexName: indexDef.name,
          tableName: indexDef.table,
          indexType: "GIN",
          status: "FAILED",
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
        });

        console.error(`❌ Failed to create GIN index ${indexDef.name}:`, error);
      }
    }
  } finally {
    await queryRunner.release();
  }

  return results;
}

/**
 * 쿼리 성능 분석
 * 자주 사용되는 쿼리의 실행 계획 분석 및 최적화 제안
 */
export async function analyzeQueryPerformance(
  dataSource: DataSource
): Promise<QueryAnalysisResult[]> {
  const results: QueryAnalysisResult[] = [];
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // 분석할 대표 쿼리들
    const testQueries = [
      // 조직별 최근 이벤트 조회
      {
        name: "조직별 최근 이벤트 조회",
        query: `
          SELECT * FROM events 
          WHERE organization_id = $1 
            AND start_date >= CURRENT_DATE - INTERVAL '30 days'
          ORDER BY start_date DESC 
          LIMIT 10
        `,
        params: ["550e8400-e29b-41d4-a716-446655440000"],
      },

      // 결산 항목 집계 쿼리
      {
        name: "결산 항목 카테고리별 집계",
        query: `
          SELECT 
            category,
            type,
            COUNT(*) as item_count,
            SUM(actual_amount) as total_amount
          FROM settlement_items si
          JOIN settlements s ON s.id = si.settlement_id
          WHERE s.organization_id = $1 
            AND si.transaction_date >= $2
          GROUP BY category, type
        `,
        params: ["550e8400-e29b-41d4-a716-446655440000", "2024-01-01"],
      },

      // 영수증 OCR 처리 상태 조회
      {
        name: "영수증 OCR 처리 상태 조회",
        query: `
          SELECT 
            processing_status,
            COUNT(*) as count,
            AVG(file_size) as avg_file_size
          FROM receipt_scans
          WHERE organization_id = $1 
            AND uploaded_at >= $2
          GROUP BY processing_status
        `,
        params: ["550e8400-e29b-41d4-a716-446655440000", "2024-01-01"],
      },

      // 사용자별 조직 권한 조회
      {
        name: "사용자별 조직 권한 조회",
        query: `
          SELECT 
            u.name as user_name,
            o.name as org_name,
            uo.role,
            uo.status
          FROM users u
          JOIN user_organizations uo ON u.id = uo.user_id
          JOIN organizations o ON o.id = uo.organization_id
          WHERE u.status = 'ACTIVE' 
            AND uo.is_active = true
          ORDER BY u.name, o.name
        `,
        params: [],
      },

      // 전문 검색 쿼리 (이벤트)
      {
        name: "이벤트 제목 유사 검색",
        query: `
          SELECT *, similarity(title, $1) as sim_score
          FROM events
          WHERE title % $1
          ORDER BY sim_score DESC, start_date DESC
          LIMIT 20
        `,
        params: ["청년"],
      },
    ];

    for (const testQuery of testQueries) {
      try {
        // EXPLAIN ANALYZE 실행
        const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${testQuery.query}`;

        const explainResult = await queryRunner.query(
          explainQuery,
          testQuery.params
        );

        const plan = explainResult[0]?.["QUERY PLAN"]?.[0];
        if (plan) {
          // 인덱스 사용 정보 추출
          const indexesUsed: string[] = [];
          const extractIndexes = (node: any) => {
            if (node["Index Name"]) {
              indexesUsed.push(node["Index Name"]);
            }
            if (node.Plans) {
              node.Plans.forEach(extractIndexes);
            }
          };
          extractIndexes(plan);

          // 성능 최적화 제안 생성
          const recommendations: string[] = [];
          const totalCost = plan["Total Cost"] || 0;
          const actualTime = plan["Actual Total Time"] || 0;

          if (totalCost > 1000) {
            recommendations.push(
              "쿼리 비용이 높습니다. 인덱스 추가를 고려하세요."
            );
          }

          if (actualTime > 100) {
            recommendations.push(
              "실행 시간이 깁니다. 쿼리 최적화가 필요합니다."
            );
          }

          if (indexesUsed.length === 0) {
            recommendations.push(
              "인덱스가 사용되지 않았습니다. 적절한 인덱스 생성을 고려하세요."
            );
          }

          if (plan["Node Type"] === "Seq Scan") {
            recommendations.push(
              "순차 스캔이 발생했습니다. 인덱스 생성으로 성능을 개선할 수 있습니다."
            );
          }

          results.push({
            query: testQuery.name,
            executionTime: actualTime,
            planCost: totalCost,
            indexesUsed,
            recommendations,
          });

          console.log(`📊 Analyzed query: ${testQuery.name}`);
          console.log(`   Execution time: ${actualTime.toFixed(2)}ms`);
          console.log(`   Plan cost: ${totalCost.toFixed(2)}`);
          console.log(`   Indexes used: ${indexesUsed.join(", ") || "None"}`);
        }
      } catch (error) {
        console.error(`❌ Failed to analyze query: ${testQuery.name}`, error);
        results.push({
          query: testQuery.name,
          executionTime: 0,
          planCost: 0,
          indexesUsed: [],
          recommendations: [
            `쿼리 분석 실패: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ],
        });
      }
    }
  } finally {
    await queryRunner.release();
  }

  return results;
}

/**
 * 인덱스 사용률 분석
 */
export async function analyzeIndexUsage(
  dataSource: DataSource
): Promise<any[]> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // 인덱스 사용률 조회
    const indexUsageQuery = `
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch,
        idx_scan,
        CASE 
          WHEN idx_scan = 0 THEN 'UNUSED'
          WHEN idx_scan < 10 THEN 'LOW_USAGE'
          WHEN idx_scan < 100 THEN 'MODERATE_USAGE'
          ELSE 'HIGH_USAGE'
        END as usage_level
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
    `;

    const indexUsage = await queryRunner.query(indexUsageQuery);

    console.log("\n📈 인덱스 사용률 분석:");
    indexUsage.forEach((row: any) => {
      console.log(
        `${row.tablename}.${row.indexname}: ${row.idx_scan}번 스캔 (${row.usage_level})`
      );
    });

    return indexUsage;
  } finally {
    await queryRunner.release();
  }
}

/**
 * 메인 인덱스 최적화 함수
 */
export async function optimizeIndexes(dataSource?: DataSource): Promise<void> {
  if (!dataSource) {
    console.error("❌ DataSource가 제공되지 않았습니다.");
    return;
  }

  console.log("🚀 데이터베이스 인덱스 최적화를 시작합니다...\n");

  try {
    // 1. 복합 인덱스 생성
    console.log("1️⃣ 복합 인덱스 생성 중...");
    const compositeResults = await createCompositeIndexes(dataSource);
    const compositeCreated = compositeResults.filter(
      (r) => r.status === "CREATED"
    ).length;
    const compositeExists = compositeResults.filter(
      (r) => r.status === "EXISTS"
    ).length;
    const compositeFailed = compositeResults.filter(
      (r) => r.status === "FAILED"
    ).length;

    console.log(`   ✅ 생성됨: ${compositeCreated}개`);
    console.log(`   ℹ️  기존재: ${compositeExists}개`);
    console.log(`   ❌ 실패: ${compositeFailed}개\n`);

    // 2. 부분 인덱스 생성
    console.log("2️⃣ 부분 인덱스 생성 중...");
    const partialResults = await createPartialIndexes(dataSource);
    const partialCreated = partialResults.filter(
      (r) => r.status === "CREATED"
    ).length;
    const partialExists = partialResults.filter(
      (r) => r.status === "EXISTS"
    ).length;
    const partialFailed = partialResults.filter(
      (r) => r.status === "FAILED"
    ).length;

    console.log(`   ✅ 생성됨: ${partialCreated}개`);
    console.log(`   ℹ️  기존재: ${partialExists}개`);
    console.log(`   ❌ 실패: ${partialFailed}개\n`);

    // 3. 전문 검색 인덱스 생성
    console.log("3️⃣ 전문 검색 인덱스 (GIN) 생성 중...");
    const ginResults = await createFullTextSearchIndexes(dataSource);
    const ginCreated = ginResults.filter((r) => r.status === "CREATED").length;
    const ginExists = ginResults.filter((r) => r.status === "EXISTS").length;
    const ginFailed = ginResults.filter((r) => r.status === "FAILED").length;

    console.log(`   ✅ 생성됨: ${ginCreated}개`);
    console.log(`   ℹ️  기존재: ${ginExists}개`);
    console.log(`   ❌ 실패: ${ginFailed}개\n`);

    // 4. 쿼리 성능 분석
    console.log("4️⃣ 쿼리 성능 분석 중...");
    const queryAnalysis = await analyzeQueryPerformance(dataSource);

    console.log(`   📊 분석된 쿼리: ${queryAnalysis.length}개`);
    queryAnalysis.forEach((analysis) => {
      if (analysis.recommendations.length > 0) {
        console.log(
          `   ⚠️  ${analysis.query}: ${analysis.recommendations.join(", ")}`
        );
      }
    });
    console.log("");

    // 5. 인덱스 사용률 분석
    console.log("5️⃣ 인덱스 사용률 분석 중...");
    await analyzeIndexUsage(dataSource);

    // 최적화 완료 요약
    const totalCreated = compositeCreated + partialCreated + ginCreated;
    const totalExists = compositeExists + partialExists + ginExists;
    const totalFailed = compositeFailed + partialFailed + ginFailed;

    console.log("\n🎉 인덱스 최적화 완료!");
    console.log(`📊 요약:`);
    console.log(`   ✅ 새로 생성된 인덱스: ${totalCreated}개`);
    console.log(`   ℹ️  기존 인덱스: ${totalExists}개`);
    console.log(`   ❌ 실패한 인덱스: ${totalFailed}개`);
    console.log(`   📈 분석된 쿼리: ${queryAnalysis.length}개`);

    if (totalFailed > 0) {
      console.log(
        "\n⚠️  일부 인덱스 생성에 실패했습니다. 로그를 확인해주세요."
      );
    }
  } catch (error) {
    console.error("❌ 인덱스 최적화 중 오류 발생:", error);
    throw error;
  }
}

/**
 * CLI에서 직접 실행될 때
 */
if (require.main === module) {
  console.log("🚀 인덱스 최적화 스크립트 시작...");

  // 실제 운영에서는 DataSource를 제대로 연결해야 함
  console.log("⚠️  이 스크립트는 실제 데이터베이스 연결이 필요합니다.");
  console.log("사용법: npm run db:optimize-indexes");
  console.log(
    "또는 애플리케이션에서 optimizeIndexes(dataSource) 함수를 호출하세요."
  );
}
