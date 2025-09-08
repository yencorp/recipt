import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm";

export class CreateReceiptScansTable1757332295000
  implements MigrationInterface
{
  name = "CreateReceiptScansTable1757332295000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 영수증 스캔 상태 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE receipt_scan_status AS ENUM (
                'UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED', 'ARCHIVED'
            );
        `);

    // 파일 형식 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE file_format AS ENUM (
                'JPEG', 'JPG', 'PNG', 'PDF', 'TIFF', 'WEBP', 'HEIC'
            );
        `);

    // 이미지 품질 ENUM 생성
    await queryRunner.query(`
            CREATE TYPE image_quality AS ENUM (
                'POOR', 'FAIR', 'GOOD', 'EXCELLENT'
            );
        `);

    // receipt_scans 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: "receipt_scans",
        columns: [
          // 기본 식별자
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          // 관계 정보 (FR-027)
          {
            name: "budget_expense_id",
            type: "uuid",
            isNullable: true,
            comment: "연결된 예산 지출 ID",
          },
          {
            name: "uploaded_by",
            type: "uuid",
            isNullable: false,
            comment: "업로드한 사용자 ID",
          },

          // 파일 기본 정보 (FR-027)
          {
            name: "original_filename",
            type: "varchar",
            length: "255",
            isNullable: false,
            comment: "원본 파일명",
          },
          {
            name: "stored_filename",
            type: "varchar",
            length: "255",
            isNullable: false,
            comment: "저장된 파일명 (UUID 기반)",
          },
          {
            name: "file_path",
            type: "varchar",
            length: "500",
            isNullable: false,
            comment: "파일 저장 경로",
          },
          {
            name: "file_size",
            type: "bigint",
            isNullable: false,
            comment: "파일 크기 (bytes)",
          },
          {
            name: "file_format",
            type: "enum",
            enum: ["JPEG", "JPG", "PNG", "PDF", "TIFF", "WEBP", "HEIC"],
            enumName: "file_format",
            isNullable: false,
          },
          {
            name: "mime_type",
            type: "varchar",
            length: "100",
            isNullable: false,
            comment: "MIME 타입",
          },
          {
            name: "file_hash",
            type: "varchar",
            length: "64",
            isNullable: false,
            comment: "SHA-256 해시 (중복 방지)",
          },

          // 이미지 메타데이터 (FR-027)
          {
            name: "width",
            type: "integer",
            isNullable: true,
            comment: "이미지 너비 (픽셀)",
          },
          {
            name: "height",
            type: "integer",
            isNullable: true,
            comment: "이미지 높이 (픽셀)",
          },
          {
            name: "resolution_dpi",
            type: "integer",
            isNullable: true,
            comment: "해상도 (DPI)",
          },
          {
            name: "color_space",
            type: "varchar",
            length: "20",
            isNullable: true,
            comment: "색공간 (RGB, CMYK, Grayscale)",
          },
          {
            name: "bit_depth",
            type: "integer",
            isNullable: true,
            comment: "비트 깊이",
          },
          {
            name: "compression",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "압축 방식",
          },

          // 품질 평가 (FR-027)
          {
            name: "image_quality",
            type: "enum",
            enum: ["POOR", "FAIR", "GOOD", "EXCELLENT"],
            enumName: "image_quality",
            isNullable: true,
            comment: "이미지 품질 평가",
          },
          {
            name: "clarity_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: true,
            comment: "선명도 점수 (0.00-1.00)",
          },
          {
            name: "brightness_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: true,
            comment: "밝기 점수 (0.00-1.00)",
          },
          {
            name: "contrast_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: true,
            comment: "대비 점수 (0.00-1.00)",
          },
          {
            name: "text_readability_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: true,
            comment: "텍스트 가독성 점수 (0.00-1.00)",
          },

          // 전처리 정보
          {
            name: "is_preprocessed",
            type: "boolean",
            default: false,
            comment: "전처리 완료 여부",
          },
          {
            name: "preprocessing_operations",
            type: "text[]",
            isNullable: true,
            comment: "수행된 전처리 작업 목록",
          },
          {
            name: "rotation_angle",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: "회전 각도 (도)",
          },
          {
            name: "crop_coordinates",
            type: "jsonb",
            isNullable: true,
            comment: "크롭 좌표 {x, y, width, height}",
          },
          {
            name: "enhancement_applied",
            type: "boolean",
            default: false,
            comment: "화질 향상 적용 여부",
          },

          // 썸네일 정보
          {
            name: "thumbnail_path",
            type: "varchar",
            length: "500",
            isNullable: true,
            comment: "썸네일 파일 경로",
          },
          {
            name: "thumbnail_size",
            type: "integer",
            isNullable: true,
            comment: "썸네일 파일 크기 (bytes)",
          },

          // OCR 관련 메타데이터
          {
            name: "text_regions_count",
            type: "integer",
            isNullable: true,
            comment: "감지된 텍스트 영역 수",
          },
          {
            name: "detected_language",
            type: "varchar",
            length: "10",
            isNullable: true,
            comment: "감지된 언어 코드 (ko, en 등)",
          },
          {
            name: "text_orientation",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: "텍스트 방향 (도)",
          },

          // 상태 및 처리 정보
          {
            name: "status",
            type: "enum",
            enum: ["UPLOADED", "PROCESSING", "PROCESSED", "FAILED", "ARCHIVED"],
            enumName: "receipt_scan_status",
            default: "'UPLOADED'",
          },
          {
            name: "processing_started_at",
            type: "timestamp",
            isNullable: true,
            comment: "처리 시작 시간",
          },
          {
            name: "processing_completed_at",
            type: "timestamp",
            isNullable: true,
            comment: "처리 완료 시간",
          },
          {
            name: "processing_duration_ms",
            type: "integer",
            isNullable: true,
            comment: "처리 소요 시간 (밀리초)",
          },
          {
            name: "error_message",
            type: "text",
            isNullable: true,
            comment: "처리 오류 메시지",
          },
          {
            name: "retry_count",
            type: "integer",
            default: 0,
            comment: "재시도 횟수",
          },

          // 보안 및 개인정보
          {
            name: "contains_sensitive_data",
            type: "boolean",
            default: false,
            comment: "민감 정보 포함 여부",
          },
          {
            name: "privacy_mask_applied",
            type: "boolean",
            default: false,
            comment: "개인정보 마스킹 적용 여부",
          },
          {
            name: "masked_regions",
            type: "jsonb",
            isNullable: true,
            comment: "마스킹된 영역 좌표",
          },

          // 메타데이터
          {
            name: "exif_data",
            type: "jsonb",
            isNullable: true,
            comment: "EXIF 메타데이터",
          },
          {
            name: "device_info",
            type: "jsonb",
            isNullable: true,
            comment: "촬영/스캔 디바이스 정보",
          },
          {
            name: "upload_method",
            type: "varchar",
            length: "50",
            isNullable: true,
            comment: "업로드 방식 (camera, file_upload, drag_drop)",
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
            name: "uploaded_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            comment: "업로드 시간",
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
            name: "receipt_scans_file_size_positive",
            expression: "file_size > 0",
          },
          {
            name: "receipt_scans_dimensions_positive",
            expression: "width IS NULL OR width > 0",
          },
          {
            name: "receipt_scans_height_positive",
            expression: "height IS NULL OR height > 0",
          },
          {
            name: "receipt_scans_dpi_valid",
            expression: "resolution_dpi IS NULL OR resolution_dpi > 0",
          },
          {
            name: "receipt_scans_clarity_score_range",
            expression:
              "clarity_score IS NULL OR (clarity_score >= 0 AND clarity_score <= 1)",
          },
          {
            name: "receipt_scans_brightness_score_range",
            expression:
              "brightness_score IS NULL OR (brightness_score >= 0 AND brightness_score <= 1)",
          },
          {
            name: "receipt_scans_contrast_score_range",
            expression:
              "contrast_score IS NULL OR (contrast_score >= 0 AND contrast_score <= 1)",
          },
          {
            name: "receipt_scans_readability_score_range",
            expression:
              "text_readability_score IS NULL OR (text_readability_score >= 0 AND text_readability_score <= 1)",
          },
          {
            name: "receipt_scans_retry_count_positive",
            expression: "retry_count >= 0",
          },
          {
            name: "receipt_scans_filename_length",
            expression:
              "LENGTH(original_filename) >= 1 AND LENGTH(stored_filename) >= 1",
          },
          {
            name: "receipt_scans_processing_duration_positive",
            expression:
              "processing_duration_ms IS NULL OR processing_duration_ms >= 0",
          },
        ],
        uniques: [
          {
            name: "receipt_scans_file_hash_unique",
            columnNames: ["file_hash"],
          },
          {
            name: "receipt_scans_stored_filename_unique",
            columnNames: ["stored_filename"],
          },
        ],
      }),
      true
    );

    // 외래키 생성
    await queryRunner.createForeignKey(
      "receipt_scans",
      new TableForeignKey({
        columnNames: ["budget_expense_id"],
        referencedTableName: "budget_expenses",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    await queryRunner.createForeignKey(
      "receipt_scans",
      new TableForeignKey({
        columnNames: ["uploaded_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    // 인덱스 생성
    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_budget_expense_id",
        columnNames: ["budget_expense_id"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_uploaded_by",
        columnNames: ["uploaded_by"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_status",
        columnNames: ["status"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_file_format",
        columnNames: ["file_format"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_image_quality",
        columnNames: ["image_quality"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_file_hash",
        columnNames: ["file_hash"],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_uploaded_at",
        columnNames: ["uploaded_at"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_processing_completed_at",
        columnNames: ["processing_completed_at"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_file_size",
        columnNames: ["file_size"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_text_readability",
        columnNames: ["text_readability_score"],
        where: "text_readability_score IS NOT NULL",
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_sensitive_data",
        columnNames: ["contains_sensitive_data"],
        where: "contains_sensitive_data = TRUE",
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_failed_processing",
        columnNames: ["status", "retry_count"],
        where: "status = 'FAILED'",
      })
    );

    // 복합 인덱스 (성능 최적화)
    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_user_status_date",
        columnNames: ["uploaded_by", "status", "uploaded_at"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_expense_status",
        columnNames: ["budget_expense_id", "status"],
      })
    );

    await queryRunner.createIndex(
      "receipt_scans",
      new TableIndex({
        name: "idx_receipt_scans_quality_format",
        columnNames: ["image_quality", "file_format"],
      })
    );

    // JSON 인덱스 (JSONB 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_receipt_scans_exif_data_gin 
            ON receipt_scans USING gin(exif_data)
            WHERE exif_data IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_receipt_scans_device_info_gin 
            ON receipt_scans USING gin(device_info)
            WHERE device_info IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_receipt_scans_crop_coordinates_gin 
            ON receipt_scans USING gin(crop_coordinates)
            WHERE crop_coordinates IS NOT NULL;
        `);

    // 배열 인덱스
    await queryRunner.query(`
            CREATE INDEX idx_receipt_scans_tags_gin 
            ON receipt_scans USING gin(tags)
            WHERE tags IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX idx_receipt_scans_preprocessing_gin 
            ON receipt_scans USING gin(preprocessing_operations)
            WHERE preprocessing_operations IS NOT NULL;
        `);

    // GIN 인덱스 (전문 검색용)
    await queryRunner.query(`
            CREATE INDEX idx_receipt_scans_filename_search 
            ON receipt_scans USING gin(original_filename gin_trgm_ops);
        `);

    await queryRunner.query(`
            CREATE INDEX idx_receipt_scans_notes_search 
            ON receipt_scans USING gin(notes gin_trgm_ops)
            WHERE notes IS NOT NULL;
        `);

    // updated_at 자동 업데이트 트리거 생성
    await queryRunner.query(`
            CREATE TRIGGER trigger_receipt_scans_updated_at
                BEFORE UPDATE ON receipt_scans
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

    // 처리 시간 자동 계산 트리거
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_receipt_scan_processing_duration()
            RETURNS TRIGGER AS $$
            BEGIN
                -- 처리 완료 시 소요 시간 계산
                IF NEW.processing_completed_at IS NOT NULL AND NEW.processing_started_at IS NOT NULL THEN
                    NEW.processing_duration_ms = EXTRACT(EPOCH FROM (NEW.processing_completed_at - NEW.processing_started_at)) * 1000;
                END IF;
                
                -- 처리 상태에 따른 타임스탬프 자동 설정
                IF NEW.status = 'PROCESSING' AND OLD.status != 'PROCESSING' THEN
                    NEW.processing_started_at = CURRENT_TIMESTAMP;
                ELSIF NEW.status IN ('PROCESSED', 'FAILED') AND OLD.status = 'PROCESSING' THEN
                    NEW.processing_completed_at = CURRENT_TIMESTAMP;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE TRIGGER trigger_receipt_scans_processing_duration
                BEFORE INSERT OR UPDATE ON receipt_scans
                FOR EACH ROW
                EXECUTE FUNCTION update_receipt_scan_processing_duration();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 트리거 삭제
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_receipt_scans_processing_duration ON receipt_scans;`
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_receipt_scans_updated_at ON receipt_scans;`
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_receipt_scan_processing_duration();`
    );

    // 인덱스 삭제
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_receipt_scans_notes_search;`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_receipt_scans_filename_search;`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_receipt_scans_preprocessing_gin;`
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_receipt_scans_tags_gin;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_receipt_scans_crop_coordinates_gin;`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_receipt_scans_device_info_gin;`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_receipt_scans_exif_data_gin;`
    );
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_quality_format"
    );
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_expense_status"
    );
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_user_status_date"
    );
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_failed_processing"
    );
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_sensitive_data"
    );
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_text_readability"
    );
    await queryRunner.dropIndex("receipt_scans", "idx_receipt_scans_file_size");
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_processing_completed_at"
    );
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_uploaded_at"
    );
    await queryRunner.dropIndex("receipt_scans", "idx_receipt_scans_file_hash");
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_image_quality"
    );
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_file_format"
    );
    await queryRunner.dropIndex("receipt_scans", "idx_receipt_scans_status");
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_uploaded_by"
    );
    await queryRunner.dropIndex(
      "receipt_scans",
      "idx_receipt_scans_budget_expense_id"
    );

    // 외래키 삭제
    const table = await queryRunner.getTable("receipt_scans");
    const foreignKeys = table!.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("receipt_scans", foreignKey);
    }

    // 테이블 삭제
    await queryRunner.dropTable("receipt_scans");

    // ENUM 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS image_quality;`);
    await queryRunner.query(`DROP TYPE IF EXISTS file_format;`);
    await queryRunner.query(`DROP TYPE IF EXISTS receipt_scan_status;`);
  }
}
