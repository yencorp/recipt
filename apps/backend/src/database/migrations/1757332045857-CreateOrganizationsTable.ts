import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateOrganizationsTable1757332045857
  implements MigrationInterface
{
  name = "CreateOrganizationsTable1757332045857";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // organizations 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "organizations",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 단체 정보 (PRD 4개 고정 단체)
          {
            name: "name",
            type: "varchar",
            length: "100",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "code",
            type: "varchar",
            length: "20",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "order_priority",
            type: "integer",
            isNullable: false,
            default: 0,
          },

          // 상태 정보
          {
            name: "is_active",
            type: "boolean",
            default: true,
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
            name: "organizations_name_length",
            expression: "LENGTH(name) >= 2",
          },
          {
            name: "organizations_code_format",
            expression: "code ~ '^[A-Z_]+$'",
          },
        ],
      }),
      true,
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "organizations",
      new Index("idx_organizations_name", ["name"], { isUnique: true }),
    );

    await queryRunner.createIndex(
      "organizations",
      new Index("idx_organizations_code", ["code"], { isUnique: true }),
    );

    await queryRunner.createIndex(
      "organizations",
      new Index("idx_organizations_active", ["is_active"], {
        where: "is_active = TRUE",
      }),
    );

    await queryRunner.createIndex(
      "organizations",
      new Index("idx_organizations_priority", ["order_priority"]),
    );

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_organizations_updated_at
                BEFORE UPDATE ON organizations
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

    // 초기 데이터 삽입 (PRD 기준 4개 고정 단체)
    await queryRunner.query(`
            INSERT INTO organizations (name, code, description, order_priority) VALUES
            ('청년회', 'YOUTH', '청년 구성원들의 단체', 1),
            ('자모회', 'MOTHERS', '어머니 구성원들의 단체', 2),
            ('초등부 주일학교', 'ELEMENTARY', '초등부 관련 단체', 3),
            ('중고등부 주일학교', 'MIDDLE_HIGH', '중고등부 관련 단체', 4);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON organizations;`,
    );

    // 인덱스 삭제
    await queryRunner.dropIndex("organizations", "idx_organizations_priority");
    await queryRunner.dropIndex("organizations", "idx_organizations_active");
    await queryRunner.dropIndex("organizations", "idx_organizations_code");
    await queryRunner.dropIndex("organizations", "idx_organizations_name");

    // 테이블 삭제 (초기 데이터도 함께 삭제됨)
    await queryRunner.dropTable("organizations");
  }
}
