import {
  MigrationInterface,
  QueryRunner,
  Table,
  Index,
  ForeignKey,
} from "typeorm";

export class CreateOcrResultsTable1757332300000 implements MigrationInterface {
  name = "CreateOcrResultsTable1757332300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // OCR 엔진 타입 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE ocr_engine_type AS ENUM (
                'TESSERACT', 'GOOGLE_VISION', 'AZURE_VISION', 'AWS_TEXTRACT', 
                'PADDLE_OCR', 'EASY_OCR', 'CUSTOM_ENGINE'
            );
        `);

    // OCR 처리 상태 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE ocr_processing_status AS ENUM (
                'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'
            );
        `);

    // 데이터 신뢰도 수준 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE confidence_level AS ENUM (
                'VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'
            );
        `);

    // ocr_results 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "ocr_results",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 관계 정보 (FR-028)
          {
            name: "receipt_scan_id",
            type: "uuid",
            isNullable: false,
            comment: "연결된 영수증 스캔 ID",
          },
          {
            name: "processed_by",
            type: "uuid",
            isNullable: true,
            comment: "OCR 처리를 수행한 사용자 ID (자동 처리의 경우 null)",
          },

          // OCR 엔진 정보 (FR-028)
          {
            name: "engine_type",
            type: "enum",
            enum: [
              "TESSERACT",
              "GOOGLE_VISION",
              "AZURE_VISION",
              "AWS_TEXTRACT",
              "PADDLE_OCR",
              "EASY_OCR",
              "CUSTOM_ENGINE",
            ],
            enumName: "ocr_engine_type",
            isNullable: false,
          },
          {
            name: "engine_version",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "OCR 엔진 버전",
          },
          {
            name: "engine_config",
            type: "jsonb",
            isNullable: true,
            comment: "OCR 엔진 설정 파라미터",
          },
          {
            name: "processing_model",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "사용된 OCR 모델명",
          },

          // 원본 OCR 결과 (FR-028)
          {
            name: "raw_text",
            type: "text",
            isNullable: true,
            comment: "추출된 전체 텍스트",
          },
          {
            name: "raw_data",
            type: "jsonb",
            isNullable: true,
            comment: "OCR 엔진 원본 응답 데이터",
          },
          {
            name: "text_blocks",
            type: "jsonb",
            isNullable: true,
            comment: "텍스트 블록별 정보 (좌표, 신뢰도)",
          },
          {
            name: "word_level_data",
            type: "jsonb",
            isNullable: true,
            comment: "단어 수준 OCR 결과",
          },
          {
            name: "character_level_data",
            type: "jsonb",
            isNullable: true,
            comment: "문자 수준 OCR 결과",
          },

          // 구조화된 데이터 (FR-028)
          {
            name: "extracted_amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
            comment: "추출된 금액",
          },
          {
            name: "extracted_date",
            type: "date",
            isNullable: true,
            comment: "추출된 날짜",
          },
          {
            name: "extracted_time",
            type: "time",
            isNullable: true,
            comment: "추출된 시간",
          },
          {
            name: "extracted_vendor_name",
            type: "varchar",
            length: "200",
            isNullable: true,
            comment: "추출된 업체명",
          },
          {
            name: "extracted_vendor_address",
            type: "text",
            isNullable: true,
            comment: "추출된 업체 주소",
          },
          {
            name: "extracted_vendor_phone",
            type: "varchar",
            length: "20",
            isNullable: true,
            comment: "추출된 업체 전화번호",
          },
          {
            name: "extracted_tax_amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
            comment: "추출된 세금 금액",
          },
          {
            name: "extracted_items",
            type: "jsonb",
            isNullable: true,
            comment: "추출된 상품/서비스 항목들",
          },
          {
            name: "extracted_payment_method",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "추출된 결제 수단",
          },
          {
            name: "extracted_receipt_number",
            type: "varchar",
            length: "100",
            isNullable: true,
            comment: "추출된 영수증 번호",
          },

          // 신뢰도 및 품질 정보 (FR-028)
          {
            name: "overall_confidence",
            type: "decimal",
            precision: 5,
            scale: 4,
            isNullable: true,
            comment: "전체 신뢰도 (0.0000-1.0000)",
          },
          {
            name: "confidence_level",
            type: "enum",
            enum: ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
            enumName: "confidence_level",
            isNullable: true,
          },
          {
            name: "amount_confidence",
            type: "decimal",
            precision: 5,
            scale: 4,
            isNullable: true,
            comment: "금액 추출 신뢰도",
          },
          {
            name: "date_confidence",
            type: "decimal",
            precision: 5,
            scale: 4,
            isNullable: true,
            comment: "날짜 추출 신뢰도",
          },
          {
            name: "vendor_confidence",
            type: "decimal",
            precision: 5,
            scale: 4,
            isNullable: true,
            comment: "업체명 추출 신뢰도",
          },
          {
            name: "text_quality_score",
            type: "decimal",
            precision: 5,
            scale: 4,
            isNullable: true,
            comment: "텍스트 품질 점수",
          },

          // 언어 및 지역 정보
          {
            name: "detected_language",
            type: "varchar",
            length: "10",
            isNullable: true,
            comment: "감지된 언어 (ko, en 등)",
          },
          {
            name: "language_confidence",
            type: "decimal",
            precision: 5,
            scale: 4,
            isNullable: true,
            comment: "언어 감지 신뢰도",
          },
          {
            name: "text_direction",
            type: "varchar",
            length: "20",
            isNullable: true,
            comment: "텍스트 방향 (ltr, rtl)",
          },
          {
            name: "writing_script",
            type: "varchar",
            length: "20",
            isNullable: true,
            comment: "문자 체계 (latin, hangul, kanji 등)",
          },

          // 처리 성능 및 메트릭
          {
            name: "processing_time_ms",
            type: "integer",
            isNullable: true,
            comment: "OCR 처리 소요 시간 (밀리초)",
          },
          {
            name: "cpu_time_ms",
            type: "integer",
            isNullable: true,
            comment: "CPU 사용 시간 (밀리초)",
          },
          {
            name: "memory_usage_mb",
            type: "decimal",
            precision: 8,
            scale: 2,
            isNullable: true,
            comment: "메모리 사용량 (MB)",
          },
          {
            name: "characters_recognized",
            type: "integer",
            isNullable: true,
            comment: "인식된 문자 수",
          },
          {
            name: "words_recognized",
            type: "integer",
            isNullable: true,
            comment: "인식된 단어 수",
          },
          {
            name: "lines_recognized",
            type: "integer",
            isNullable: true,
            comment: "인식된 라인 수",
          },

          // 상태 및 오류 정보
          {
            name: "status",
            type: "enum",
            enum: [
              "PENDING",
              "IN_PROGRESS",
              "COMPLETED",
              "FAILED",
              "CANCELLED",
            ],
            enumName: "ocr_processing_status",
            default: "'PENDING'",
          },
          {
            name: "error_code",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "오류 코드",
          },
          {
            name: "error_message",
            type: "text",
            isNullable: true,
            comment: "오류 메시지",
          },
          {
            name: "warning_messages",
            type: "text[]",
            isNullable: true,
            comment: "경고 메시지 목록",
          },
          {
            name: "retry_count",
            type: "integer",
            default: 0,
            comment: "재시도 횟수",
          },

          // 후처리 및 검증 정보
          {
            name: "post_processing_applied",
            type: "text[]",
            isNullable: true,
            comment: "적용된 후처리 작업 목록",
          },
          {
            name: "spell_check_applied",
            type: "boolean",
            default: false,
            comment: "맞춤법 검사 적용 여부",
          },
          {
            name: "grammar_check_applied",
            type: "boolean",
            default: false,
            comment: "문법 검사 적용 여부",
          },
          {
            name: "data_validation_results",
            type: "jsonb",
            isNullable: true,
            comment: "데이터 유효성 검증 결과",
          },
          {
            name: "anomaly_flags",
            type: "text[]",
            isNullable: true,
            comment: "이상치 감지 플래그",
          },

          // 메타데이터 및 추가 정보
          {
            name: "processing_environment",
            type: "jsonb",
            isNullable: true,
            comment: "처리 환경 정보 (서버, GPU 등)",
          },
          {
            name: "cost_estimation",
            type: "decimal",
            precision: 10,
            scale: 6,
            isNullable: true,
            comment: "예상 처리 비용 (API 호출 비용 등)",
          },
          {
            name: "tags",
            type: "text[]",
            isNullable: true,
            comment: "분류 태그",
          },
          {
            name: "notes",
            type: "text",
            isNullable: true,
            comment: "추가 메모",
          },

          // 타임스탬프
          {
            name: "processing_started_at",
            type: "timestamp",
            isNullable: true,
            comment: "OCR 처리 시작 시간",
          },
          {
            name: "processing_completed_at",
            type: "timestamp",
            isNullable: true,
            comment: "OCR 처리 완료 시간",
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
            name: "ocr_results_confidence_range",
            expression:
              "overall_confidence IS NULL OR (overall_confidence >= 0 AND overall_confidence <= 1)",
          },
          {
            name: "ocr_results_amount_confidence_range",
            expression:
              "amount_confidence IS NULL OR (amount_confidence >= 0 AND amount_confidence <= 1)",
          },
          {
            name: "ocr_results_date_confidence_range",
            expression:
              "date_confidence IS NULL OR (date_confidence >= 0 AND date_confidence <= 1)",
          },
          {
            name: "ocr_results_vendor_confidence_range",
            expression:
              "vendor_confidence IS NULL OR (vendor_confidence >= 0 AND vendor_confidence <= 1)",
          },
          {
            name: "ocr_results_language_confidence_range",
            expression:
              "language_confidence IS NULL OR (language_confidence >= 0 AND language_confidence <= 1)",
          },
          {
            name: "ocr_results_text_quality_range",
            expression:
              "text_quality_score IS NULL OR (text_quality_score >= 0 AND text_quality_score <= 1)",
          },
          {
            name: "ocr_results_amounts_positive",
            expression: "extracted_amount IS NULL OR extracted_amount >= 0",
          },
          {
            name: "ocr_results_tax_amount_positive",
            expression:
              "extracted_tax_amount IS NULL OR extracted_tax_amount >= 0",
          },
          {
            name: "ocr_results_processing_time_positive",
            expression: "processing_time_ms IS NULL OR processing_time_ms >= 0",
          },
          {
            name: "ocr_results_retry_count_positive",
            expression: "retry_count >= 0",
          },
          {
            name: "ocr_results_recognition_counts_positive",
            expression:
              "characters_recognized IS NULL OR characters_recognized >= 0",
          },
        ],
      }),
      true,
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "ocr_results",
      new ForeignKey({
        columnNames: ["receipt_scan_id"],
        referencedTableName: "receipt_scans",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "ocr_results",
      new ForeignKey({
        columnNames: ["processed_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_receipt_scan_id", ["receipt_scan_id"]),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_engine_type", ["engine_type"]),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_status", ["status"]),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_confidence_level", ["confidence_level"]),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_overall_confidence", ["overall_confidence"], {
        order: { overall_confidence: "DESC" },
        where: "overall_confidence IS NOT NULL",
      }),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_extracted_amount", ["extracted_amount"], {
        order: { extracted_amount: "DESC" },
        where: "extracted_amount IS NOT NULL",
      }),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_extracted_date", ["extracted_date"], {
        order: { extracted_date: "DESC" },
        where: "extracted_date IS NOT NULL",
      }),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_processing_time", ["processing_time_ms"], {
        order: { processing_time_ms: "DESC" },
        where: "processing_time_ms IS NOT NULL",
      }),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_detected_language", ["detected_language"]),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index(
        "idx_ocr_results_processing_completed",
        ["processing_completed_at"],
        {
          order: { processing_completed_at: "DESC" },
          where: "processing_completed_at IS NOT NULL",
        },
      ),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_failed_status", ["status", "retry_count"], {
        where: "status = 'FAILED'",
      }),
    );

    // 복합 인덱스 (성능 최적화)
    await queryRunner.createIndex(
      "ocr_results",
      new Index(
        "idx_ocr_results_engine_status_time",
        ["engine_type", "status", "processing_completed_at"],
        {
          order: {
            engine_type: "ASC",
            status: "ASC",
            processing_completed_at: "DESC",
          },
        },
      ),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index(
        "idx_ocr_results_confidence_engine",
        ["confidence_level", "engine_type"],
        {
          order: { confidence_level: "DESC", engine_type: "ASC" },
        },
      ),
    );

    await queryRunner.createIndex(
      "ocr_results",
      new Index("idx_ocr_results_scan_status", ["receipt_scan_id", "status"], {
        order: { receipt_scan_id: "ASC", status: "ASC" },
      }),
    );

    // JSON 인덱스 (JSONB 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_raw_data_gin 
            ON ocr_results USING gin(raw_data)
            WHERE raw_data IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_text_blocks_gin 
            ON ocr_results USING gin(text_blocks)
            WHERE text_blocks IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_extracted_items_gin 
            ON ocr_results USING gin(extracted_items)
            WHERE extracted_items IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_engine_config_gin 
            ON ocr_results USING gin(engine_config)
            WHERE engine_config IS NOT NULL;
        `);

    // 배열 인덱스
    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_tags_gin 
            ON ocr_results USING gin(tags)
            WHERE tags IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_warning_messages_gin 
            ON ocr_results USING gin(warning_messages)
            WHERE warning_messages IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_anomaly_flags_gin 
            ON ocr_results USING gin(anomaly_flags)
            WHERE anomaly_flags IS NOT NULL;
        `);

    // GIN 인덱스 (전문 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_raw_text_search 
            ON ocr_results USING gin(raw_text gin_trgm_ops)
            WHERE raw_text IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_vendor_name_search 
            ON ocr_results USING gin(extracted_vendor_name gin_trgm_ops)
            WHERE extracted_vendor_name IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_ocr_results_notes_search 
            ON ocr_results USING gin(notes gin_trgm_ops)
            WHERE notes IS NOT NULL;
        `);

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_ocr_results_updated_at
                BEFORE UPDATE ON ocr_results
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

    // OCR 결과 처리 시간 및 신뢰도 자동 계산 트리거
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_ocr_result_metrics()
            RETURNS TRIGGER AS $$
            BEGIN
                -- 처리 시간 계산
                IF NEW.processing_completed_at IS NOT NULL AND NEW.processing_started_at IS NOT NULL THEN
                    NEW.processing_time_ms = EXTRACT(EPOCH FROM (NEW.processing_completed_at - NEW.processing_started_at)) * 1000;
                END IF;
                
                -- 상태에 따른 타임스탬프 자동 설정
                IF NEW.status = 'IN_PROGRESS' AND OLD.status != 'IN_PROGRESS' THEN
                    NEW.processing_started_at = CURRENT_TIMESTAMP;
                ELSIF NEW.status IN ('COMPLETED', 'FAILED', 'CANCELLED') AND OLD.status = 'IN_PROGRESS' THEN
                    NEW.processing_completed_at = CURRENT_TIMESTAMP;
                END IF;
                
                -- 신뢰도 수준 자동 결정
                IF NEW.overall_confidence IS NOT NULL THEN
                    IF NEW.overall_confidence >= 0.9 THEN
                        NEW.confidence_level = 'VERY_HIGH';
                    ELSIF NEW.overall_confidence >= 0.7 THEN
                        NEW.confidence_level = 'HIGH';
                    ELSIF NEW.overall_confidence >= 0.5 THEN
                        NEW.confidence_level = 'MEDIUM';
                    ELSIF NEW.overall_confidence >= 0.3 THEN
                        NEW.confidence_level = 'LOW';
                    ELSE
                        NEW.confidence_level = 'VERY_LOW';
                    END IF;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE TRIGGER trigger_ocr_results_metrics
                BEFORE INSERT OR UPDATE ON ocr_results
                FOR EACH ROW
                EXECUTE FUNCTION update_ocr_result_metrics();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_ocr_results_metrics ON ocr_results;`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_ocr_results_updated_at ON ocr_results;`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_ocr_result_metrics();`,
    );

    // 인덱스 삭제
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ocr_results_notes_search;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ocr_results_vendor_name_search;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ocr_results_raw_text_search;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ocr_results_anomaly_flags_gin;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ocr_results_warning_messages_gin;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ocr_results_tags_gin;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ocr_results_engine_config_gin;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ocr_results_extracted_items_gin;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ocr_results_text_blocks_gin;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ocr_results_raw_data_gin;`,
    );
    await queryRunner.dropIndex("ocr_results", "idx_ocr_results_scan_status");
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_confidence_engine",
    );
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_engine_status_time",
    );
    await queryRunner.dropIndex("ocr_results", "idx_ocr_results_failed_status");
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_processing_completed",
    );
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_detected_language",
    );
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_processing_time",
    );
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_extracted_date",
    );
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_extracted_amount",
    );
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_overall_confidence",
    );
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_confidence_level",
    );
    await queryRunner.dropIndex("ocr_results", "idx_ocr_results_status");
    await queryRunner.dropIndex("ocr_results", "idx_ocr_results_engine_type");
    await queryRunner.dropIndex(
      "ocr_results",
      "idx_ocr_results_receipt_scan_id",
    );

    // 외래키 삭제
    const table = await queryRunner.getTable("ocr_results");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("ocr_results", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("ocr_results");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS confidence_level;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ocr_processing_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ocr_engine_type;`);
  }
}
