import { Injectable, HttpException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

export interface OcrRequest {
  imagePath: string;
  language?: string;
  preprocessOptions?: {
    denoise?: boolean;
    deskew?: boolean;
    contrast?: boolean;
  };
}

export interface OcrResult {
  success: boolean;
  text?: string;
  confidence?: number;
  metadata?: {
    totalAmount?: number;
    date?: string;
    merchantName?: string;
    items?: Array<{
      name: string;
      quantity?: number;
      price?: number;
    }>;
  };
  error?: string;
}

@Injectable()
export class OcrClientService {
  private readonly ocrServiceUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(private readonly configService: ConfigService) {
    this.ocrServiceUrl =
      this.configService.get<string>("OCR_SERVICE_URL") ||
      "http://localhost:5000";
    this.timeout = this.configService.get<number>("OCR_TIMEOUT") || 30000;
    this.maxRetries = this.configService.get<number>("OCR_MAX_RETRIES") || 3;
  }

  // OCR 서비스에 이미지 처리 요청
  async processImage(request: OcrRequest): Promise<OcrResult> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(
          `OCR request attempt ${attempt}/${this.maxRetries}:`,
          request.imagePath
        );

        const response = await axios.post<OcrResult>(
          `${this.ocrServiceUrl}/api/ocr/process`,
          {
            imagePath: request.imagePath,
            language: request.language || "kor+eng",
            preprocessOptions: request.preprocessOptions || {},
          },
          {
            timeout: this.timeout,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("OCR processing successful:", response.data);
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(
          `OCR request failed (attempt ${attempt}/${this.maxRetries}):`,
          error.message
        );

        // 마지막 시도가 아니면 재시도 대기
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // 모든 재시도 실패
    throw new HttpException(
      `OCR 서비스 호출 실패 (${this.maxRetries}회 재시도): ${lastError.message}`,
      503
    );
  }

  // OCR 서비스 헬스 체크
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ocrServiceUrl}/health`, {
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      console.error("OCR service health check failed:", error.message);
      return false;
    }
  }

  // 일괄 처리 요청
  async processBatch(requests: OcrRequest[]): Promise<OcrResult[]> {
    console.log(`Processing batch of ${requests.length} images`);

    const results = await Promise.allSettled(
      requests.map((request) => this.processImage(request))
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(
          `Batch item ${index} failed:`,
          result.reason.message
        );
        return {
          success: false,
          error: result.reason.message,
        };
      }
    });
  }
}
