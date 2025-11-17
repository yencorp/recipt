import { Injectable, HttpException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import FormData from "form-data";

// TSD 명세에 따른 OCR 응답 타입 정의
export enum ProcessingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  PARTIAL = "PARTIAL",
  FAILED = "FAILED",
}

export interface ReceiptData {
  date?: string;
  merchantName?: string;
  businessNumber?: string;
  totalAmount?: number;
  items?: any[];
  rawText?: string;
}

export interface OcrResultItem {
  filename: string;
  success: boolean;
  confidence: number;
  engineUsed?: string;
  extractedData?: ReceiptData;
  processingTime: number;
  error?: string;
}

export interface OcrJobResponse {
  jobId: string;
  status: ProcessingStatus;
  totalFiles: number;
  processedFiles: number;
  message?: string;
}

export interface OcrResultResponse {
  jobId: string;
  settlementId?: string;
  status: ProcessingStatus;
  totalFiles: number;
  processedFiles: number;
  successFiles: number;
  failedFiles: number;
  results: OcrResultItem[];
  errorMessage?: string;
  createdAt?: string;
}

@Injectable()
export class OcrClientService {
  private readonly logger = new Logger(OcrClientService.name);
  private readonly ocrServiceUrl: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    this.ocrServiceUrl =
      this.configService.get<string>("OCR_SERVICE_URL") ||
      "http://ocr-service:8001";
    this.timeout = this.configService.get<number>("OCR_TIMEOUT") || 30000;
  }

  /**
   * 영수증 이미지 OCR 처리 요청 (TSD 명세)
   * @param files - 업로드할 파일들
   * @param settlementId - 정산 ID (선택)
   * @returns OCR Job 정보
   */
  async processReceipts(
    files: Express.Multer.File[],
    settlementId?: string
  ): Promise<OcrJobResponse> {
    try {
      const formData = new FormData();

      // 파일 추가
      files.forEach((file) => {
        formData.append("files", file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });

      // Settlement ID 추가 (선택)
      if (settlementId) {
        formData.append("settlement_id", settlementId);
      }

      this.logger.log(
        `OCR 처리 요청: ${files.length}개 파일, Settlement ID: ${settlementId || "N/A"}`
      );

      const response = await axios.post<OcrJobResponse>(
        `${this.ocrServiceUrl}/api/v1/ocr/process`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout,
        }
      );

      this.logger.log(`OCR Job 생성 완료: ${response.data.jobId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`OCR 처리 요청 실패: ${error.message}`, error.stack);
      throw new HttpException(
        `OCR 서비스 통신 오류: ${error.message}`,
        503
      );
    }
  }

  /**
   * OCR Job 상태 및 결과 조회 (TSD 명세)
   * @param jobId - Job ID
   * @returns OCR 처리 결과
   */
  async getJobStatus(jobId: string): Promise<OcrResultResponse> {
    try {
      this.logger.log(`OCR Job 상태 조회: ${jobId}`);

      const response = await axios.get<OcrResultResponse>(
        `${this.ocrServiceUrl}/api/v1/ocr/jobs/${jobId}`,
        {
          timeout: 10000,
        }
      );

      this.logger.log(
        `OCR Job 상태: ${response.data.status}, 진행률: ${response.data.processedFiles}/${response.data.totalFiles}`
      );
      return response.data;
    } catch (error) {
      this.logger.error(`OCR Job 조회 실패: ${error.message}`, error.stack);
      throw new HttpException(`OCR Job 조회 오류: ${error.message}`, 503);
    }
  }

  /**
   * OCR Job 취소 (TSD 명세)
   * @param jobId - Job ID
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      this.logger.log(`OCR Job 취소 요청: ${jobId}`);

      await axios.delete(
        `${this.ocrServiceUrl}/api/v1/ocr/jobs/${jobId}`,
        {
          timeout: 10000,
        }
      );

      this.logger.log(`OCR Job 취소 완료: ${jobId}`);
    } catch (error) {
      this.logger.error(`OCR Job 취소 실패: ${error.message}`, error.stack);
      throw new HttpException(`OCR Job 취소 오류: ${error.message}`, 503);
    }
  }

  /**
   * OCR 서비스 Health Check
   * @returns 서비스 상태
   */
  async checkHealth(): Promise<{ status: string; service: string }> {
    try {
      const response = await axios.get<{ status: string; service: string }>(
        `${this.ocrServiceUrl}/health`,
        {
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `OCR 서비스 Health Check 실패: ${error.message}`,
        error.stack
      );
      throw new HttpException("OCR 서비스가 응답하지 않습니다", 503);
    }
  }
}
