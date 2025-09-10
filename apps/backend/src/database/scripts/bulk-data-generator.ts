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
 * TODO: entity 구조에 맞게 재구현 필요
 */
export async function generateBulkData(
  options: Partial<BulkDataOptions> = {},
  _dataSource?: DataSource
): Promise<void> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  console.log("⚠️  bulk-data-generator는 현재 비활성화되었습니다.");
  console.log("entity 구조 확인 후 재구현이 필요합니다.");
  console.log(
    `요청된 설정: 사용자 ${config.users}명, 행사 ${config.events}개, 영수증 ${config.receipts}개`
  );
  console.log("현재는 기본 시드 데이터를 사용해주세요: npm run seed");
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
