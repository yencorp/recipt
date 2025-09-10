/* eslint-disable no-console */
import { DataSource } from "typeorm";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Task 2.12: 백업/복원 자동화 스크립트
 *
 * PostgreSQL 데이터베이스의 백업과 복원을 자동화하는 도구
 * pg_dump와 psql을 활용한 안전한 백업/복원 시스템
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
 */
export async function createBackup(
  options: BackupOptions = {},
  _dataSource?: DataSource
): Promise<string> {
  const config = {
    type: "full" as const,
    compress: true,
    directory: path.join(process.cwd(), "backups"),
    ...options,
  };

  console.log("🚀 데이터베이스 백업을 시작합니다...");
  console.log(
    `백업 유형: ${config.type}, 압축: ${config.compress ? "ON" : "OFF"}`
  );

  // 환경변수에서 DB 설정 가져오기
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "5432",
    username: process.env.DB_USER || process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || process.env.DB_DATABASE || "recipt_dev",
  };

  // 백업 디렉토리 생성
  if (!fs.existsSync(config.directory!)) {
    fs.mkdirSync(config.directory!, { recursive: true });
    console.log(`✅ 백업 디렉토리 생성: ${config.directory}`);
  }

  // 백업 파일명 생성
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const backupFilename = `backup-${config.type}-${timestamp}.sql${
    config.compress ? ".gz" : ""
  }`;
  const backupPath = path.join(config.directory!, backupFilename);

  try {
    // pg_dump 옵션 설정
    let pgDumpOptions = [
      `-h ${dbConfig.host}`,
      `-p ${dbConfig.port}`,
      `-U ${dbConfig.username}`,
      `--no-password`,
      `--verbose`,
    ];

    // 백업 타입에 따른 옵션
    switch (config.type) {
      case "schema":
        pgDumpOptions.push("--schema-only");
        break;
      case "data":
        pgDumpOptions.push("--data-only");
        break;
      default: // 'full'
        pgDumpOptions.push("--clean", "--create");
        break;
    }

    // 압축 옵션
    const outputCmd = config.compress
      ? `| gzip > "${backupPath}"`
      : `> "${backupPath}"`;

    // 환경변수 설정 (비밀번호)
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password,
    };

    // pg_dump 실행
    const command = `pg_dump ${pgDumpOptions.join(" ")} ${
      dbConfig.database
    } ${outputCmd}`;
    console.log(
      `실행 명령어: pg_dump ${pgDumpOptions
        .filter((opt) => !opt.includes("password"))
        .join(" ")} ${dbConfig.database} ${outputCmd}`
    );

    execSync(command, {
      stdio: ["inherit", "pipe", "inherit"],
      env,
    });

    // 백업 파일 확인
    if (!fs.existsSync(backupPath)) {
      throw new Error("백업 파일이 생성되지 않았습니다.");
    }

    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ 백업 완료!`);
    console.log(`   파일: ${backupPath}`);
    console.log(`   크기: ${fileSizeMB} MB`);
    console.log(`   타입: ${config.type}`);

    return backupPath;
  } catch (error) {
    console.error("❌ 백업 실패:", error);

    // 실패한 백업 파일 정리
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }

    throw new Error(
      `백업 실패: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 백업 복원
 */
export async function restoreBackup(
  options: RestoreOptions,
  _dataSource?: DataSource
): Promise<void> {
  const config = {
    dropExisting: false,
    noValidate: false,
    noBackup: false,
    ...options,
  };

  console.log("🚀 데이터베이스 복원을 시작합니다...");
  console.log(`복원 파일: ${config.backupFile}`);

  // 백업 파일 존재 확인
  if (!fs.existsSync(config.backupFile)) {
    throw new Error(`백업 파일을 찾을 수 없습니다: ${config.backupFile}`);
  }

  // 환경변수에서 DB 설정 가져오기
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "5432",
    username: process.env.DB_USER || process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || process.env.DB_DATABASE || "recipt_dev",
  };

  try {
    // 복원 전 현재 DB 백업 (안전장치)
    if (!config.noBackup) {
      console.log("🔒 복원 전 안전 백업 생성 중...");
      const safetyBackupPath = await createBackup({
        type: "full",
        compress: true,
        directory: path.join(process.cwd(), "backups", "safety"),
      });
      console.log(`✅ 안전 백업 완료: ${safetyBackupPath}`);
    }

    // 환경변수 설정
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password,
    };

    // 압축 파일 처리
    const isCompressed = config.backupFile.endsWith(".gz");
    let restoreCommand: string;

    if (isCompressed) {
      restoreCommand = `gunzip -c "${config.backupFile}" | psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --no-password`;
    } else {
      restoreCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --no-password -f "${config.backupFile}"`;
    }

    console.log("📥 데이터베이스 복원 실행 중...");
    console.log(
      `실행 명령어: ${restoreCommand.replace(
        /PGPASSWORD=[^ ]+/,
        "PGPASSWORD=***"
      )}`
    );

    execSync(restoreCommand, {
      stdio: ["inherit", "pipe", "inherit"],
      env,
    });

    // 복원 후 검증 (선택적)
    if (!config.noValidate) {
      console.log("🔍 복원 데이터 검증 중...");
      await validateRestoration(dbConfig);
    }

    console.log("✅ 데이터베이스 복원 완료!");
  } catch (error) {
    console.error("❌ 복원 실패:", error);
    console.log("💡 안전 백업에서 롤백을 고려해주세요.");
    throw new Error(
      `복원 실패: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 복원 후 데이터 검증
 */
async function validateRestoration(dbConfig: any): Promise<void> {
  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password,
  };

  try {
    // 기본 테이블 존재 확인
    const tableCheckCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --no-password -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`;

    const result = execSync(tableCheckCommand, {
      stdio: ["pipe", "pipe", "pipe"],
      env,
      encoding: "utf8",
    });

    const tableCount = parseInt(result.trim());

    if (tableCount > 0) {
      console.log(`✅ 검증 완료: ${tableCount}개 테이블이 복원되었습니다.`);
    } else {
      console.warn("⚠️ 경고: 복원된 테이블이 없습니다.");
    }
  } catch (error) {
    console.warn("⚠️ 검증 중 오류 발생:", error);
  }
}

/**
 * 백업 목록 조회
 */
export async function listBackups(directory?: string): Promise<void> {
  const backupDir = directory || path.join(process.cwd(), "backups");

  console.log("📋 백업 파일 목록 조회...");
  console.log(`디렉토리: ${backupDir}`);

  if (!fs.existsSync(backupDir)) {
    console.log("❌ 백업 디렉토리가 존재하지 않습니다.");
    console.log("백업을 먼저 생성해주세요: npm run db:backup");
    return;
  }

  try {
    const files = fs.readdirSync(backupDir, { withFileTypes: true });
    const backupFiles = files
      .filter(
        (file) =>
          file.isFile() &&
          (file.name.endsWith(".sql") || file.name.endsWith(".sql.gz"))
      )
      .map((file) => {
        const filePath = path.join(backupDir, file.name);
        const stats = fs.statSync(filePath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        return {
          name: file.name,
          path: filePath,
          size: `${fileSizeMB} MB`,
          created: stats.ctime.toLocaleString("ko-KR"),
          modified: stats.mtime.toLocaleString("ko-KR"),
        };
      })
      .sort((a, b) => b.name.localeCompare(a.name)); // 최신 순으로 정렬

    if (backupFiles.length === 0) {
      console.log("📁 백업 파일이 없습니다.");
      return;
    }

    console.log(`\n📊 총 ${backupFiles.length}개의 백업 파일을 찾았습니다:\n`);

    // 테이블 형태로 출력
    console.log(
      "파일명".padEnd(35) +
        "크기".padEnd(12) +
        "생성일시".padEnd(25) +
        "수정일시"
    );
    console.log("─".repeat(90));

    backupFiles.forEach((file) => {
      console.log(
        file.name.padEnd(35) +
          file.size.padEnd(12) +
          file.created.padEnd(25) +
          file.modified
      );
    });

    console.log("\n💡 복원 방법:");
    console.log(`   npm run db:restore -- "${backupFiles[0]?.path}"`);
  } catch (error) {
    console.error("❌ 백업 목록 조회 실패:", error);
  }
}

/**
 * CLI에서 직접 실행될 때
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const subType = args[1];

  console.log("🚀 PostgreSQL 백업/복원 도구");
  console.log("사용법:");
  console.log("  npm run db:backup [full|schema|data]");
  console.log("  npm run db:restore -- <backup-file>");
  console.log("  npm run db:list-backups");

  switch (command) {
    case "backup": {
      const backupType =
        subType === "schema" || subType === "data" ? subType : "full";
      createBackup({ type: backupType })
        .then((backupPath) => {
          console.log(`✅ 백업 완료: ${backupPath}`);
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ 백업 실패:", error.message);
          process.exit(1);
        });
      break;
    }

    case "restore":
      if (!args[1]) {
        console.error("❌ 백업 파일을 지정해주세요");
        console.error(
          "예시: npm run db:restore -- ./backups/backup-full-2024-01-01.sql"
        );
        process.exit(1);
      }
      restoreBackup({ backupFile: args[1] })
        .then(() => {
          console.log("✅ 복원 완료");
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ 복원 실패:", error.message);
          process.exit(1);
        });
      break;

    case "list":
      listBackups()
        .then(() => {
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ 목록 조회 실패:", error.message);
          process.exit(1);
        });
      break;

    default:
      console.error("❌ 알 수 없는 명령어:", command);
      console.log("사용 가능한 명령어: backup, restore, list");
      process.exit(1);
  }
}
