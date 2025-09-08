import {
  MigrationInterface,
  QueryRunner,
  Table,
  Index,
  ForeignKey,
} from "typeorm";

export class CreateBudgetIncomesTable1757332265611
  implements MigrationInterface
{
  name = "CreateBudgetIncomesTable1757332265611";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 수입 상태 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE income_status AS ENUM (
                'PLANNED', 'RECEIVED', 'PARTIALLY_RECEIVED', 'OVERDUE', 'CANCELLED'
            );
        `);

    // 수입 분류 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE income_category AS ENUM (
                'DONATION', 'FUNDRAISING', 'MEMBERSHIP_FEE', 'SPONSORSHIP', 
                'GRANT', 'OFFERING', 'ACTIVITY_FEE', 'OTHER'
            );
        `);

    // budget_incomes 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "budget_incomes",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 관계 정보 (FR-023)
          {
            name: "budget_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "created_by",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "updated_by",
            type: "uuid",
            isNullable: true,
          },

          // 수입 기본 정보 (FR-023)
          {
            name: "item_name",
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
            name: "category",
            type: "enum",
            enum: [
              "DONATION",
              "FUNDRAISING",
              "MEMBERSHIP_FEE",
              "SPONSORSHIP",
              "GRANT",
              "OFFERING",
              "ACTIVITY_FEE",
              "OTHER",
            ],
            enumName: "income_category",
            isNullable: false,
          },
          {
            name: "subcategory",
            type: "varchar",
            length: "100",
            isNullable: true,
          },

          // 금액 정보 (FR-023)
          {
            name: "planned_amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "actual_amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
            default: 0,
          },
          {
            name: "currency",
            type: "varchar",
            length: "3",
            default: "'KRW'",
          },

          // 날짜 정보
          {
            name: "expected_date",
            type: "date",
            isNullable: false,
          },
          {
            name: "actual_date",
            type: "date",
            isNullable: true,
          },

          // 상태 및 진행 정보
          {
            name: "status",
            type: "enum",
            enum: [
              "PLANNED",
              "RECEIVED",
              "PARTIALLY_RECEIVED",
              "OVERDUE",
              "CANCELLED",
            ],
            enumName: "income_status",
            default: "'PLANNED'",
          },
          {
            name: "completion_rate",
            type: "decimal",
            precision: 5,
            scale: 2,
            default: 0,
            comment: "완료율 (0.00-100.00%)",
          },

          // 출처 정보
          {
            name: "source_name",
            type: "varchar",
            length: "200",
            isNullable: true,
            comment: "수입원 이름",
          },
          {
            name: "source_contact",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "연락처",
          },
          {
            name: "source_notes",
            type: "text",
            isNullable: true,
            comment: "출처 관련 메모",
          },

          // 결제 및 처리 정보
          {
            name: "payment_method",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "결제 방식",
          },
          {
            name: "reference_number",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "참조 번호",
          },
          {
            name: "receipt_required",
            type: "boolean",
            default: false,
            comment: "영수증 발행 필요",
          },
          {
            name: "receipt_issued",
            type: "boolean",
            default: false,
            comment: "영수증 발행 완료",
          },

          // 메타데이터
          {
            name: "priority_level",
            type: "integer",
            default: 5,
            comment: "우선순위 (1-10, 높을수록 중요)",
          },
          {
            name: "is_recurring",
            type: "boolean",
            default: false,
            comment: "정기 수입 여부",
          },
          {
            name: "recurring_pattern",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "반복 패턴 (monthly, quarterly 등)",
          },
          {
            name: "tags",
            type: "text",
            isNullable: true,
            comment: "태그 (JSON 배열 형태)",
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
            name: "budget_incomes_amounts_positive",
            expression:
              "planned_amount >= 0 AND (actual_amount IS NULL OR actual_amount >= 0)",
          },
          {
            name: "budget_incomes_completion_rate",
            expression: "completion_rate >= 0 AND completion_rate <= 100",
          },
          {
            name: "budget_incomes_priority_range",
            expression: "priority_level >= 1 AND priority_level <= 10",
          },
          {
            name: "budget_incomes_item_name_length",
            expression: "LENGTH(item_name) >= 2",
          },
          {
            name: "budget_incomes_date_logic",
            expression:
              "actual_date IS NULL OR expected_date <= actual_date + INTERVAL '1 year'",
          },
          {
            name: "budget_incomes_currency_format",
            expression: "LENGTH(currency) = 3 AND currency ~ '^[A-Z]{3}$'",
          },
          {
            name: "budget_incomes_recurring_pattern",
            expression:
              "(is_recurring = FALSE AND recurring_pattern IS NULL) OR (is_recurring = TRUE AND recurring_pattern IS NOT NULL)",
          },
        ],
      }),
      true,
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "budget_incomes",
      new ForeignKey({
        columnNames: ["budget_id"],
        referencedTableName: "budgets",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "budget_incomes",
      new ForeignKey({
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );

    await queryRunner.createForeignKey(
      "budget_incomes",
      new ForeignKey({
        columnNames: ["updated_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_budget_id", ["budget_id"]),
    );

    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_created_by", ["created_by"]),
    );

    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_category", ["category"]),
    );

    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_status", ["status"]),
    );

    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_expected_date", ["expected_date"], {
        order: { expected_date: "ASC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_actual_date", ["actual_date"], {
        order: { actual_date: "DESC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_priority", ["priority_level"], {
        order: { priority_level: "DESC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_recurring", ["is_recurring"], {
        where: "is_recurring = TRUE",
      }),
    );

    // 복합 인덱스 (성능 최적화)
    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_budget_status", ["budget_id", "status"], {
        order: { budget_id: "ASC", status: "ASC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_incomes",
      new Index(
        "idx_budget_incomes_category_date",
        ["category", "expected_date"],
        {
          order: { category: "ASC", expected_date: "ASC" },
        },
      ),
    );

    await queryRunner.createIndex(
      "budget_incomes",
      new Index("idx_budget_incomes_status_date", ["status", "expected_date"], {
        order: { status: "ASC", expected_date: "ASC" },
      }),
    );

    // GIN 인덱스 (전문 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_budget_incomes_item_name_search 
            ON budget_incomes USING gin(item_name gin_trgm_ops);
        `);

    await queryRunner.query(`
            CREATE INDEX idx_budget_incomes_source_name_search 
            ON budget_incomes USING gin(source_name gin_trgm_ops)
            WHERE source_name IS NOT NULL;
        `);

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_budget_incomes_updated_at
                BEFORE UPDATE ON budget_incomes
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

    // 완료율 자동 계산 트리거 생성
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_income_completion_rate()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.planned_amount > 0 THEN
                    NEW.completion_rate = COALESCE(NEW.actual_amount, 0) / NEW.planned_amount * 100;
                ELSE
                    NEW.completion_rate = 0;
                END IF;
                
                -- 완료율에 따른 상태 자동 업데이트
                IF NEW.completion_rate >= 100 THEN
                    NEW.status = 'RECEIVED';
                ELSIF NEW.completion_rate > 0 AND NEW.completion_rate < 100 THEN
                    NEW.status = 'PARTIALLY_RECEIVED';
                ELSIF NEW.expected_date < CURRENT_DATE AND NEW.actual_amount IS NULL THEN
                    NEW.status = 'OVERDUE';
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE TRIGGER trigger_budget_incomes_completion_rate
                BEFORE INSERT OR UPDATE ON budget_incomes
                FOR EACH ROW
                EXECUTE FUNCTION update_income_completion_rate();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_budget_incomes_completion_rate ON budget_incomes;`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_budget_incomes_updated_at ON budget_incomes;`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_income_completion_rate();`,
    );

    // 인덱스 삭제
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_budget_incomes_source_name_search;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_budget_incomes_item_name_search;`,
    );
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_status_date",
    );
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_category_date",
    );
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_budget_status",
    );
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_recurring",
    );
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_priority",
    );
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_actual_date",
    );
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_expected_date",
    );
    await queryRunner.dropIndex("budget_incomes", "idx_budget_incomes_status");
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_category",
    );
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_created_by",
    );
    await queryRunner.dropIndex(
      "budget_incomes",
      "idx_budget_incomes_budget_id",
    );

    // 외래키 삭제
    const table = await queryRunner.getTable("budget_incomes");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("budget_incomes", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("budget_incomes");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS income_category;`);
    await queryRunner.query(`DROP TYPE IF EXISTS income_status;`);
  }
}
