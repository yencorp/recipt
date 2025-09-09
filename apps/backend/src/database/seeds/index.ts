/* eslint-disable no-console */
import { DataSource } from "typeorm";
import { initializeDatabase } from "../data-source";
import { seedOrganizations } from "./01-organizations.seed";
import { seedAdminUsers } from "./02-admin-users.seed";
import { seedUserOrganizations } from "./03-user-organizations.seed";

/**
 * 전체 시드 데이터 실행
 * Task 2.10: 기본 시드 데이터 작성
 *
 * 실행 순서:
 * 1. 조직 데이터 생성
 * 2. 관리자 사용자 계정 생성
 * 3. 사용자-조직 관계 설정
 */

interface SeedFunction {
  name: string;
  function: (dataSource: DataSource) => Promise<void>;
}

const seedFunctions: SeedFunction[] = [
  {
    name: "조직 데이터",
    function: seedOrganizations,
  },
  {
    name: "관리자 계정",
    function: seedAdminUsers,
  },
  {
    name: "사용자-조직 관계",
    function: seedUserOrganizations,
  },
];

/**
 * 모든 시드 데이터 실행
 */
export async function runAllSeeds(dataSource?: DataSource): Promise<void> {
  console.log("🚀 시드 데이터 실행 시작...\n");

  const startTime = Date.now();
  let currentDataSource = dataSource;
  let shouldCloseConnection = false;

  try {
    // DataSource 초기화
    if (!currentDataSource) {
      console.log("📡 데이터베이스 연결 초기화 중...");
      currentDataSource = await initializeDatabase();
      shouldCloseConnection = true;
    }

    console.log("✅ 데이터베이스 연결 성공\n");

    // 각 시드 함수 실행
    for (let i = 0; i < seedFunctions.length; i++) {
      const seedFunction = seedFunctions[i];
      console.log(
        `📋 [${i + 1}/${seedFunctions.length}] ${
          seedFunction.name
        } 시드 실행 중...`
      );

      try {
        await seedFunction.function(currentDataSource);
        console.log(`✅ ${seedFunction.name} 시드 완료\n`);
      } catch (error) {
        console.error(`❌ ${seedFunction.name} 시드 실패:`, error);
        throw error;
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log("🎉 모든 시드 데이터 실행 완료!");
    console.log(`⏱️  총 실행 시간: ${duration.toFixed(2)}초`);
    console.log("\n📝 생성된 데이터:");
    console.log("   - 4개 기본 조직 (청년회, 자모회, 초등부, 중고등부)");
    console.log(
      "   - 6개 관리자 계정 (시스템 관리자, 조직별 관리자, 회계 담당자)"
    );
    console.log("   - 사용자-조직 관계 및 권한 설정");
    console.log("\n⚠️  보안 알림:");
    console.log("   기본 패스워드는 'Password123!' 입니다.");
    console.log("   운영 환경에서는 반드시 패스워드를 변경해주세요!");
  } catch (error) {
    console.error("\n💥 시드 데이터 실행 중 오류 발생:", error);
    console.error("시드 실행이 중단되었습니다.");
    throw error;
  } finally {
    // 연결 종료
    if (shouldCloseConnection && currentDataSource?.isInitialized) {
      try {
        await currentDataSource.destroy();
        console.log("\n🔌 데이터베이스 연결 종료");
      } catch (error) {
        console.error("데이터베이스 연결 종료 실패:", error);
      }
    }
  }
}

/**
 * 특정 시드 함수만 실행
 */
export async function runSpecificSeed(
  seedName: string,
  dataSource?: DataSource
): Promise<void> {
  const seedFunction = seedFunctions.find((sf) =>
    sf.name.toLowerCase().includes(seedName.toLowerCase())
  );

  if (!seedFunction) {
    const availableSeeds = seedFunctions.map((sf) => sf.name).join(", ");
    throw new Error(
      `시드 함수를 찾을 수 없습니다: ${seedName}\n사용 가능한 시드: ${availableSeeds}`
    );
  }

  console.log(`🎯 특정 시드 실행: ${seedFunction.name}`);

  let currentDataSource = dataSource;
  let shouldCloseConnection = false;

  try {
    if (!currentDataSource) {
      currentDataSource = await initializeDatabase();
      shouldCloseConnection = true;
    }

    await seedFunction.function(currentDataSource);
    console.log(`✅ ${seedFunction.name} 시드 완료`);
  } catch (error) {
    console.error(`❌ ${seedFunction.name} 시드 실패:`, error);
    throw error;
  } finally {
    if (shouldCloseConnection && currentDataSource?.isInitialized) {
      await currentDataSource.destroy();
    }
  }
}

/**
 * CLI에서 직접 실행될 때
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "--specific" && args[1]) {
    // 특정 시드만 실행
    runSpecificSeed(args[1])
      .then(() => {
        console.log("시드 실행 완료");
        process.exit(0);
      })
      .catch((error) => {
        console.error("시드 실행 실패:", error);
        process.exit(1);
      });
  } else {
    // 전체 시드 실행
    runAllSeeds()
      .then(() => {
        console.log("전체 시드 실행 완료");
        process.exit(0);
      })
      .catch((error) => {
        console.error("전체 시드 실행 실패:", error);
        process.exit(1);
      });
  }
}

// 개별 시드 함수들 export
export { seedOrganizations, seedAdminUsers, seedUserOrganizations };
