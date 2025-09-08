import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm";

export class CreateAuditTrailsTable1757332290000 implements MigrationInterface {
  name = "CreateAuditTrailsTable1757332290000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 감사 작업 유형 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE audit_action_type AS ENUM (
                'INSERT', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUBMIT', 'PUBLISH'
            );
        `);

    // 감사 심각도 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE audit_severity AS ENUM (
                'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
            );
        `);

    // audit_trails 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "audit_trails",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 추적 대상 정보 (FR-026)
          {
            name: "table_name",
            type: "varchar",
            length: "100",
            isNullable: false,
            comment: "변경된 테이블명",
          },
          {
            name: "record_id",
            type: "uuid",
            isNullable: false,
            comment: "변경된 레코드 ID",
          },
          {
            name: "action_type",
            type: "enum",
            enum: [
              "INSERT",
              "UPDATE",
              "DELETE",
              "APPROVE",
              "REJECT",
              "SUBMIT",
              "PUBLISH",
            ],
            enumName: "audit_action_type",
            isNullable: false,
          },

          // 변경 정보 (FR-026)
          {
            name: "old_values",
            type: "jsonb",
            isNullable: true,
            comment: "변경 전 데이터 (JSON 형태)",
          },
          {
            name: "new_values",
            type: "jsonb",
            isNullable: true,
            comment: "변경 후 데이터 (JSON 형태)",
          },
          {
            name: "changed_fields",
            type: "text[]",
            isNullable: true,
            comment: "변경된 필드 목록",
          },
          {
            name: "field_changes",
            type: "jsonb",
            isNullable: true,
            comment: "필드별 변경사항 상세",
          },

          // 사용자 및 세션 정보 (FR-026)
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
            comment: "변경한 사용자 ID",
          },
          {
            name: "user_email",
            type: "varchar",
            length: "255",
            isNullable: true,
            comment: "변경 시점 사용자 이메일",
          },
          {
            name: "user_name",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "변경 시점 사용자 이름",
          },
          {
            name: "session_id",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "세션 ID",
          },
          {
            name: "ip_address",
            type: "inet",
            isNullable: true,
            comment: "클라이언트 IP 주소",
          },
          {
            name: "user_agent",
            type: "text",
            isNullable: true,
            comment: "사용자 에이전트 정보",
          },

          // 비즈니스 컨텍스트 정보
          {
            name: "organization_id",
            type: "uuid",
            isNullable: true,
            comment: "관련 조직 ID",
          },
          {
            name: "event_id",
            type: "uuid",
            isNullable: true,
            comment: "관련 이벤트 ID",
          },
          {
            name: "budget_id",
            type: "uuid",
            isNullable: true,
            comment: "관련 예산 ID",
          },

          // 변경 이유 및 메타데이터
          {
            name: "reason",
            type: "text",
            isNullable: true,
            comment: "변경 이유",
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
            comment: "변경 내용 설명",
          },
          {
            name: "severity",
            type: "enum",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            enumName: "audit_severity",
            default: "'LOW'",
            comment: "변경 심각도",
          },
          {
            name: "tags",
            type: "text[]",
            isNullable: true,
            comment: "분류 태그",
          },

          // 시스템 정보
          {
            name: "application_version",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "애플리케이션 버전",
          },
          {
            name: "api_endpoint",
            type: "varchar",
            length: "255",
            isNullable: true,
            comment: "호출된 API 엔드포인트",
          },
          {
            name: "request_id",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "요청 ID (추적용)",
          },

          // 검색 및 분석 정보
          {
            name: "search_text",
            type: "text",
            isNullable: true,
            comment: "전문 검색용 텍스트",
          },
          {
            name: "amount_involved",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: true,
            comment: "관련 금액 (분석용)",
          },
          {
            name: "risk_score",
            type: "integer",
            isNullable: true,
            comment: "위험도 점수 (0-100)",
          },

          // 복구 정보
          {
            name: "is_reversible",
            type: "boolean",
            default: true,
            comment: "복구 가능 여부",
          },
          {
            name: "rollback_data",
            type: "jsonb",
            isNullable: true,
            comment: "롤백용 데이터",
          },
          {
            name: "parent_audit_id",
            type: "uuid",
            isNullable: true,
            comment: "연관 감사 레코드 ID",
          },

          // 타임스탬프
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            comment: "감사 로그 생성 시간",
          },
          {
            name: "action_timestamp",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            comment: "실제 액션 발생 시간",
          },
        ],
        checks: [
          {
            name: "audit_trails_table_name_length",
            expression: "LENGTH(table_name) >= 1",
          },
          {
            name: "audit_trails_amount_positive",
            expression: "amount_involved IS NULL OR amount_involved >= 0",
          },
          {
            name: "audit_trails_risk_score_range",
            expression:
              "risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)",
          },
          {
            name: "audit_trails_ip_valid",
            expression: "ip_address IS NULL OR ip_address::text ~ '^[0-9.:]+'",
          },
        ],
      }),
      true
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "audit_trails",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    await queryRunner.createForeignKey(
      "audit_trails",
      new TableForeignKey({
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    await queryRunner.createForeignKey(
      "audit_trails",
      new TableForeignKey({
        columnNames: ["event_id"],
        referencedTableName: "events",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    await queryRunner.createForeignKey(
      "audit_trails",
      new TableForeignKey({
        columnNames: ["budget_id"],
        referencedTableName: "budgets",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    await queryRunner.createForeignKey(
      "audit_trails",
      new TableForeignKey({
        columnNames: ["parent_audit_id"],
        referencedTableName: "audit_trails",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_table_record",
        columnNames: ["table_name", "record_id"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_user_id",
        columnNames: ["user_id"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_action_type",
        columnNames: ["action_type"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_severity",
        columnNames: ["severity"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_organization_id",
        columnNames: ["organization_id"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_event_id",
        columnNames: ["event_id"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_budget_id",
        columnNames: ["budget_id"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_action_timestamp",
        columnNames: ["action_timestamp"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_created_at",
        columnNames: ["created_at"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_ip_address",
        columnNames: ["ip_address"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_session_id",
        columnNames: ["session_id"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_request_id",
        columnNames: ["request_id"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_risk_score",
        columnNames: ["risk_score"],
        where: "risk_score IS NOT NULL",
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_amount_involved",
        columnNames: ["amount_involved"],
        where: "amount_involved IS NOT NULL",
      })
    );

    // 복합 인덱스 (성능 최적화)
    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_table_action_time",
        columnNames: ["table_name", "action_type", "action_timestamp"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_user_time",
        columnNames: ["user_id", "action_timestamp"],
      })
    );

    await queryRunner.createIndex(
      "audit_trails",
      new TableIndex({
        name: "idx_audit_trails_severity_time",
        columnNames: ["severity", "action_timestamp"],
      })
    );

    // JSON 인덱스 (JSONB 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_audit_trails_old_values_gin 
            ON audit_trails USING gin(old_values);
        `);

    await queryRunner.query(`
            CREATE INDEX idx_audit_trails_new_values_gin 
            ON audit_trails USING gin(new_values);
        `);

    await queryRunner.query(`
            CREATE INDEX idx_audit_trails_field_changes_gin 
            ON audit_trails USING gin(field_changes);
        `);

    // 배열 인덱스 (changed_fields, tags)
    await queryRunner.query(`
            CREATE INDEX idx_audit_trails_changed_fields_gin 
            ON audit_trails USING gin(changed_fields);
        `);

    await queryRunner.query(`
            CREATE INDEX idx_audit_trails_tags_gin 
            ON audit_trails USING gin(tags);
        `);

    // GIN 인덱스 (전문 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_audit_trails_search_text 
            ON audit_trails USING gin(search_text gin_trgm_ops)
            WHERE search_text IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_audit_trails_description_search 
            ON audit_trails USING gin(description gin_trgm_ops)
            WHERE description IS NOT NULL;
        `);

    // 파티션을 위한 월별 인덱스 (선택적)
    await queryRunner.query(`
            CREATE INDEX idx_audit_trails_monthly_partition 
            ON audit_trails (date_trunc('month', action_timestamp), table_name);
        `);

    // 감사 로그 자동 생성을 위한 트리거 함수 생성
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION create_audit_trail()
            RETURNS TRIGGER AS $$
            DECLARE
                old_data JSONB;
                new_data JSONB;
                changed_fields TEXT[];
                action_type TEXT;
                search_content TEXT;
            BEGIN
                -- 액션 타입 결정
                IF TG_OP = 'DELETE' THEN
                    old_data = to_jsonb(OLD);
                    action_type = 'DELETE';
                    search_content = OLD.id::text;
                ELSIF TG_OP = 'INSERT' THEN
                    new_data = to_jsonb(NEW);
                    action_type = 'INSERT';
                    search_content = NEW.id::text;
                ELSIF TG_OP = 'UPDATE' THEN
                    old_data = to_jsonb(OLD);
                    new_data = to_jsonb(NEW);
                    action_type = 'UPDATE';
                    search_content = NEW.id::text;
                    
                    -- 변경된 필드 찾기
                    SELECT array_agg(key) INTO changed_fields
                    FROM jsonb_each(old_data) old_kv
                    JOIN jsonb_each(new_data) new_kv ON old_kv.key = new_kv.key
                    WHERE old_kv.value <> new_kv.value;
                END IF;
                
                -- 감사 로그 삽입
                INSERT INTO audit_trails (
                    table_name, record_id, action_type,
                    old_values, new_values, changed_fields,
                    user_id, search_text, action_timestamp
                ) VALUES (
                    TG_TABLE_NAME,
                    COALESCE(NEW.id, OLD.id),
                    action_type::audit_action_type,
                    old_data, new_data, changed_fields,
                    COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by, OLD.created_by),
                    search_content,
                    CURRENT_TIMESTAMP
                );
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 함수 삭제
    await queryRunner.query(`DROP FUNCTION IF EXISTS create_audit_trail();`);

    // 인덱스 삭제
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_audit_trails_monthly_partition;`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_audit_trails_description_search;`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_audit_trails_search_text;`
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_trails_tags_gin;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_audit_trails_changed_fields_gin;`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_audit_trails_field_changes_gin;`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_audit_trails_new_values_gin;`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_audit_trails_old_values_gin;`
    );
    await queryRunner.dropIndex(
      "audit_trails",
      "idx_audit_trails_severity_time"
    );
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_user_time");
    await queryRunner.dropIndex(
      "audit_trails",
      "idx_audit_trails_table_action_time"
    );
    await queryRunner.dropIndex(
      "audit_trails",
      "idx_audit_trails_amount_involved"
    );
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_risk_score");
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_request_id");
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_session_id");
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_ip_address");
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_created_at");
    await queryRunner.dropIndex(
      "audit_trails",
      "idx_audit_trails_action_timestamp"
    );
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_budget_id");
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_event_id");
    await queryRunner.dropIndex(
      "audit_trails",
      "idx_audit_trails_organization_id"
    );
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_severity");
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_action_type");
    await queryRunner.dropIndex("audit_trails", "idx_audit_trails_user_id");
    await queryRunner.dropIndex(
      "audit_trails",
      "idx_audit_trails_table_record"
    );

    // 외래키 삭제
    const table = await queryRunner.getTable("audit_trails");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("audit_trails", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("audit_trails");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS audit_severity;`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_action_type;`);
  }
}
