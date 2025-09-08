import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateUsersTable1757331860358 implements MigrationInterface {
  name = "CreateUsersTable1757331860358";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // UUID 확장 생성 (PostgreSQL)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // updated_at 자동 업데이트 함수 생성
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    // users 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 인증 정보 (FR-001, FR-004)
          {
            name: "email",
            type: "varchar",
            length: "255",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "password_hash",
            type: "varchar",
            length: "255",
            isNullable: false,
          },

          // 필수 개인 정보 (FR-001)
          {
            name: "name",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "baptismal_name",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "phone",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "birth_date",
            type: "date",
            isNullable: false,
          },
          {
            name: "position",
            type: "varchar",
            length: "100",
            isNullable: false,
          },

          // 선택 정보 (FR-002)
          {
            name: "address",
            type: "text",
            isNullable: true,
          },

          // 시스템 정보 (FR-008, FR-010)
          {
            name: "is_admin",
            type: "boolean",
            default: false,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
          },
          {
            name: "last_login_at",
            type: "timestamp",
            isNullable: true,
          },

          // 타임스탬프
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
        checks: [
          {
            name: "users_email_check",
            expression:
              "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
          },
          {
            name: "users_phone_check",
            expression: "phone ~ '^[0-9-]{10,15}$'",
          },
          {
            name: "users_name_length",
            expression: "LENGTH(name) >= 2",
          },
        ],
      }),
      true
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "idx_users_email",
        columnNames: ["email"],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "idx_users_name",
        columnNames: ["name"],
      })
    );

    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "idx_users_phone",
        columnNames: ["phone"],
      })
    );

    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "idx_users_active",
        columnNames: ["is_active"],
        where: "is_active = TRUE",
      })
    );

    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "idx_users_admin",
        columnNames: ["is_admin"],
        where: "is_admin = TRUE",
      })
    );

    // GIN 인덱스 생성 (전문 검색용)
    await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "pg_trgm";
        `);

    await queryRunner.query(`
            CREATE INDEX idx_users_name_search 
            ON users USING gin(name gin_trgm_ops);
        `);

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;`
    );

    // 인덱스 삭제
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_name_search;`);
    await queryRunner.dropIndex("users", "idx_users_admin");
    await queryRunner.dropIndex("users", "idx_users_active");
    await queryRunner.dropIndex("users", "idx_users_phone");
    await queryRunner.dropIndex("users", "idx_users_name");
    await queryRunner.dropIndex("users", "idx_users_email");

    // 테이블 삭제
    await queryRunner.dropTable("users");

    // 함수 삭제 (다른 테이블에서도 사용할 수 있으므로 주의)
    // await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column();`);
  }
}
