import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from "typeorm";

export class CreateReceiptValidationsTable1757332305000 implements MigrationInterface {
    name = 'CreateReceiptValidationsTable1757332305000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 검증 상태 ENUM 생성
        await queryRunner.query(`
            CREATE TYPE validation_status AS ENUM (
                'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION', 'ESCALATED'
            );
        `);

        // 검증 유형 ENUM 생성
        await queryRunner.query(`
            CREATE TYPE validation_type AS ENUM (
                'MANUAL', 'SEMI_AUTOMATIC', 'AUTOMATIC', 'PEER_REVIEW', 'SUPERVISOR_REVIEW'
            );
        `);

        // 검증 우선순위 ENUM 생성
        await queryRunner.query(`
            CREATE TYPE validation_priority AS ENUM (
                'LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'
            );
        `);

        // receipt_validations 테이블 생성
        await queryRunner.createTable(
            new Table({
                name: "receipt_validations",
                columns: [
                    // 기본 식별자
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    
                    // 관계 정보 (FR-029)
                    {
                        name: "ocr_result_id",
                        type: "uuid",
                        isNullable: false,
                        comment: "검증 대상 OCR 결과 ID",
                    },
                    {
                        name: "assigned_to",
                        type: "uuid",
                        isNullable: true,
                        comment: "할당된 검증자 ID",
                    },
                    {
                        name: "validated_by",
                        type: "uuid",
                        isNullable: true,
                        comment: "실제 검증을 수행한 사용자 ID",
                    },
                    {
                        name: "reviewed_by",
                        type: "uuid",
                        isNullable: true,
                        comment: "검토를 수행한 상급자 ID",
                    },
                    
                    // 검증 기본 정보 (FR-029)
                    {
                        name: "status",
                        type: "enum",
                        enum: ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "NEEDS_REVISION", "ESCALATED"],
                        enumName: "validation_status",
                        default: "'PENDING'",
                    },
                    {
                        name: "validation_type",
                        type: "enum",
                        enum: ["MANUAL", "SEMI_AUTOMATIC", "AUTOMATIC", "PEER_REVIEW", "SUPERVISOR_REVIEW"],
                        enumName: "validation_type",
                        default: "'MANUAL'",
                    },
                    {
                        name: "priority",
                        type: "enum",
                        enum: ["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"],
                        enumName: "validation_priority",
                        default: "'NORMAL'",
                    },
                    
                    // 원본 OCR 데이터 (비교용)
                    {
                        name: "original_extracted_amount",
                        type: "decimal",
                        precision: 12,
                        scale: 2,
                        isNullable: true,
                        comment: "원본 추출된 금액",
                    },
                    {
                        name: "original_extracted_date",
                        type: "date",
                        isNullable: true,
                        comment: "원본 추출된 날짜",
                    },
                    {
                        name: "original_extracted_vendor",
                        type: "varchar",
                        length: "200",
                        isNullable: true,
                        comment: "원본 추출된 업체명",
                    },
                    {
                        name: "original_confidence_score",
                        type: "decimal",
                        precision: 3,
                        scale: 2,
                        isNullable: true,
                        comment: "원본 OCR 신뢰도 점수",
                    },
                    
                    // 검증된 데이터 (FR-029)
                    {
                        name: "validated_amount",
                        type: "decimal",
                        precision: 12,
                        scale: 2,
                        isNullable: true,
                        comment: "검증된 금액",
                    },
                    {
                        name: "validated_tax_amount",
                        type: "decimal",
                        precision: 12,
                        scale: 2,
                        isNullable: true,
                        comment: "검증된 세금 금액",
                    },
                    {
                        name: "validated_date",
                        type: "date",
                        isNullable: true,
                        comment: "검증된 날짜",
                    },
                    {
                        name: "validated_vendor_name",
                        type: "varchar",
                        length: "200",
                        isNullable: true,
                        comment: "검증된 업체명",
                    },
                    {
                        name: "validated_items",
                        type: "jsonb",
                        isNullable: true,
                        comment: "검증된 항목별 상세 정보",
                    },
                    
                    // 검증 결과 메타데이터
                    {
                        name: "validation_confidence",
                        type: "decimal",
                        precision: 3,
                        scale: 2,
                        isNullable: true,
                        comment: "검증 신뢰도 (0.00-1.00)",
                    },
                    {
                        name: "accuracy_improvement",
                        type: "decimal",
                        precision: 3,
                        scale: 2,
                        isNullable: true,
                        comment: "정확도 개선도 (-1.00 ~ 1.00)",
                    },
                    {
                        name: "correction_count",
                        type: "integer",
                        default: 0,
                        comment: "수정 사항 개수",
                    },
                    {
                        name: "changes_made",
                        type: "jsonb",
                        isNullable: true,
                        comment: "변경 사항 상세 기록",
                    },
                    {
                        name: "field_corrections",
                        type: "jsonb",
                        isNullable: true,
                        comment: "필드별 수정 내용",
                    },
                    
                    // 검증 시간 추적
                    {
                        name: "time_spent_seconds",
                        type: "integer",
                        isNullable: true,
                        comment: "검증 소요 시간 (초)",
                    },
                    {
                        name: "validation_effort_score",
                        type: "integer",
                        isNullable: true,
                        comment: "검증 노력 점수 (1-10)",
                    },
                    {
                        name: "complexity_score",
                        type: "integer",
                        isNullable: true,
                        comment: "영수증 복잡도 점수 (1-10)",
                    },
                    
                    // 검증 과정 정보
                    {
                        name: "validation_method",
                        type: "varchar",
                        length: "100",
                        isNullable: true,
                        comment: "검증 방법 (manual_review, comparison, cross_check 등)",
                    },
                    {
                        name: "validation_tools_used",
                        type: "text[]",
                        isNullable: true,
                        comment: "사용된 검증 도구 목록",
                    },
                    {
                        name: "reference_sources",
                        type: "text[]",
                        isNullable: true,
                        comment: "참조한 정보 소스 목록",
                    },
                    {
                        name: "cross_validation_performed",
                        type: "boolean",
                        default: false,
                        comment: "교차 검증 수행 여부",
                    },
                    
                    // 검증 의견 및 피드백
                    {
                        name: "validation_notes",
                        type: "text",
                        isNullable: true,
                        comment: "검증자 의견",
                    },
                    {
                        name: "rejection_reason",
                        type: "text",
                        isNullable: true,
                        comment: "반려 사유",
                    },
                    {
                        name: "feedback_to_ocr",
                        type: "text",
                        isNullable: true,
                        comment: "OCR 시스템 개선을 위한 피드백",
                    },
                    {
                        name: "quality_issues",
                        type: "text[]",
                        isNullable: true,
                        comment: "발견된 품질 이슈 목록",
                    },
                    {
                        name: "improvement_suggestions",
                        type: "text[]",
                        isNullable: true,
                        comment: "개선 제안사항",
                    },
                    
                    // 검증 결과 메타데이터
                    {
                        name: "disputed_fields",
                        type: "text[]",
                        isNullable: true,
                        comment: "논란이 된 필드 목록",
                    },
                    {
                        name: "requires_supervisor_review",
                        type: "boolean",
                        default: false,
                        comment: "상급자 검토 필요 여부",
                    },
                    {
                        name: "escalation_reason",
                        type: "text",
                        isNullable: true,
                        comment: "에스컬레이션 사유",
                    },
                    {
                        name: "risk_indicators",
                        type: "text[]",
                        isNullable: true,
                        comment: "위험 지표 목록",
                    },
                    
                    // 학습 및 개선 데이터
                    {
                        name: "training_value",
                        type: "integer",
                        isNullable: true,
                        comment: "ML 학습 데이터로서의 가치 점수 (1-10)",
                    },
                    {
                        name: "edge_case_indicator",
                        type: "boolean",
                        default: false,
                        comment: "엣지 케이스 여부",
                    },
                    {
                        name: "pattern_anomalies",
                        type: "text[]",
                        isNullable: true,
                        comment: "패턴 이상 목록",
                    },
                    {
                        name: "learning_tags",
                        type: "text[]",
                        isNullable: true,
                        comment: "학습용 분류 태그",
                    },
                    
                    // 작업 관리 정보
                    {
                        name: "estimated_completion_time",
                        type: "timestamp",
                        isNullable: true,
                        comment: "예상 완료 시간",
                    },
                    {
                        name: "sla_deadline",
                        type: "timestamp",
                        isNullable: true,
                        comment: "SLA 마감 시한",
                    },
                    {
                        name: "reminder_sent_count",
                        type: "integer",
                        default: 0,
                        comment: "알림 발송 횟수",
                    },
                    {
                        name: "last_reminder_sent_at",
                        type: "timestamp",
                        isNullable: true,
                        comment: "마지막 알림 발송 시간",
                    },
                    
                    // 메타데이터
                    {
                        name: "tags",
                        type: "text[]",
                        isNullable: true,
                        comment: "분류 태그",
                    },
                    {
                        name: "custom_attributes",
                        type: "jsonb",
                        isNullable: true,
                        comment: "사용자 정의 속성",
                    },
                    
                    // 타임스탬프
                    {
                        name: "assigned_at",
                        type: "timestamp",
                        isNullable: true,
                        comment: "검증 할당 시간",
                    },
                    {
                        name: "started_at",
                        type: "timestamp",
                        isNullable: true,
                        comment: "검증 시작 시간",
                    },
                    {
                        name: "completed_at",
                        type: "timestamp",
                        isNullable: true,
                        comment: "검증 완료 시간",
                    },
                    {
                        name: "reviewed_at",
                        type: "timestamp",
                        isNullable: true,
                        comment: "검토 완료 시간",
                    },
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
                        name: "receipt_validations_amounts_positive",
                        expression: "original_extracted_amount IS NULL OR original_extracted_amount >= 0",
                    },
                    {
                        name: "receipt_validations_validated_amounts_positive",
                        expression: "validated_amount IS NULL OR validated_amount >= 0",
                    },
                    {
                        name: "receipt_validations_tax_amounts_positive",
                        expression: "validated_tax_amount IS NULL OR validated_tax_amount >= 0",
                    },
                    {
                        name: "receipt_validations_confidence_range",
                        expression: "original_confidence_score IS NULL OR (original_confidence_score >= 0 AND original_confidence_score <= 1)",
                    },
                    {
                        name: "receipt_validations_validation_confidence_range",
                        expression: "validation_confidence IS NULL OR (validation_confidence >= 0 AND validation_confidence <= 1)",
                    },
                    {
                        name: "receipt_validations_accuracy_improvement_range",
                        expression: "accuracy_improvement IS NULL OR (accuracy_improvement >= -1 AND accuracy_improvement <= 1)",
                    },
                    {
                        name: "receipt_validations_effort_score_range",
                        expression: "validation_effort_score IS NULL OR (validation_effort_score >= 1 AND validation_effort_score <= 10)",
                    },
                    {
                        name: "receipt_validations_complexity_score_range",
                        expression: "complexity_score IS NULL OR (complexity_score >= 1 AND complexity_score <= 10)",
                    },
                    {
                        name: "receipt_validations_training_value_range",
                        expression: "training_value IS NULL OR (training_value >= 1 AND training_value <= 10)",
                    },
                    {
                        name: "receipt_validations_time_spent_positive",
                        expression: "time_spent_seconds IS NULL OR time_spent_seconds >= 0",
                    },
                    {
                        name: "receipt_validations_correction_count_positive",
                        expression: "correction_count >= 0",
                    },
                    {
                        name: "receipt_validations_reminder_count_positive",
                        expression: "reminder_sent_count >= 0",
                    },
                ],
            }),
            true
        );

        // 외래키 생성
        await queryRunner.createForeignKey(
            "receipt_validations",
            new ForeignKey({
                columnNames: ["ocr_result_id"],
                referencedTableName: "ocr_results",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "receipt_validations",
            new ForeignKey({
                columnNames: ["assigned_to"],
                referencedTableName: "users",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL",
            })
        );

        await queryRunner.createForeignKey(
            "receipt_validations",
            new ForeignKey({
                columnNames: ["validated_by"],
                referencedTableName: "users",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL",
            })
        );

        await queryRunner.createForeignKey(
            "receipt_validations",
            new ForeignKey({
                columnNames: ["reviewed_by"],
                referencedTableName: "users",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL",
            })
        );

        // 인덱스 생성
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_ocr_result_id", ["ocr_result_id"])
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_assigned_to", ["assigned_to"])
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_validated_by", ["validated_by"])
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_status", ["status"])
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_priority", ["priority"], {
                order: { priority: "ASC" }
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_validation_type", ["validation_type"])
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_assigned_at", ["assigned_at"], {
                order: { assigned_at: "DESC" },
                where: "assigned_at IS NOT NULL"
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_completed_at", ["completed_at"], {
                order: { completed_at: "DESC" },
                where: "completed_at IS NOT NULL"
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_sla_deadline", ["sla_deadline"], {
                order: { sla_deadline: "ASC" },
                where: "sla_deadline IS NOT NULL AND status NOT IN ('APPROVED', 'REJECTED')"
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_supervisor_review", ["requires_supervisor_review"], {
                where: "requires_supervisor_review = TRUE"
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_edge_case", ["edge_case_indicator"], {
                where: "edge_case_indicator = TRUE"
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_validation_confidence", ["validation_confidence"], {
                order: { validation_confidence: "DESC" },
                where: "validation_confidence IS NOT NULL"
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_time_spent", ["time_spent_seconds"], {
                order: { time_spent_seconds: "DESC" },
                where: "time_spent_seconds IS NOT NULL"
            })
        );

        // 복합 인덱스 (성능 최적화)
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_assigned_status_priority", ["assigned_to", "status", "priority"], {
                order: { assigned_to: "ASC", status: "ASC", priority: "ASC" }
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_status_priority_assigned", ["status", "priority", "assigned_at"], {
                order: { status: "ASC", priority: "ASC", assigned_at: "ASC" }
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_type_status", ["validation_type", "status"], {
                order: { validation_type: "ASC", status: "ASC" }
            })
        );
        
        await queryRunner.createIndex(
            "receipt_validations",
            new Index("idx_receipt_validations_correction_count", ["correction_count"], {
                order: { correction_count: "DESC" },
                where: "correction_count > 0"
            })
        );

        // JSON 인덱스 (JSONB 검색용)
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_changes_made_gin 
            ON receipt_validations USING gin(changes_made)
            WHERE changes_made IS NOT NULL;
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_field_corrections_gin 
            ON receipt_validations USING gin(field_corrections)
            WHERE field_corrections IS NOT NULL;
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_validated_items_gin 
            ON receipt_validations USING gin(validated_items)
            WHERE validated_items IS NOT NULL;
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_custom_attributes_gin 
            ON receipt_validations USING gin(custom_attributes)
            WHERE custom_attributes IS NOT NULL;
        `);

        // 배열 인덱스
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_tags_gin 
            ON receipt_validations USING gin(tags)
            WHERE tags IS NOT NULL;
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_quality_issues_gin 
            ON receipt_validations USING gin(quality_issues)
            WHERE quality_issues IS NOT NULL;
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_risk_indicators_gin 
            ON receipt_validations USING gin(risk_indicators)
            WHERE risk_indicators IS NOT NULL;
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_learning_tags_gin 
            ON receipt_validations USING gin(learning_tags)
            WHERE learning_tags IS NOT NULL;
        `);

        // GIN 인덱스 (전문 검색용)
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_notes_search 
            ON receipt_validations USING gin(validation_notes gin_trgm_ops)
            WHERE validation_notes IS NOT NULL;
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_rejection_reason_search 
            ON receipt_validations USING gin(rejection_reason gin_trgm_ops)
            WHERE rejection_reason IS NOT NULL;
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_receipt_validations_vendor_name_search 
            ON receipt_validations USING gin(validated_vendor_name gin_trgm_ops)
            WHERE validated_vendor_name IS NOT NULL;
        `);

        // updated_at 자동 업데이트 트리거 생성
        await queryRunner.query(`
            CREATE TRIGGER trigger_receipt_validations_updated_at
                BEFORE UPDATE ON receipt_validations
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // 검증 통계 및 메트릭 자동 계산 트리거
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_validation_metrics()
            RETURNS TRIGGER AS $$
            DECLARE
                changes_count INTEGER := 0;
                field_name TEXT;
                original_value TEXT;
                validated_value TEXT;
            BEGIN
                -- 상태에 따른 타임스탬프 자동 설정
                IF NEW.status = 'IN_REVIEW' AND OLD.status != 'IN_REVIEW' THEN
                    NEW.started_at = CURRENT_TIMESTAMP;
                ELSIF NEW.status IN ('APPROVED', 'REJECTED') AND OLD.status != NEW.status THEN
                    NEW.completed_at = CURRENT_TIMESTAMP;
                END IF;
                
                -- 할당 시간 자동 설정
                IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
                    NEW.assigned_at = CURRENT_TIMESTAMP;
                END IF;
                
                -- 수정 건수 계산
                IF NEW.original_extracted_amount IS DISTINCT FROM NEW.validated_amount THEN
                    changes_count := changes_count + 1;
                END IF;
                
                IF NEW.original_extracted_date IS DISTINCT FROM NEW.validated_date THEN
                    changes_count := changes_count + 1;
                END IF;
                
                IF NEW.original_extracted_vendor IS DISTINCT FROM NEW.validated_vendor_name THEN
                    changes_count := changes_count + 1;
                END IF;
                
                NEW.correction_count = changes_count;
                
                -- 정확도 개선 점수 계산 (간단한 예시)
                IF NEW.original_confidence_score IS NOT NULL AND NEW.validation_confidence IS NOT NULL THEN
                    NEW.accuracy_improvement = NEW.validation_confidence - NEW.original_confidence_score;
                END IF;
                
                -- SLA 마감일 자동 설정 (우선순위별)
                IF NEW.sla_deadline IS NULL AND NEW.assigned_at IS NOT NULL THEN
                    CASE NEW.priority
                        WHEN 'CRITICAL' THEN NEW.sla_deadline = NEW.assigned_at + INTERVAL '2 hours';
                        WHEN 'URGENT' THEN NEW.sla_deadline = NEW.assigned_at + INTERVAL '4 hours';
                        WHEN 'HIGH' THEN NEW.sla_deadline = NEW.assigned_at + INTERVAL '1 day';
                        WHEN 'NORMAL' THEN NEW.sla_deadline = NEW.assigned_at + INTERVAL '2 days';
                        ELSE NEW.sla_deadline = NEW.assigned_at + INTERVAL '3 days';
                    END CASE;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER trigger_receipt_validations_metrics
                BEFORE INSERT OR UPDATE ON receipt_validations
                FOR EACH ROW
                EXECUTE FUNCTION update_validation_metrics();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 트리거 삭제
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_receipt_validations_metrics ON receipt_validations;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_receipt_validations_updated_at ON receipt_validations;`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_validation_metrics();`);
        
        // 인덱스 삭제
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_vendor_name_search;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_rejection_reason_search;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_notes_search;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_learning_tags_gin;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_risk_indicators_gin;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_quality_issues_gin;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_tags_gin;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_custom_attributes_gin;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_validated_items_gin;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_field_corrections_gin;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_validations_changes_made_gin;`);
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_correction_count");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_type_status");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_status_priority_assigned");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_assigned_status_priority");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_time_spent");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_validation_confidence");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_edge_case");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_supervisor_review");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_sla_deadline");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_completed_at");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_assigned_at");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_validation_type");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_priority");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_status");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_validated_by");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_assigned_to");
        await queryRunner.dropIndex("receipt_validations", "idx_receipt_validations_ocr_result_id");
        
        // 외래키 삭제
        const table = await queryRunner.getTable("receipt_validations");
        const foreignKeys = table!.foreignKeys;
        for (const foreignKey of foreignKeys) {
            await queryRunner.dropForeignKey("receipt_validations", foreignKey);
        }
        
        // 테이블 삭제
        await queryRunner.dropTable("receipt_validations");
        
        // ENUM 타입 삭제
        await queryRunner.query(`DROP TYPE IF EXISTS validation_priority;`);
        await queryRunner.query(`DROP TYPE IF EXISTS validation_type;`);
        await queryRunner.query(`DROP TYPE IF EXISTS validation_status;`);
    }
}