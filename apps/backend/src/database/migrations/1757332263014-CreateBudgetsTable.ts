import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class CreateBudgetsTable1757332263014 implements MigrationInterface {
  name = "CreateBudgetsTable1757332263014";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 예산 상태 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE budget_status AS ENUM (
                'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED'
            );
        `);

    // budgets 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "budgets",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 관계 정보 (FR-021, FR-022)
          {
            name: "event_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "created_by",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "approved_by",
            type: "uuid",
            isNullable: true,
          },

          // 예산 기본 정보 (FR-021)
          {
            name: "title",
            type: "varchar",
            length: "200",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "budget_year",
            type: "integer",
            isNullable: false,
          },
          {
            name: "budget_period_start",
            type: "date",
            isNullable: false,
          },
          {
            name: "budget_period_end",
            type: "date",
            isNullable: false,
          },

          // 예산 금액 정보 (FR-022)
          {
            name: "total_budget",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
          },
          {
            name: "income_budget",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
          },
          {
            name: "expense_budget",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
          },
          {
            name: "used_amount",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
          },
          {
            name: "remaining_amount",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
          },

          // 상태 및 승인 정보
          {
            name: "status",
            type: "enum",
            enum: [
              "DRAFT",
              "SUBMITTED",
              "APPROVED",
              "REJECTED",
              "ACTIVE",
              "CLOSED",
            ],
            enumName: "budget_status",
            default: "'DRAFT'",
          },
          {
            name: "submitted_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "approved_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "rejection_reason",
            type: "text",
            isNullable: true,
          },

          // 메타데이터
          {
            name: "is_template",
            type: "boolean",
            default: false,
          },
          {
            name: "template_name",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "version",
            type: "integer",
            default: 1,
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
            name: "budgets_period_order",
            expression: "budget_period_start <= budget_period_end",
          },
          {
            name: "budgets_amounts_positive",
            expression:
              "total_budget >= 0 AND income_budget >= 0 AND expense_budget >= 0 AND used_amount >= 0 AND remaining_amount >= 0",
          },
          {
            name: "budgets_balance_check",
            expression: "income_budget - expense_budget = total_budget",
          },
          {
            name: "budgets_remaining_calculation",
            expression: "remaining_amount = total_budget - used_amount",
          },
          {
            name: "budgets_title_length",
            expression: "LENGTH(title) >= 2",
          },
          {
            name: "budgets_year_valid",
            expression: "budget_year >= 2020 AND budget_year <= 2100",
          },
        ],
      }),
      true
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "budgets",
      new TableForeignKey({
        columnNames: ["event_id"],
        referencedTableName: "events",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    await queryRunner.createForeignKey(
      "budgets",
      new TableForeignKey({
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    await queryRunner.createForeignKey(
      "budgets",
      new TableForeignKey({
        columnNames: ["approved_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "budgets",
      new TableIndex({
        name: "idx_budgets_event_id",
        columnNames: ["event_id"],
      })
    );

    await queryRunner.createIndex(
      "budgets",
      new TableIndex({
        name: "idx_budgets_created_by",
        columnNames: ["created_by"],
      })
    );

    await queryRunner.createIndex(
      "budgets",
      new TableIndex({
        name: "idx_budgets_approved_by",
        columnNames: ["approved_by"],
      })
    );

    await queryRunner.createIndex(
      "budgets",
      new TableIndex({
        name: "idx_budgets_status",
        columnNames: ["status"],
      })
    );

    await queryRunner.createIndex(
      "budgets",
      new TableIndex({
        name: "idx_budgets_year",
        columnNames: ["budget_year"],
      })
    );

    await queryRunner.createIndex(
      "budgets",
      new TableIndex({
        name: "idx_budgets_period",
        columnNames: ["budget_period_start", "budget_period_end"],
      })
    );

    await queryRunner.createIndex(
      "budgets",
      new TableIndex({
        name: "idx_budgets_template",
        columnNames: ["is_template"],
        where: "is_template = TRUE",
      })
    );

    // 복합 인덱스 (성능 최적화)
    await queryRunner.createIndex(
      "budgets",
      new TableIndex({
        name: "idx_budgets_event_status",
        columnNames: ["event_id", "status"],
      })
    );

    await queryRunner.createIndex(
      "budgets",
      new TableIndex({
        name: "idx_budgets_year_status",
        columnNames: ["budget_year", "status"],
      })
    );

    // GIN 인덱스 (전문 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_budgets_title_search 
            ON budgets USING gin(title gin_trgm_ops);
        `);

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_budgets_updated_at
                BEFORE UPDATE ON budgets
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

    // remaining_amount 자동 계산 트리거 생성
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_budget_remaining_amount()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.remaining_amount = NEW.total_budget - NEW.used_amount;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE TRIGGER trigger_budgets_remaining_amount
                BEFORE INSERT OR UPDATE ON budgets
                FOR EACH ROW
                EXECUTE FUNCTION update_budget_remaining_amount();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_budgets_remaining_amount ON budgets;`
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_budgets_updated_at ON budgets;`
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_budget_remaining_amount();`
    );

    // 인덱스 삭제
    await queryRunner.query(`DROP INDEX IF EXISTS idx_budgets_title_search;`);
    await queryRunner.dropIndex("budgets", "idx_budgets_year_status");
    await queryRunner.dropIndex("budgets", "idx_budgets_event_status");
    await queryRunner.dropIndex("budgets", "idx_budgets_template");
    await queryRunner.dropIndex("budgets", "idx_budgets_period");
    await queryRunner.dropIndex("budgets", "idx_budgets_year");
    await queryRunner.dropIndex("budgets", "idx_budgets_status");
    await queryRunner.dropIndex("budgets", "idx_budgets_approved_by");
    await queryRunner.dropIndex("budgets", "idx_budgets_created_by");
    await queryRunner.dropIndex("budgets", "idx_budgets_event_id");

    // 외래키 삭제
    const table = await queryRunner.getTable("budgets");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("budgets", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("budgets");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS budget_status;`);
  }
}
