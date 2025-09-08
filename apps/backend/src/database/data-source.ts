import { DataSource } from "typeorm";
import { getDatabaseConfig } from "../config/database.config";
import * as dotenv from "dotenv";

// 환경 변수 로드
dotenv.config({ path: ".env.development" });

/**
 * TypeORM CLI용 DataSource 설정
 * 마이그레이션 생성, 실행, 스키마 동기화 등에 사용
 */
export const AppDataSource = new DataSource({
  ...getDatabaseConfig(),
  // CLI에서 사용할 때는 TS 파일을 직접 사용
  entities: [__dirname + "/../**/*.entity.ts"],
  migrations: [__dirname + "/migrations/*.ts"],
  subscribers: [__dirname + "/../**/*.subscriber.ts"],
} as any);

/**
 * 데이터베이스 연결 초기화
 * 애플리케이션 시작 시 또는 테스트에서 사용
 */
export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ 데이터베이스 연결이 성공적으로 초기화되었습니다.");
    }
    return AppDataSource;
  } catch (error) {
    console.error("❌ 데이터베이스 연결 초기화 실패:", error);
    throw error;
  }
};

/**
 * 데이터베이스 연결 종료
 */
export const destroyDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("✅ 데이터베이스 연결이 성공적으로 종료되었습니다.");
    }
  } catch (error) {
    console.error("❌ 데이터베이스 연결 종료 실패:", error);
    throw error;
  }
};

/**
 * 테스트용 데이터베이스 설정
 */
export const createTestDataSource = (): DataSource => {
  return new DataSource({
    ...getDatabaseConfig(),
    database: process.env.TEST_DATABASE_NAME || "recipt_test_db",
    synchronize: true,
    logging: false,
    dropSchema: true,
    entities: [__dirname + "/../**/*.entity.ts"],
    migrations: [__dirname + "/migrations/*.ts"],
  });
};

// CLI 명령어 실행 시 자동 초기화 (옵션)
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("DataSource가 준비되었습니다.");
    })
    .catch((error) => {
      console.error("DataSource 초기화 실패:", error);
      process.exit(1);
    });
}

export default AppDataSource;
