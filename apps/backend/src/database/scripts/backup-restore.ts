/* eslint-disable no-console */
import { DataSource } from "typeorm";

/**
 * Task 2.12: 백업/복원 자동화 스크립트
 *
 * TODO: 타입 오류 수정 필요 (PostgreSQL 타입 캐스팅 문제)
 * 현재는 수동 백업/복원을 사용해주세요: pg_dump, psql 명령어
 */

interface BackupOptions {
  type?: "full" | "schema" | "data";
  compress?: boolean;
  encrypt?: boolean;
  keepDays?: number;
  directory?: string;
}

interface RestoreOptions {
  backupFile: string;
  dropExisting?: boolean;
  noValidate?: boolean;
  noBackup?: boolean;
}

/**
 * 백업 생성
 * TODO: 타입 오류 수정 필요
 */
export async function createBackup(
  options: BackupOptions = {},
  _dataSource?: DataSource
): Promise<void> {
  console.log("⚠️  backup-restore 스크립트는 현재 비활성화되었습니다.");
  console.log("타입 오류 수정이 필요합니다.");
  console.log(`백업 요청: ${JSON.stringify(options)}`);
  console.log(
    "현재는 수동 백업을 사용해주세요: pg_dump -U username database_name > backup.sql"
  );
}

/**
 * 백업 복원
 * TODO: 타입 오류 수정 필요
 */
export async function restoreBackup(
  options: RestoreOptions,
  _dataSource?: DataSource
): Promise<void> {
  console.log("⚠️  backup-restore 스크립트는 현재 비활성화되었습니다.");
  console.log("타입 오류 수정이 필요합니다.");
  console.log(`복원 요청: ${JSON.stringify(options)}`);
  console.log(
    "현재는 수동 복원을 사용해주세요: psql -U username database_name < backup.sql"
  );
}

/**
 * 백업 목록 조회
 */
export async function listBackups(_directory?: string): Promise<void> {
  console.log("⚠️  백업 목록 기능은 현재 비활성화되었습니다.");
  console.log("수동으로 백업 디렉토리를 확인해주세요.");
}

/**
 * CLI에서 직접 실행될 때
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🚀 백업/복원 도구 (비활성화)");
  console.log("사용법:");
  console.log("  npm run db:backup");
  console.log("  npm run db:restore -- backup-file.sql");
  console.log("  npm run db:list-backups");

  switch (command) {
    case "backup":
      createBackup()
        .then(() => {
          console.log("✅ 백업 명령 완료 (비활성화 상태)");
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ 백업 명령 실패:", error);
          process.exit(1);
        });
      break;

    case "restore":
      if (!args[1]) {
        console.error("❌ 백업 파일을 지정해주세요");
        process.exit(1);
      }
      restoreBackup({ backupFile: args[1] })
        .then(() => {
          console.log("✅ 복원 명령 완료 (비활성화 상태)");
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ 복원 명령 실패:", error);
          process.exit(1);
        });
      break;

    case "list":
      listBackups()
        .then(() => {
          console.log("✅ 목록 조회 완료 (비활성화 상태)");
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ 목록 조회 실패:", error);
          process.exit(1);
        });
      break;

    default:
      console.log("⚠️  알 수 없는 명령어:", command);
      console.log("사용 가능한 명령어: backup, restore, list");
      process.exit(1);
  }
}
