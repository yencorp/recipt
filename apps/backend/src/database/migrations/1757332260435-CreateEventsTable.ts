import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class CreateEventsTable1757332260435 implements MigrationInterface {
  name = "CreateEventsTable1757332260435";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 행사 상태 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE event_status AS ENUM (
                'PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
            );
        `);

    // events 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "events",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 관계 정보 (FR-020)
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

          // 행사 정보 (FR-020)
          {
            name: "name",
            type: "varchar",
            length: "200",
            isNullable: false,
          },
          {
            name: "start_date",
            type: "date",
            isNullable: false,
          },
          {
            name: "end_date",
            type: "date",
            isNullable: false,
          },
          {
            name: "location",
            type: "varchar",
            length: "200",
            isNullable: true,
          },
          {
            name: "allocated_budget",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },

          // 상태 정보
          {
            name: "status",
            type: "enum",
            enum: ["PLANNING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            enumName: "event_status",
            default: "'PLANNING'",
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
            name: "events_date_order",
            expression: "start_date <= end_date",
          },
          {
            name: "events_allocated_budget_positive",
            expression: "allocated_budget IS NULL OR allocated_budget >= 0",
          },
          {
            name: "events_name_length",
            expression: "LENGTH(name) >= 2",
          },
        ],
      }),
      true
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "events",
      new TableForeignKey({
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    await queryRunner.createForeignKey(
      "events",
      new TableForeignKey({
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "events",
      new TableIndex({
        name: "idx_events_organization_id",
        columnNames: ["organization_id"],
      })
    );

    await queryRunner.createIndex(
      "events",
      new TableIndex({
        name: "idx_events_created_by",
        columnNames: ["created_by"],
      })
    );

    await queryRunner.createIndex(
      "events",
      new TableIndex({
        name: "idx_events_start_date",
        columnNames: ["start_date"],
      })
    );

    await queryRunner.createIndex(
      "events",
      new TableIndex({
        name: "idx_events_status",
        columnNames: ["status"],
      })
    );

    // 복합 인덱스 (성능 최적화)
    await queryRunner.createIndex(
      "events",
      new TableIndex({
        name: "idx_events_org_date",
        columnNames: ["organization_id", "start_date"],
      })
    );

    await queryRunner.createIndex(
      "events",
      new TableIndex({
        name: "idx_events_status_date",
        columnNames: ["status", "start_date"],
      })
    );

    // GIN 인덱스 (전문 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_events_name_search 
            ON events USING gin(name gin_trgm_ops);
        `);

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_events_updated_at
                BEFORE UPDATE ON events
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_events_updated_at ON events;`
    );

    // 인덱스 삭제
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_name_search;`);
    await queryRunner.dropIndex("events", "idx_events_status_date");
    await queryRunner.dropIndex("events", "idx_events_org_date");
    await queryRunner.dropIndex("events", "idx_events_status");
    await queryRunner.dropIndex("events", "idx_events_start_date");
    await queryRunner.dropIndex("events", "idx_events_created_by");
    await queryRunner.dropIndex("events", "idx_events_organization_id");

    // 외래키 삭제
    const table = await queryRunner.getTable("events");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("events", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("events");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS event_status;`);
  }
}
