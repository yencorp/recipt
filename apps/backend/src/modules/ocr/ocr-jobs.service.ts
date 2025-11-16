import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReceiptScan } from "../../entities/receipt-scan.entity";

export interface OcrJob {
  id: string;
  receiptScanId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

@Injectable()
export class OcrJobsService {
  private jobQueue: Map<string, OcrJob> = new Map();

  constructor(
    @InjectRepository(ReceiptScan)
    private readonly receiptScanRepository: Repository<ReceiptScan>
  ) {}

  // OCR 작업 생성 및 큐에 추가
  async createJob(receiptScanId: string): Promise<OcrJob> {
    const jobId = `ocr_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const job: OcrJob = {
      id: jobId,
      receiptScanId,
      status: "PENDING",
    };

    this.jobQueue.set(jobId, job);
    console.log(`OCR job created: ${jobId} for receipt ${receiptScanId}`);

    // 비동기로 OCR 처리 시작
    this.processJob(jobId);

    return job;
  }

  // OCR 작업 처리 (실제 OCR 서비스 연동 전 시뮬레이션)
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobQueue.get(jobId);
    if (!job) return;

    try {
      // 작업 시작
      job.status = "PROCESSING";
      job.startedAt = new Date();
      this.jobQueue.set(jobId, job);

      await this.receiptScanRepository.update(job.receiptScanId, {
        uploadStatus: "PROCESSING",
      });

      console.log(`OCR processing started: ${jobId}`);

      // TODO: 실제 OCR 서비스 호출
      // const ocrResult = await this.ocrService.processImage(imagePath);

      // 시뮬레이션: 2초 대기
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 작업 완료
      job.status = "COMPLETED";
      job.completedAt = new Date();
      this.jobQueue.set(jobId, job);

      await this.receiptScanRepository.update(job.receiptScanId, {
        uploadStatus: "COMPLETED",
      });

      console.log(`OCR processing completed: ${jobId}`);
    } catch (error) {
      // 작업 실패
      job.status = "FAILED";
      job.error = error.message;
      job.completedAt = new Date();
      this.jobQueue.set(jobId, job);

      await this.receiptScanRepository.update(job.receiptScanId, {
        uploadStatus: "FAILED",
      });

      console.error(`OCR processing failed: ${jobId}`, error);
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
    const jobs = Array.from(this.jobQueue.values()).filter(
      (job) => job.receiptScanId === receiptScanId
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
