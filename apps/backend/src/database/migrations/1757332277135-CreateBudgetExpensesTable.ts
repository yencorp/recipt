import {
  MigrationInterface,
  QueryRunner,
  Table,
  Index,
  ForeignKey,
} from "typeorm";

export class CreateBudgetExpensesTable1757332277135
  implements MigrationInterface
{
  name = "CreateBudgetExpensesTable1757332277135";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 지출 상태 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE expense_status AS ENUM (
                'PLANNED', 'APPROVED', 'PURCHASED', 'PAID', 'CANCELLED', 'REFUNDED'
            );
        `);

    // 지출 분류 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE expense_category AS ENUM (
                'FOOD_BEVERAGE', 'TRANSPORTATION', 'MATERIALS', 'EQUIPMENT', 
                'VENUE', 'DECORATION', 'GIFTS', 'PROMOTION', 'SUPPLIES', 
                'SERVICES', 'UTILITIES', 'INSURANCE', 'OTHER'
            );
        `);

    // 지출 우선순위 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE expense_priority AS ENUM (
                'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
            );
        `);

    // budget_expenses 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "budget_expenses",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 관계 정보 (FR-024)
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
          {
            name: "approved_by",
            type: "uuid",
            isNullable: true,
          },

          // 지출 기본 정보 (FR-024)
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
              "FOOD_BEVERAGE",
              "TRANSPORTATION",
              "MATERIALS",
              "EQUIPMENT",
              "VENUE",
              "DECORATION",
              "GIFTS",
              "PROMOTION",
              "SUPPLIES",
              "SERVICES",
              "UTILITIES",
              "INSURANCE",
              "OTHER",
            ],
            enumName: "expense_category",
            isNullable: false,
          },
          {
            name: "subcategory",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "priority",
            type: "enum",
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            enumName: "expense_priority",
            default: "'MEDIUM'",
          },

          // 금액 정보 (FR-024)
          {
            name: "estimated_amount",
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
            name: "tax_amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
            default: 0,
          },
          {
            name: "total_amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
            default: 0,
            comment: "actual_amount + tax_amount",
          },
          {
            name: "currency",
            type: "varchar",
            length: "3",
            default: "'KRW'",
          },

          // 날짜 정보
          {
            name: "planned_date",
            type: "date",
            isNullable: false,
            comment: "계획된 구매/결제 날짜",
          },
          {
            name: "purchase_date",
            type: "date",
            isNullable: true,
            comment: "실제 구매 날짜",
          },
          {
            name: "payment_date",
            type: "date",
            isNullable: true,
            comment: "실제 결제 날짜",
          },
          {
            name: "due_date",
            type: "date",
            isNullable: true,
            comment: "결제 기한",
          },

          // 상태 및 진행 정보
          {
            name: "status",
            type: "enum",
            enum: [
              "PLANNED",
              "APPROVED",
              "PURCHASED",
              "PAID",
              "CANCELLED",
              "REFUNDED",
            ],
            enumName: "expense_status",
            default: "'PLANNED'",
          },
          {
            name: "approval_required",
            type: "boolean",
            default: true,
            comment: "승인 필요 여부",
          },
          {
            name: "approved_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "approval_notes",
            type: "text",
            isNullable: true,
            comment: "승인 관련 메모",
          },

          // 공급업체 정보
          {
            name: "vendor_name",
            type: "varchar",
            length: "200",
            isNullable: true,
            comment: "공급업체명",
          },
          {
            name: "vendor_contact",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "공급업체 연락처",
          },
          {
            name: "vendor_address",
            type: "text",
            isNullable: true,
            comment: "공급업체 주소",
          },
          {
            name: "vendor_business_number",
            type: "varchar",
            length: "20",
            isNullable: true,
            comment: "사업자등록번호",
          },

          // 결제 및 영수증 정보
          {
            name: "payment_method",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "결제 방식",
          },
          {
            name: "receipt_number",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "영수증 번호",
          },
          {
            name: "invoice_number",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "세금계산서 번호",
          },
          {
            name: "receipt_required",
            type: "boolean",
            default: true,
            comment: "영수증 필요 여부",
          },
          {
            name: "receipt_submitted",
            type: "boolean",
            default: false,
            comment: "영수증 제출 완료",
          },

          // 메타데이터
          {
            name: "quantity",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
            default: 1,
            comment: "수량",
          },
          {
            name: "unit",
            type: "varchar",
            length: "20",
            isNullable: true,
            comment: "단위 (개, 세트, kg 등)",
          },
          {
            name: "unit_price",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
            comment: "단가",
          },
          {
            name: "is_recurring",
            type: "boolean",
            default: false,
            comment: "정기 지출 여부",
          },
          {
            name: "recurring_pattern",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "반복 패턴",
          },
          {
            name: "tags",
            type: "text",
            isNullable: true,
            comment: "태그 (JSON 배열)",
          },
          {
            name: "notes",
            type: "text",
            isNullable: true,
            comment: "추가 메모",
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
            name: "budget_expenses_amounts_positive",
            expression:
              "estimated_amount >= 0 AND (actual_amount IS NULL OR actual_amount >= 0) AND (tax_amount IS NULL OR tax_amount >= 0)",
          },
          {
            name: "budget_expenses_total_amount_calculation",
            expression:
              "total_amount = COALESCE(actual_amount, 0) + COALESCE(tax_amount, 0)",
          },
          {
            name: "budget_expenses_quantity_positive",
            expression: "quantity IS NULL OR quantity > 0",
          },
          {
            name: "budget_expenses_unit_price_positive",
            expression: "unit_price IS NULL OR unit_price >= 0",
          },
          {
            name: "budget_expenses_item_name_length",
            expression: "LENGTH(item_name) >= 2",
          },
          {
            name: "budget_expenses_date_logic",
            expression:
              "(purchase_date IS NULL OR planned_date <= purchase_date) AND (payment_date IS NULL OR purchase_date <= payment_date OR purchase_date IS NULL)",
          },
          {
            name: "budget_expenses_currency_format",
            expression: "LENGTH(currency) = 3 AND currency ~ '^[A-Z]{3}$'",
          },
          {
            name: "budget_expenses_business_number_format",
            expression:
              "vendor_business_number IS NULL OR vendor_business_number ~ '^[0-9-]+$'",
          },
          {
            name: "budget_expenses_recurring_pattern",
            expression:
              "(is_recurring = FALSE AND recurring_pattern IS NULL) OR (is_recurring = TRUE AND recurring_pattern IS NOT NULL)",
          },
          {
            name: "budget_expenses_approval_logic",
            expression:
              "(approval_required = FALSE) OR (approval_required = TRUE AND (approved_by IS NULL OR approved_at IS NOT NULL))",
          },
        ],
      }),
      true,
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "budget_expenses",
      new ForeignKey({
        columnNames: ["budget_id"],
        referencedTableName: "budgets",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "budget_expenses",
      new ForeignKey({
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );

    await queryRunner.createForeignKey(
      "budget_expenses",
      new ForeignKey({
        columnNames: ["updated_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );

    await queryRunner.createForeignKey(
      "budget_expenses",
      new ForeignKey({
        columnNames: ["approved_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_budget_id", ["budget_id"]),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_created_by", ["created_by"]),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_category", ["category"]),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_status", ["status"]),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_priority", ["priority"], {
        order: { priority: "ASC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_planned_date", ["planned_date"], {
        order: { planned_date: "ASC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_purchase_date", ["purchase_date"], {
        order: { purchase_date: "DESC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_payment_date", ["payment_date"], {
        order: { payment_date: "DESC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_due_date", ["due_date"], {
        order: { due_date: "ASC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index(
        "idx_budget_expenses_approval_required",
        ["approval_required"],
        {
          where: "approval_required = TRUE AND approved_by IS NULL",
        },
      ),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index(
        "idx_budget_expenses_receipt_required",
        ["receipt_required", "receipt_submitted"],
        {
          where: "receipt_required = TRUE AND receipt_submitted = FALSE",
        },
      ),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_recurring", ["is_recurring"], {
        where: "is_recurring = TRUE",
      }),
    );

    // 복합 인덱스 (성능 최적화)
    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_budget_status", ["budget_id", "status"], {
        order: { budget_id: "ASC", status: "ASC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index(
        "idx_budget_expenses_category_date",
        ["category", "planned_date"],
        {
          order: { category: "ASC", planned_date: "ASC" },
        },
      ),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_status_priority", ["status", "priority"], {
        order: { status: "ASC", priority: "ASC" },
      }),
    );

    await queryRunner.createIndex(
      "budget_expenses",
      new Index("idx_budget_expenses_vendor_name", ["vendor_name"], {
        where: "vendor_name IS NOT NULL",
      }),
    );

    // GIN 인덱스 (전문 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_budget_expenses_item_name_search 
            ON budget_expenses USING gin(item_name gin_trgm_ops);
        `);

    await queryRunner.query(`
            CREATE INDEX idx_budget_expenses_vendor_name_search 
            ON budget_expenses USING gin(vendor_name gin_trgm_ops)
            WHERE vendor_name IS NOT NULL;
        `);

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_budget_expenses_updated_at
                BEFORE UPDATE ON budget_expenses
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

    // total_amount 자동 계산 트리거 생성
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_expense_total_amount()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.total_amount = COALESCE(NEW.actual_amount, 0) + COALESCE(NEW.tax_amount, 0);
                
                -- 단가와 수량에서 예상 금액 계산
                IF NEW.unit_price IS NOT NULL AND NEW.quantity IS NOT NULL THEN
                    NEW.estimated_amount = NEW.unit_price * NEW.quantity;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE TRIGGER trigger_budget_expenses_total_amount
                BEFORE INSERT OR UPDATE ON budget_expenses
                FOR EACH ROW
                EXECUTE FUNCTION update_expense_total_amount();
        `);

    // 상태 자동 업데이트 트리거
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_expense_status()
            RETURNS TRIGGER AS $$
            BEGIN
                -- 결제 날짜가 있으면 PAID 상태로
                IF NEW.payment_date IS NOT NULL AND NEW.status != 'REFUNDED' AND NEW.status != 'CANCELLED' THEN
                    NEW.status = 'PAID';
                -- 구매 날짜가 있으면 PURCHASED 상태로
                ELSIF NEW.purchase_date IS NOT NULL AND NEW.status = 'APPROVED' THEN
                    NEW.status = 'PURCHASED';
                -- 승인된 경우 APPROVED 상태로
                ELSIF NEW.approved_by IS NOT NULL AND NEW.approved_at IS NOT NULL AND NEW.status = 'PLANNED' THEN
                    NEW.status = 'APPROVED';
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE TRIGGER trigger_budget_expenses_status_update
                BEFORE INSERT OR UPDATE ON budget_expenses
                FOR EACH ROW
                EXECUTE FUNCTION update_expense_status();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_budget_expenses_status_update ON budget_expenses;`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_budget_expenses_total_amount ON budget_expenses;`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_budget_expenses_updated_at ON budget_expenses;`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_expense_status();`);
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_expense_total_amount();`,
    );

    // 인덱스 삭제
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_budget_expenses_vendor_name_search;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_budget_expenses_item_name_search;`,
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_vendor_name",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_status_priority",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_category_date",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_budget_status",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_recurring",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_receipt_required",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_approval_required",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_due_date",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_payment_date",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_purchase_date",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_planned_date",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_priority",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_status",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_category",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_created_by",
    );
    await queryRunner.dropIndex(
      "budget_expenses",
      "idx_budget_expenses_budget_id",
    );

    // 외래키 삭제
    const table = await queryRunner.getTable("budget_expenses");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("budget_expenses", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("budget_expenses");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS expense_priority;`);
    await queryRunner.query(`DROP TYPE IF EXISTS expense_category;`);
    await queryRunner.query(`DROP TYPE IF EXISTS expense_status;`);
  }
}
