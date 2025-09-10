/* eslint-disable no-console */
import { DataSource } from "typeorm";

/**
 * Task 2.13: 쿼리 성능 분석기
 *
 * 데이터베이스 쿼리 성능 분석 및 병목 지점 식별
 * - 느린 쿼리 탐지
 * - 실행 계획 분석
 * - 최적화 제안 생성
 * - 인덱스 효율성 평가
 */

interface SlowQueryInfo {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  maxTime: number;
  rows: number;
  recommendation: string[];
}

interface IndexEfficiency {
  schemaName: string;
  tableName: string;
  indexName: string;
  indexSize: string;
  scans: number;
  tupleReads: number;
  tupleFetches: number;
  efficiency: "HIGH" | "MEDIUM" | "LOW" | "UNUSED";
  recommendation: string[];
}

interface TableStatistics {
  tableName: string;
  rowCount: number;
  tableSize: string;
  indexSize: string;
  totalSize: string;
  avgRowSize: number;
  deadTuples: number;
  recommendation: string[];
}

/**
 * pg_stat_statements를 이용한 느린 쿼리 분석
 */
export async function analyzeSlowQueries(
  dataSource: DataSource,
  limit: number = 20
): Promise<SlowQueryInfo[]> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // pg_stat_statements 확장 활성화 확인
    try {
      await queryRunner.query(
        "CREATE EXTENSION IF NOT EXISTS pg_stat_statements"
      );
    } catch (error) {
      console.warn(
        "⚠️ pg_stat_statements 확장이 필요합니다. postgresql.conf에서 활성화해주세요."
      );
    }

    const slowQueriesQuery = `
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      WHERE query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%EXPLAIN%'
        AND total_exec_time > 0
      ORDER BY total_exec_time DESC 
      LIMIT $1
    `;

    const results = await queryRunner.query(slowQueriesQuery, [limit]);

    const slowQueries: SlowQueryInfo[] = results.map((row: any) => {
      const recommendations: string[] = [];

      // 실행 시간 기반 분석
      if (row.mean_exec_time > 1000) {
        recommendations.push(
          "평균 실행 시간이 1초를 초과합니다. 쿼리 최적화가 필요합니다."
        );
      }

      if (row.max_exec_time > 5000) {
        recommendations.push(
          "최대 실행 시간이 5초를 초과합니다. 인덱스 추가를 고려하세요."
        );
      }

      // 호출 횟수 기반 분석
      if (row.calls > 10000 && row.mean_exec_time > 100) {
        recommendations.push(
          "자주 실행되는 쿼리입니다. 캐싱이나 인덱스 최적화를 고려하세요."
        );
      }

      // 캐시 히트율 분석
      if (row.hit_percent < 95) {
        recommendations.push(
          "캐시 히트율이 낮습니다. shared_buffers 설정을 검토하세요."
        );
      }

      // 쿼리 패턴 분석
      if (
        row.query.toLowerCase().includes("order by") &&
        !row.query.toLowerCase().includes("limit")
      ) {
        recommendations.push(
          "ORDER BY 절에 LIMIT을 추가하여 성능을 개선할 수 있습니다."
        );
      }

      if (row.query.toLowerCase().includes("like %")) {
        recommendations.push(
          "LIKE 패턴이 %로 시작합니다. 전문 검색 인덱스(GIN)를 고려하세요."
        );
      }

      return {
        query:
          row.query.substring(0, 200) + (row.query.length > 200 ? "..." : ""),
        calls: row.calls,
        totalTime: row.total_exec_time,
        meanTime: row.mean_exec_time,
        maxTime: row.max_exec_time,
        rows: row.rows,
        recommendation: recommendations,
      };
    });

    return slowQueries;
  } finally {
    await queryRunner.release();
  }
}

/**
 * 인덱스 효율성 분석
 */
export async function analyzeIndexEfficiency(
  dataSource: DataSource
): Promise<IndexEfficiency[]> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    const indexEfficiencyQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        pg_relation_size(indexrelid) as index_size_bytes
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY pg_relation_size(indexrelid) DESC
    `;

    const results = await queryRunner.query(indexEfficiencyQuery);

    const indexAnalysis: IndexEfficiency[] = results.map((row: any) => {
      const recommendations: string[] = [];
      let efficiency: "HIGH" | "MEDIUM" | "LOW" | "UNUSED";

      // 효율성 분석
      if (row.idx_scan === 0) {
        efficiency = "UNUSED";
        recommendations.push("사용되지 않는 인덱스입니다. 삭제를 고려하세요.");
      } else if (row.idx_scan < 10) {
        efficiency = "LOW";
        recommendations.push(
          "사용 빈도가 낮습니다. 인덱스 필요성을 검토하세요."
        );
      } else if (row.idx_scan < 100) {
        efficiency = "MEDIUM";
        recommendations.push("보통 수준의 사용률입니다.");
      } else {
        efficiency = "HIGH";
        recommendations.push("효율적으로 사용되고 있습니다.");
      }

      // 인덱스 크기 대비 사용률 분석
      const sizeInMB = row.index_size_bytes / (1024 * 1024);
      if (sizeInMB > 10 && row.idx_scan < 100) {
        recommendations.push(
          "큰 인덱스 대비 사용률이 낮습니다. 최적화가 필요합니다."
        );
      }

      // 읽기 vs 페치 비율 분석
      if (row.idx_tup_read > 0 && row.idx_tup_fetch / row.idx_tup_read < 0.1) {
        recommendations.push(
          "인덱스 스캔 후 실제 사용되는 데이터가 적습니다. 선택도를 검토하세요."
        );
      }

      return {
        schemaName: row.schemaname,
        tableName: row.tablename,
        indexName: row.indexname,
        indexSize: row.index_size,
        scans: row.idx_scan,
        tupleReads: row.idx_tup_read,
        tupleFetches: row.idx_tup_fetch,
        efficiency,
        recommendation: recommendations,
      };
    });

    return indexAnalysis;
  } finally {
    await queryRunner.release();
  }
}

/**
 * 테이블 통계 및 최적화 제안
 */
export async function analyzeTableStatistics(
  dataSource: DataSource
): Promise<TableStatistics[]> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    const tableStatsQuery = `
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
        pg_total_relation_size(schemaname||'.'||tablename) as total_size_bytes,
        pg_relation_size(schemaname||'.'||tablename) as table_size_bytes
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    const results = await queryRunner.query(tableStatsQuery);

    const tableStats: TableStatistics[] = results.map((row: any) => {
      const recommendations: string[] = [];

      // Dead tuple 비율 분석
      const totalTuples = row.live_tuples + row.dead_tuples;
      const deadTupleRatio =
        totalTuples > 0 ? (row.dead_tuples / totalTuples) * 100 : 0;

      if (deadTupleRatio > 20) {
        recommendations.push(
          "Dead tuple 비율이 높습니다. VACUUM을 실행하세요."
        );
      }

      if (deadTupleRatio > 10 && !row.last_autovacuum) {
        recommendations.push(
          "Auto vacuum이 실행되지 않았습니다. 설정을 확인하세요."
        );
      }

      // 테이블 크기 분석
      const tableSizeInGB = row.table_size_bytes / (1024 * 1024 * 1024);
      if (tableSizeInGB > 1) {
        recommendations.push("대용량 테이블입니다. 파티셔닝을 고려하세요.");
      }

      // 인덱스 크기 대비 테이블 크기 분석
      const indexSize = row.total_size_bytes - row.table_size_bytes;
      const indexRatio =
        row.table_size_bytes > 0 ? (indexSize / row.table_size_bytes) * 100 : 0;

      if (indexRatio > 100) {
        recommendations.push(
          "인덱스 크기가 테이블 크기를 초과합니다. 불필요한 인덱스를 검토하세요."
        );
      }

      // 분석 통계 확인
      const lastAnalyze = row.last_analyze || row.last_autoanalyze;
      if (!lastAnalyze) {
        recommendations.push(
          "통계가 업데이트되지 않았습니다. ANALYZE를 실행하세요."
        );
      }

      // 평균 행 크기 계산
      const avgRowSize =
        row.live_tuples > 0 ? row.table_size_bytes / row.live_tuples : 0;

      return {
        tableName: row.tablename,
        rowCount: row.live_tuples,
        tableSize: row.table_size,
        indexSize: row.index_size,
        totalSize: row.total_size,
        avgRowSize: Math.round(avgRowSize),
        deadTuples: row.dead_tuples,
        recommendation: recommendations,
      };
    });

    return tableStats;
  } finally {
    await queryRunner.release();
  }
}

/**
 * 쿼리 실행 계획 분석
 */
export async function analyzeQueryPlan(
  dataSource: DataSource,
  query: string,
  params: any[] = []
): Promise<any> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
    const result = await queryRunner.query(explainQuery, params);

    const plan = result[0]?.["QUERY PLAN"]?.[0];
    if (plan) {
      const analysis = {
        totalCost: plan["Total Cost"],
        actualTime: plan["Actual Total Time"],
        planningTime: plan["Planning Time"],
        executionTime: plan["Execution Time"],
        buffersHit: plan["Buffers"]?.["Shared Hit Blocks"] || 0,
        buffersRead: plan["Buffers"]?.["Shared Read Blocks"] || 0,
        cacheHitRatio: 0,
        recommendations: [] as string[],
      };

      // 캐시 히트율 계산
      const totalBuffers = analysis.buffersHit + analysis.buffersRead;
      analysis.cacheHitRatio =
        totalBuffers > 0 ? (analysis.buffersHit / totalBuffers) * 100 : 0;

      // 최적화 제안
      if (analysis.actualTime > 1000) {
        analysis.recommendations.push("실행 시간이 1초를 초과합니다.");
      }

      if (analysis.cacheHitRatio < 95) {
        analysis.recommendations.push("캐시 히트율이 낮습니다.");
      }

      if (analysis.totalCost > 10000) {
        analysis.recommendations.push("쿼리 비용이 높습니다.");
      }

      return analysis;
    }

    return null;
  } finally {
    await queryRunner.release();
  }
}

/**
 * 종합 성능 분석 리포트 생성
 */
export async function generatePerformanceReport(
  dataSource: DataSource
): Promise<void> {
  console.log("🔍 종합 성능 분석을 시작합니다...\n");

  try {
    // 1. 느린 쿼리 분석
    console.log("1️⃣ 느린 쿼리 분석 중...");
    const slowQueries = await analyzeSlowQueries(dataSource, 10);

    console.log(`📊 상위 10개 느린 쿼리:`);
    slowQueries.forEach((query, index) => {
      console.log(
        `\n${index + 1}. 평균 실행시간: ${query.meanTime.toFixed(2)}ms (호출 ${
          query.calls
        }회)`
      );
      console.log(`   쿼리: ${query.query}`);
      if (query.recommendation.length > 0) {
        console.log(`   💡 제안: ${query.recommendation.join(", ")}`);
      }
    });

    // 2. 인덱스 효율성 분석
    console.log("\n\n2️⃣ 인덱스 효율성 분석 중...");
    const indexAnalysis = await analyzeIndexEfficiency(dataSource);

    const unusedIndexes = indexAnalysis.filter(
      (idx) => idx.efficiency === "UNUSED"
    );
    const lowEfficiencyIndexes = indexAnalysis.filter(
      (idx) => idx.efficiency === "LOW"
    );

    console.log(`📊 인덱스 효율성 요약:`);
    console.log(`   ❌ 사용되지 않는 인덱스: ${unusedIndexes.length}개`);
    console.log(`   ⚠️  낮은 효율성 인덱스: ${lowEfficiencyIndexes.length}개`);

    if (unusedIndexes.length > 0) {
      console.log("\n사용되지 않는 인덱스:");
      unusedIndexes.forEach((idx) => {
        console.log(
          `   • ${idx.tableName}.${idx.indexName} (${idx.indexSize})`
        );
      });
    }

    // 3. 테이블 통계 분석
    console.log("\n\n3️⃣ 테이블 통계 분석 중...");
    const tableStats = await analyzeTableStatistics(dataSource);

    console.log(`📊 테이블 통계 요약:`);
    tableStats.forEach((table) => {
      if (table.recommendation.length > 0) {
        console.log(`\n${table.tableName}:`);
        console.log(
          `   크기: ${table.totalSize} (테이블: ${table.tableSize}, 인덱스: ${table.indexSize})`
        );
        console.log(`   행 수: ${table.rowCount.toLocaleString()}개`);
        console.log(`   💡 제안: ${table.recommendation.join(", ")}`);
      }
    });

    // 4. 성능 최적화 제안 요약
    console.log("\n\n🎯 성능 최적화 제안 요약:");

    const highImpactRecommendations = [
      "사용되지 않는 인덱스 제거",
      "Dead tuple이 많은 테이블에 VACUUM 실행",
      "느린 쿼리에 적절한 인덱스 추가",
      "대용량 테이블 파티셔닝 검토",
      "캐시 히트율 개선을 위한 shared_buffers 설정 조정",
    ];

    highImpactRecommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    console.log("\n✅ 성능 분석 완료!");
  } catch (error) {
    console.error("❌ 성능 분석 중 오류 발생:", error);
    throw error;
  }
}

/**
 * CLI에서 직접 실행될 때
 */
if (require.main === module) {
  console.log("🔍 쿼리 성능 분석기 시작...");

  console.log("⚠️  이 스크립트는 실제 데이터베이스 연결이 필요합니다.");
  console.log("사용법: npm run db:analyze-performance");
  console.log(
    "또는 애플리케이션에서 generatePerformanceReport(dataSource) 함수를 호출하세요."
  );
}
