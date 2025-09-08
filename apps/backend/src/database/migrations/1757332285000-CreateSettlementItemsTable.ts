import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm";

export class CreateSettlementItemsTable1757332285000
  implements MigrationInterface
{
  name = "CreateSettlementItemsTable1757332285000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 결산 항목 유형 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE settlement_item_type AS ENUM ('INCOME', 'EXPENSE');
        `);

    // settlement_items 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "settlement_items",
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
            name: "settlement_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "created_by",
            type: "uuid",
            isNullable: false,
          },

          // 항목 기본 정보 (FR-025)
          {
            name: "item_type",
            type: "enum",
            enum: ["INCOME", "EXPENSE"],
            enumName: "settlement_item_type",
            isNullable: false,
          },
          {
            name: "category_name",
            type: "varchar",
            length: "100",
            isNullable: false,
            comment: "카테고리명 (기부금, 후원금, 식음료비 등)",
          },
          {
            name: "subcategory_name",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "세부 카테고리명",
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
            comment: "항목 설명",
          },

          // 금액 정보 (FR-025)
          {
            name: "planned_amount",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
            comment: "예산 금액",
          },
          {
            name: "actual_amount",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
            comment: "실제 금액",
          },
          {
            name: "variance_amount",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: false,
            default: 0,
            comment: "차이 금액 (실제 - 예산)",
          },
          {
            name: "variance_rate",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: "차이율 (%) ((실제-예산)/예산*100)",
          },
          {
            name: "currency",
            type: "varchar",
            length: "3",
            default: "'KRW'",
          },

          // 비교 분석 정보
          {
            name: "previous_year_amount",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: true,
            comment: "전년 동기 금액",
          },
          {
            name: "yoy_variance_amount",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: true,
            comment: "전년 대비 차이 금액",
          },
          {
            name: "yoy_variance_rate",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: "전년 대비 증감율 (%)",
          },

          // 통계 정보
          {
            name: "transaction_count",
            type: "integer",
            isNullable: false,
            default: 0,
            comment: "해당 카테고리 거래 건수",
          },
          {
            name: "average_amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
            comment: "건당 평균 금액",
          },
          {
            name: "max_amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
            comment: "최대 거래 금액",
          },
          {
            name: "min_amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
            comment: "최소 거래 금액",
          },

          // 백분율 정보
          {
            name: "percentage_of_total",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: "전체 대비 비율 (%)",
          },
          {
            name: "percentage_of_category",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: "같은 타입(수입/지출) 내 비율 (%)",
          },

          // 메타데이터
          {
            name: "notes",
            type: "text",
            isNullable: true,
            comment: "특이사항 및 메모",
          },
          {
            name: "sort_order",
            type: "integer",
            default: 0,
            comment: "정렬 순서",
          },
          {
            name: "is_highlighted",
            type: "boolean",
            default: false,
            comment: "강조 표시 여부",
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
            name: "settlement_items_amounts_positive",
            expression: "planned_amount >= 0 AND actual_amount >= 0",
          },
          {
            name: "settlement_items_variance_calculation",
            expression: "variance_amount = actual_amount - planned_amount",
          },
          {
            name: "settlement_items_category_length",
            expression: "LENGTH(category_name) >= 1",
          },
          {
            name: "settlement_items_currency_format",
            expression: "LENGTH(currency) = 3 AND currency ~ '^[A-Z]{3}$'",
          },
          {
            name: "settlement_items_transaction_count_positive",
            expression: "transaction_count >= 0",
          },
          {
            name: "settlement_items_percentage_valid",
            expression:
              "percentage_of_total IS NULL OR (percentage_of_total >= 0 AND percentage_of_total <= 100)",
          },
          {
            name: "settlement_items_category_percentage_valid",
            expression:
              "percentage_of_category IS NULL OR (percentage_of_category >= 0 AND percentage_of_category <= 100)",
          },
          {
            name: "settlement_items_variance_rate_reasonable",
            expression:
              "variance_rate IS NULL OR (variance_rate >= -100 AND variance_rate <= 1000)",
          },
        ],
      }),
      true
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "settlement_items",
      new TableForeignKey({
        columnNames: ["settlement_id"],
        referencedTableName: "settlements",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "settlement_items",
      new TableForeignKey({
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_settlement_id",
        columnNames: ["settlement_id"],
      })
    );

    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_type",
        columnNames: ["item_type"],
      })
    );

    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_category",
        columnNames: ["category_name"],
      })
    );

    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_subcategory",
        columnNames: ["subcategory_name"],
      })
    );

    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_actual_amount",
        columnNames: ["actual_amount"],
      })
    );

    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_variance_rate",
        columnNames: ["variance_rate"],
      })
    );

    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_highlighted",
        columnNames: ["is_highlighted"],
        where: "is_highlighted = TRUE",
      })
    );

    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_sort_order",
        columnNames: ["settlement_id", "sort_order"],
      })
    );

    // 복합 인덱스 (성능 최적화)
    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_type_category",
        columnNames: ["settlement_id", "item_type", "category_name"],
      })
    );

    await queryRunner.createIndex(
      "settlement_items",
      new TableIndex({
        name: "idx_settlement_items_type_amount",
        columnNames: ["item_type", "actual_amount"],
      })
    );

    // GIN 인덱스 (전문 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_settlement_items_category_search 
            ON settlement_items USING gin(category_name gin_trgm_ops);
        `);

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_settlement_items_updated_at
                BEFORE UPDATE ON settlement_items
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

    // 차이 금액 및 비율 자동 계산 트리거 생성
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_settlement_item_calculations()
            RETURNS TRIGGER AS $$
            BEGIN
                -- 차이 금액 계산
                NEW.variance_amount = NEW.actual_amount - NEW.planned_amount;
                
                -- 차이율 계산 (예산이 0이 아닌 경우)
                IF NEW.planned_amount != 0 THEN
                    NEW.variance_rate = (NEW.variance_amount / NEW.planned_amount) * 100;
                ELSE
                    NEW.variance_rate = NULL;
                END IF;
                
                -- 전년 대비 차이 계산
                IF NEW.previous_year_amount IS NOT NULL THEN
                    NEW.yoy_variance_amount = NEW.actual_amount - NEW.previous_year_amount;
                    
                    IF NEW.previous_year_amount != 0 THEN
                        NEW.yoy_variance_rate = (NEW.yoy_variance_amount / NEW.previous_year_amount) * 100;
                    ELSE
                        NEW.yoy_variance_rate = NULL;
                    END IF;
                END IF;
                
                -- 평균 금액 계산
                IF NEW.transaction_count > 0 THEN
                    NEW.average_amount = NEW.actual_amount / NEW.transaction_count;
                ELSE
                    NEW.average_amount = NULL;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE TRIGGER trigger_settlement_items_calculations
                BEFORE INSERT OR UPDATE ON settlement_items
                FOR EACH ROW
                EXECUTE FUNCTION update_settlement_item_calculations();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_settlement_items_calculations ON settlement_items;`
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_settlement_items_updated_at ON settlement_items;`
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_settlement_item_calculations();`
    );

    // 인덱스 삭제
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_settlement_items_category_search;`
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_type_amount"
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_type_category"
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_sort_order"
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_highlighted"
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_variance_rate"
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_actual_amount"
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_subcategory"
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_category"
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_type"
    );
    await queryRunner.dropIndex(
      "settlement_items",
      "idx_settlement_items_settlement_id"
    );

    // 외래키 삭제
    const table = await queryRunner.getTable("settlement_items");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("settlement_items", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("settlement_items");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS settlement_item_type;`);
  }
}
