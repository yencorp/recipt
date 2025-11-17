import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReceiptScan, UploadStatus } from "../../entities/receipt-scan.entity";
import { OcrClientService } from "./ocr-client.service";

export interface OcrJob {
  id: string;
  receiptScanIds: string[]; // 단일 또는 배치 영수증 ID들
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "PARTIAL" | "FAILED";
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  totalFiles?: number;
  processedFiles?: number;
  successFiles?: number;
  failedFiles?: number;
}

@Injectable()
export class OcrJobsService {
  private readonly logger = new Logger(OcrJobsService.name);
  private jobQueue: Map<string, OcrJob> = new Map();

  constructor(
    @InjectRepository(ReceiptScan)
    private readonly receiptScanRepository: Repository<ReceiptScan>,
    private readonly ocrClientService: OcrClientService
  ) {}

  /**
   * 단일 영수증 OCR 작업 생성 (TSD 명세)
   */
  async createJob(receiptScanId: string): Promise<OcrJob> {
    return this.createBatchJob([receiptScanId]);
  }

  /**
   * 배치 영수증 OCR 작업 생성 (TSD 명세)
   */
  async createBatchJob(receiptScanIds: string[]): Promise<OcrJob> {
    this.logger.log(
      `Creating OCR batch job for ${receiptScanIds.length} receipts`
    );

    const job: OcrJob = {
      id: "", // FastAPI에서 받아올 Job ID
      receiptScanIds,
      status: "PENDING",
      totalFiles: receiptScanIds.length,
      processedFiles: 0,
      successFiles: 0,
      failedFiles: 0,
    };

    // 비동기로 OCR 처리 시작
    this.processJob(job);

    return job;
  }

  /**
   * FastAPI OCR 서비스로 파일 전송 및 처리 (TSD 명세)
   */
  private async processJob(job: OcrJob): Promise<void> {
    try {
      // 영수증 스캔 데이터 조회
      const receiptScans = await this.receiptScanRepository.findByIds(
        job.receiptScanIds
      );

      if (receiptScans.length === 0) {
        throw new Error("영수증 스캔 데이터를 찾을 수 없습니다.");
      }

      // 작업 시작 상태로 업데이트
      job.status = "PROCESSING";
      job.startedAt = new Date();

      await Promise.all(
        receiptScans.map((scan) =>
          this.receiptScanRepository.update(scan.id, {
            uploadStatus: UploadStatus.UPLOADING,
          })
        )
      );

      this.logger.log(`OCR processing started for ${receiptScans.length} files`);

      // FastAPI OCR 서비스로 파일 전송
      const files: Express.Multer.File[] = await this.prepareFilesForOcr(
        receiptScans
      );

      const ocrJobResponse = await this.ocrClientService.processReceipts(
        files,
        receiptScans[0].settlementId || undefined
      );

      // FastAPI에서 받은 Job ID로 업데이트
      job.id = ocrJobResponse.jobId;
      this.jobQueue.set(job.id, job);

      this.logger.log(`OCR job created in FastAPI: ${job.id}`);

      // 주기적으로 Job 상태 확인 (폴링)
      await this.pollJobStatus(job.id);
    } catch (error) {
      this.logger.error(`OCR processing failed: ${error.message}`, error.stack);

      job.status = "FAILED";
      job.error = error.message;
      job.completedAt = new Date();

      if (job.id) {
        this.jobQueue.set(job.id, job);
      }

      // 모든 영수증 실패 상태로 업데이트
      await Promise.all(
        job.receiptScanIds.map((scanId) =>
          this.receiptScanRepository.update(scanId, {
            uploadStatus: UploadStatus.FAILED,
          })
        )
      );
    }
  }

  /**
   * 영수증 스캔 데이터를 Multer.File 형식으로 변환
   */
  private async prepareFilesForOcr(
    receiptScans: ReceiptScan[]
  ): Promise<Express.Multer.File[]> {
    const fs = await import("fs");
    const path = await import("path");

    return receiptScans.map((scan) => {
      const buffer = fs.readFileSync(scan.imagePath);
      const filename = path.basename(scan.imagePath);

      return {
        buffer,
        originalname: scan.originalFilename || filename,
        mimetype: "image/jpeg", // 실제로는 파일 확장자에서 추론
        path: scan.imagePath,
        size: buffer.length,
      } as Express.Multer.File;
    });
  }

  /**
   * FastAPI OCR Job 상태 폴링 (TSD 명세)
   */
  private async pollJobStatus(jobId: string, maxAttempts = 60): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초마다 확인

      try {
        const result = await this.ocrClientService.getJobStatus(jobId);

        const job = this.jobQueue.get(jobId);
        if (!job) return;

        // Job 상태 업데이트
        job.status = result.status;
        job.processedFiles = result.processedFiles;
        job.successFiles = result.successFiles;
        job.failedFiles = result.failedFiles;

        this.logger.log(
          `OCR Job ${jobId} status: ${result.status} (${result.processedFiles}/${result.totalFiles})`
        );

        if (
          result.status === "COMPLETED" ||
          result.status === "PARTIAL" ||
          result.status === "FAILED"
        ) {
          // 작업 완료
          job.completedAt = new Date();
          this.jobQueue.set(jobId, job);

          // OCR 결과 저장
          await this.saveOcrResults(job, result);

          this.logger.log(`OCR Job ${jobId} completed`);
          return;
        }

        this.jobQueue.set(jobId, job);
      } catch (error) {
        this.logger.error(
          `Failed to poll OCR job ${jobId}: ${error.message}`,
          error.stack
        );

        if (attempt === maxAttempts - 1) {
          const job = this.jobQueue.get(jobId);
          if (job) {
            job.status = "FAILED";
            job.error = "OCR 작업 상태 확인 실패";
            job.completedAt = new Date();
            this.jobQueue.set(jobId, job);
          }
        }
      }
    }
  }

  /**
   * OCR 결과를 데이터베이스에 저장
   */
  private async saveOcrResults(job: OcrJob, result: any): Promise<void> {
    try {
      // 각 OCR 결과를 해당 영수증에 저장
      for (const ocrResult of result.results) {
        const receiptScan = await this.receiptScanRepository.findOne({
          where: { originalFilename: ocrResult.filename },
        });

        if (receiptScan) {
          await this.receiptScanRepository.update(receiptScan.id, {
            uploadStatus: ocrResult.success
              ? UploadStatus.UPLOADED
              : UploadStatus.FAILED,
            // TODO: OCR 추출 데이터를 영수증 엔티티에 저장
            // extractedDate: ocrResult.extractedData?.date,
            // merchantName: ocrResult.extractedData?.merchantName,
            // totalAmount: ocrResult.extractedData?.totalAmount,
          });

          this.logger.log(
            `Saved OCR result for ${ocrResult.filename}: ${ocrResult.success ? "SUCCESS" : "FAILED"}`
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to save OCR results: ${error.message}`,
        error.stack
      );
    }
  }

  // 작업 상태 조회
  async getJobStatus(jobId: string): Promise<OcrJob> {
    const job = this.jobQueue.get(jobId);
    if (!job) {
      throw new Error(`OCR 작업을 찾을 수 없습니다: ${jobId}`);
    }
    return job;
  }

  // 영수증 스캔의 OCR 작업 조회
  async getJobByReceiptScan(receiptScanId: string): Promise<OcrJob[]> {
    const jobs = Array.from(this.jobQueue.values()).filter((job) =>
      job.receiptScanIds.includes(receiptScanId)
    );
    return jobs;
  }

  // 모든 작업 조회
  async getAllJobs(): Promise<OcrJob[]> {
    return Array.from(this.jobQueue.values()).sort((a, b) => {
      const aTime = a.startedAt?.getTime() || 0;
      const bTime = b.startedAt?.getTime() || 0;
      return bTime - aTime;
    });
  }

  // 작업 통계
  async getJobStats() {
    const jobs = Array.from(this.jobQueue.values());

    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === "PENDING").length;
    const processing = jobs.filter((j) => j.status === "PROCESSING").length;
    const completed = jobs.filter((j) => j.status === "COMPLETED").length;
    const failed = jobs.filter((j) => j.status === "FAILED").length;

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
