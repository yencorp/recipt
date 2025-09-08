import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm";

export class CreateSettlementsTable1757332280000 implements MigrationInterface {
  name = "CreateSettlementsTable1757332280000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 결산 상태 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE settlement_status AS ENUM (
                'DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'
            );
        `);

    // 결산 주기 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE settlement_period_type AS ENUM (
                'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'EVENT_BASED'
            );
        `);

    // settlements 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "settlements",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 관계 정보 (FR-025)
          {
            name: "event_id",
            type: "uuid",
            isNullable: true,
            comment: "특정 행사 결산인 경우",
          },
          {
            name: "organization_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "created_by",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "reviewed_by",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "approved_by",
            type: "uuid",
            isNullable: true,
          },

          // 결산 기본 정보 (FR-025)
          {
            name: "title",
            type: "varchar",
            length: "200",
            isNullable: false,
            comment: "결산 제목",
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
            comment: "결산 설명",
          },
          {
            name: "period_type",
            type: "enum",
            enum: [
              "MONTHLY",
              "QUARTERLY",
              "SEMI_ANNUAL",
              "ANNUAL",
              "EVENT_BASED",
            ],
            enumName: "settlement_period_type",
            isNullable: false,
          },
          {
            name: "settlement_year",
            type: "integer",
            isNullable: false,
            comment: "결산 연도",
          },
          {
            name: "settlement_period",
            type: "integer",
            isNullable: true,
            comment: "결산 기간 (월: 1-12, 분기: 1-4)",
          },
          {
            name: "period_start_date",
            type: "date",
            isNullable: false,
            comment: "결산 기간 시작일",
          },
          {
            name: "period_end_date",
            type: "date",
            isNullable: false,
            comment: "결산 기간 종료일",
          },

          // 재무 요약 정보 (FR-025)
          {
            name: "total_income",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
            comment: "총 수입",
          },
          {
            name: "total_expense",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
            comment: "총 지출",
          },
          {
            name: "net_amount",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
            comment: "순 수입 (수입 - 지출)",
          },
          {
            name: "budget_variance",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: true,
            comment: "예산 대비 차이",
          },
          {
            name: "budget_variance_rate",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: "예산 대비 차이율 (%)",
          },
          {
            name: "currency",
            type: "varchar",
            length: "3",
            default: "'KRW'",
          },

          // 상태 및 진행 정보
          {
            name: "status",
            type: "enum",
            enum: ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"],
            enumName: "settlement_status",
            default: "'DRAFT'",
          },
          {
            name: "submitted_at",
            type: "timestamp",
            isNullable: true,
            comment: "검토 제출 시간",
          },
          {
            name: "reviewed_at",
            type: "timestamp",
            isNullable: true,
            comment: "검토 완료 시간",
          },
          {
            name: "approved_at",
            type: "timestamp",
            isNullable: true,
            comment: "승인 시간",
          },
          {
            name: "published_at",
            type: "timestamp",
            isNullable: true,
            comment: "공개 시간",
          },

          // 보고서 및 첨부파일
          {
            name: "report_file_path",
            type: "varchar",
            length: "500",
            isNullable: true,
            comment: "결산 보고서 파일 경로",
          },
          {
            name: "attachments",
            type: "text",
            isNullable: true,
            comment: "첨부파일 목록 (JSON 배열)",
          },

          // 메타데이터
          {
            name: "notes",
            type: "text",
            isNullable: true,
            comment: "특이사항 및 메모",
          },
          {
            name: "approval_notes",
            type: "text",
            isNullable: true,
            comment: "승인자 의견",
          },
          {
            name: "version",
            type: "integer",
            default: 1,
            comment: "결산 버전",
          },
          {
            name: "is_final",
            type: "boolean",
            default: false,
            comment: "최종 결산 여부",
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
            name: "settlements_period_order",
            expression: "period_start_date <= period_end_date",
          },
          {
            name: "settlements_amounts_calculation",
            expression: "net_amount = total_income - total_expense",
          },
          {
            name: "settlements_year_valid",
            expression: "settlement_year >= 2020 AND settlement_year <= 2100",
          },
          {
            name: "settlements_period_valid",
            expression:
              "settlement_period IS NULL OR (settlement_period >= 1 AND settlement_period <= 12)",
          },
          {
            name: "settlements_title_length",
            expression: "LENGTH(title) >= 2",
          },
          {
            name: "settlements_currency_format",
            expression: "LENGTH(currency) = 3 AND currency ~ '^[A-Z]{3}$'",
          },
          {
            name: "settlements_version_positive",
            expression: "version >= 1",
          },
          {
            name: "settlements_variance_rate",
            expression:
              "budget_variance_rate IS NULL OR (budget_variance_rate >= -100 AND budget_variance_rate <= 1000)",
          },
        ],
        uniques: [
          {
            name: "settlements_unique_period",
            columnNames: [
              "organization_id",
              "period_type",
              "settlement_year",
              "settlement_period",
            ],
          },
        ],
      }),
      true
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "settlements",
      new TableForeignKey({
        columnNames: ["event_id"],
        referencedTableName: "events",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    await queryRunner.createForeignKey(
      "settlements",
      new TableForeignKey({
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    await queryRunner.createForeignKey(
      "settlements",
      new TableForeignKey({
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    await queryRunner.createForeignKey(
      "settlements",
      new TableForeignKey({
        columnNames: ["reviewed_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    await queryRunner.createForeignKey(
      "settlements",
      new TableForeignKey({
        columnNames: ["approved_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_organization_id",
        columnNames: ["organization_id"],
      })
    );

    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_event_id",
        columnNames: ["event_id"],
      })
    );

    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_status",
        columnNames: ["status"],
      })
    );

    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_period_type",
        columnNames: ["period_type"],
      })
    );

    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_year",
        columnNames: ["settlement_year"],
      })
    );

    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_period_dates",
        columnNames: ["period_start_date", "period_end_date"],
      })
    );

    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_final",
        columnNames: ["is_final"],
        where: "is_final = TRUE",
      })
    );

    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_published",
        columnNames: ["published_at"],
        where: "published_at IS NOT NULL",
      })
    );

    // 복합 인덱스 (성능 최적화)
    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_org_year",
        columnNames: ["organization_id", "settlement_year"],
      })
    );

    await queryRunner.createIndex(
      "settlements",
      new TableIndex({
        name: "idx_settlements_status_year",
        columnNames: ["status", "settlement_year"],
      })
    );

    // GIN 인덱스 (전문 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_settlements_title_search 
            ON settlements USING gin(title gin_trgm_ops);
        `);

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_settlements_updated_at
                BEFORE UPDATE ON settlements
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

    // net_amount 자동 계산 트리거 생성
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_settlement_net_amount()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.net_amount = NEW.total_income - NEW.total_expense;
                
                -- 예산 대비 차이율 계산 (예산 정보가 있는 경우)
                IF NEW.budget_variance IS NOT NULL AND NEW.total_expense > 0 THEN
                    NEW.budget_variance_rate = (NEW.budget_variance / NEW.total_expense) * 100;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE TRIGGER trigger_settlements_net_amount
                BEFORE INSERT OR UPDATE ON settlements
                FOR EACH ROW
                EXECUTE FUNCTION update_settlement_net_amount();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_settlements_net_amount ON settlements;`
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_settlements_updated_at ON settlements;`
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_settlement_net_amount();`
    );

    // 인덱스 삭제
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_settlements_title_search;`
    );
    await queryRunner.dropIndex("settlements", "idx_settlements_status_year");
    await queryRunner.dropIndex("settlements", "idx_settlements_org_year");
    await queryRunner.dropIndex("settlements", "idx_settlements_published");
    await queryRunner.dropIndex("settlements", "idx_settlements_final");
    await queryRunner.dropIndex("settlements", "idx_settlements_period_dates");
    await queryRunner.dropIndex("settlements", "idx_settlements_year");
    await queryRunner.dropIndex("settlements", "idx_settlements_period_type");
    await queryRunner.dropIndex("settlements", "idx_settlements_status");
    await queryRunner.dropIndex("settlements", "idx_settlements_event_id");
    await queryRunner.dropIndex(
      "settlements",
      "idx_settlements_organization_id"
    );

    // 외래키 삭제
    const table = await queryRunner.getTable("settlements");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("settlements", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("settlements");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS settlement_period_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS settlement_status;`);
  }
}
