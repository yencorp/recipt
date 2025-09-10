/* eslint-disable no-console */
import { DataSource } from "typeorm";
// import { initializeDatabase } from "../data-source"; // TODO: 활성화 시 사용

/**
 * Task 2.12: 대량 데이터 생성 자동화 스크립트
 *
 * TODO: entity 구조에 맞게 재구현 필요
 * 현재는 기본 시드 데이터를 사용해주세요: npm run seed
 */

// 한글 로케일 설정
// faker.setLocale("ko");

interface BulkDataOptions {
  users: number; // 생성할 사용자 수 (기본: 1000)
  events: number; // 생성할 행사 수 (기본: 200)
  receipts: number; // 생성할 영수증 수 (기본: 5000)
  yearsBack: number; // 과거 몇 년까지 데이터 생성 (기본: 3)
  batchSize: number; // 배치 처리 크기 (기본: 100)
}

const DEFAULT_OPTIONS: BulkDataOptions = {
  users: 1000,
  events: 200,
  receipts: 5000,
  yearsBack: 3,
  batchSize: 100,
};

/**
 * 대량 데이터 생성 메인 함수
 * Backend Reliability: 안전한 대량 데이터 생성을 위한 배치 처리 시뮬레이션
 */
export async function generateBulkData(
  options: Partial<BulkDataOptions> = {},
  _dataSource?: DataSource
): Promise<void> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // 운영 환경 안전장치
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "🚨 운영 환경에서는 대량 데이터 생성을 실행할 수 없습니다."
    );
  }

  console.log("🚀 대량 테스트 데이터 생성 시작...");
  console.log(
    `📊 생성 설정: 사용자 ${config.users}명, 행사 ${config.events}개, 영수증 ${config.receipts}개`
  );
  console.log(
    `⏱️  기간: 과거 ${config.yearsBack}년, 배치 크기: ${config.batchSize}`
  );

  try {
    // 1단계: 조직 및 사용자 데이터 생성 시뮬레이션
    console.log("1️⃣ 사용자 데이터 생성 중...");
    for (let i = 0; i < Math.ceil(config.users / config.batchSize); i++) {
      const currentBatch = Math.min(
        config.batchSize,
        config.users - i * config.batchSize
      );
      console.log(
        `   배치 ${i + 1}: ${currentBatch}명 처리 중... (시뮬레이션)`
      );
      // 실제 구현에서는 여기서 User entity를 생성
      await new Promise((resolve) => global.setTimeout(resolve, 100)); // 시뮬레이션 지연
    }
    console.log(`   ✅ ${config.users}명 사용자 생성 완료 (시뮬레이션)`);

    // 2단계: 행사 데이터 생성 시뮬레이션
    console.log("2️⃣ 행사 데이터 생성 중...");
    for (let i = 0; i < Math.ceil(config.events / config.batchSize); i++) {
      const currentBatch = Math.min(
        config.batchSize,
        config.events - i * config.batchSize
      );
      console.log(
        `   배치 ${i + 1}: ${currentBatch}개 행사 처리 중... (시뮬레이션)`
      );
      // 실제 구현에서는 여기서 Event entity를 생성
      await new Promise((resolve) => global.setTimeout(resolve, 50));
    }
    console.log(`   ✅ ${config.events}개 행사 생성 완료 (시뮬레이션)`);

    // 3단계: 영수증 데이터 생성 시뮬레이션
    console.log("3️⃣ 영수증 데이터 생성 중...");
    for (let i = 0; i < Math.ceil(config.receipts / config.batchSize); i++) {
      const currentBatch = Math.min(
        config.batchSize,
        config.receipts - i * config.batchSize
      );
      console.log(
        `   배치 ${i + 1}: ${currentBatch}개 영수증 처리 중... (시뮬레이션)`
      );
      // 실제 구현에서는 여기서 ReceiptScan entity를 생성
      await new Promise((resolve) => global.setTimeout(resolve, 30));
    }
    console.log(`   ✅ ${config.receipts}개 영수증 생성 완료 (시뮬레이션)`);

    console.log("\n🎉 대량 데이터 생성 완료!");
    console.log("💡 실제 구현을 위해서는 다음이 필요합니다:");
    console.log("   - Entity 클래스와 Repository 연동");
    console.log("   - Faker.js를 통한 현실적인 한국어 데이터 생성");
    console.log("   - 트랜잭션 처리 및 롤백 기능");
    console.log("   - 메모리 최적화를 위한 스트리밍 처리");
    console.log("\n현재는 기본 시드 데이터를 사용해주세요: npm run seed");
  } catch (error) {
    console.error("❌ 대량 데이터 생성 실패:", error);
    throw new Error(
      `대량 데이터 생성 실패: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * CLI에서 직접 실행될 때
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  // 기본 옵션
  const options: Partial<BulkDataOptions> = {};

  // 명령줄 인자 파싱
  args.forEach((arg) => {
    const [key, value] = arg.split("=");
    switch (key) {
      case "--users":
        options.users = parseInt(value) || DEFAULT_OPTIONS.users;
        break;
      case "--events":
        options.events = parseInt(value) || DEFAULT_OPTIONS.events;
        break;
      case "--receipts":
        options.receipts = parseInt(value) || DEFAULT_OPTIONS.receipts;
        break;
      case "--years":
        options.yearsBack = parseInt(value) || DEFAULT_OPTIONS.yearsBack;
        break;
      case "--batch":
        options.batchSize = parseInt(value) || DEFAULT_OPTIONS.batchSize;
        break;
    }
  });

  console.log("🚀 대량 데이터 생성기 (비활성화)");
  console.log(
    "사용법: npm run bulk-data [--users=1000] [--events=200] [--receipts=5000] [--years=3] [--batch=100]"
  );

  generateBulkData(options)
    .then(() => {
      console.log("✅ bulk-data-generator 실행 완료 (비활성화 상태)");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ bulk-data-generator 실행 실패:", error);
      process.exit(1);
    });
}
