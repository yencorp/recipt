import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class CreateUserOrganizationsTable1757332257934
  implements MigrationInterface
{
  name = "CreateUserOrganizationsTable1757332257934";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 사용자 단체 역할 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE user_organization_role AS ENUM ('ADMIN', 'MEMBER');
        `);

    // user_organizations 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "user_organizations",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 관계 정보 (FR-003, FR-009)
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "organization_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "role",
            type: "enum",
            enum: ["ADMIN", "MEMBER"],
            enumName: "user_organization_role",
            default: "'MEMBER'",
          },

          // 가입 정보
          {
            name: "joined_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
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
        ],
        uniques: [
          {
            name: "user_organizations_unique",
            columnNames: ["user_id", "organization_id"],
          },
        ],
      }),
      true
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "user_organizations",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "user_organizations",
      new TableForeignKey({
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "user_organizations",
      new TableIndex({
        name: "idx_user_organizations_unique",
        columnNames: ["user_id", "organization_id"],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      "user_organizations",
      new TableIndex({
        name: "idx_user_organizations_user_id",
        columnNames: ["user_id"],
      })
    );

    await queryRunner.createIndex(
      "user_organizations",
      new TableIndex({
        name: "idx_user_organizations_org_id",
        columnNames: ["organization_id"],
      })
    );

    await queryRunner.createIndex(
      "user_organizations",
      new TableIndex({
        name: "idx_user_organizations_role",
        columnNames: ["role"],
      })
    );

    await queryRunner.createIndex(
      "user_organizations",
      new TableIndex({
        name: "idx_user_organizations_active",
        columnNames: ["is_active"],
        where: "is_active = TRUE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 인덱스 삭제
    await queryRunner.dropIndex(
      "user_organizations",
      "idx_user_organizations_active"
    );
    await queryRunner.dropIndex(
      "user_organizations",
      "idx_user_organizations_role"
    );
    await queryRunner.dropIndex(
      "user_organizations",
      "idx_user_organizations_org_id"
    );
    await queryRunner.dropIndex(
      "user_organizations",
      "idx_user_organizations_user_id"
    );
    await queryRunner.dropIndex(
      "user_organizations",
      "idx_user_organizations_unique"
    );

    // 외래키 삭제 (테이블 삭제시 자동으로 삭제되지만 명시적으로)
    const table = await queryRunner.getTable("user_organizations");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("user_organizations", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("user_organizations");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS user_organization_role;`);
  }
}
