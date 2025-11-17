import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReceiptScan, UploadStatus } from "../../entities/receipt-scan.entity";
import { OcrResult as OcrResultEntity } from "../../entities/ocr-result.entity";
import { OcrClientService } from "./ocr-client.service";

export interface QueueItem {
  id: string;
  receiptScanId: string;
  imagePath: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

@Injectable()
export class OcrQueueService {
  private queue: Map<string, QueueItem> = new Map();
  private processing: boolean = false;

  constructor(
    @InjectRepository(ReceiptScan)
    private readonly receiptScanRepository: Repository<ReceiptScan>,
    @InjectRepository(OcrResultEntity)
    private readonly ocrResultRepository: Repository<OcrResultEntity>,
    private readonly ocrClientService: OcrClientService
  ) {
    // 큐 프로세서 자동 시작
    this.startQueueProcessor();
  }

  // 큐에 작업 추가
  async addToQueue(
    receiptScanId: string,
    imagePath: string,
    priority: number = 0
  ): Promise<QueueItem> {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const item: QueueItem = {
      id: queueId,
      receiptScanId,
      imagePath,
      priority,
      attempts: 0,
      maxAttempts: 3,
      status: "PENDING",
      createdAt: new Date(),
    };

    this.queue.set(queueId, item);
    console.log(`Added to OCR queue: ${queueId} (priority: ${priority})`);

    return item;
  }

  // 큐 프로세서 시작
  private async startQueueProcessor() {
    if (this.processing) return;

    this.processing = true;
    console.log("OCR queue processor started");

    while (this.processing) {
      try {
        const nextItem = this.getNextQueueItem();

        if (nextItem) {
          await this.processQueueItem(nextItem);
        } else {
          // 큐가 비어있으면 1초 대기
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error("Queue processor error:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  // 다음 처리할 아이템 가져오기 (우선순위 기반)
  private getNextQueueItem(): QueueItem | null {
    const pendingItems = Array.from(this.queue.values()).filter(
      (item) => item.status === "PENDING"
    );

    if (pendingItems.length === 0) return null;

    // 우선순위 내림차순, 생성시간 오름차순
    pendingItems.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return pendingItems[0];
  }

  // 큐 아이템 처리
  private async processQueueItem(item: QueueItem): Promise<void> {
    item.status = "PROCESSING";
    item.attempts++;
    this.queue.set(item.id, item);

    console.log(
      `Processing OCR queue item: ${item.id} (attempt ${item.attempts}/${item.maxAttempts})`
    );

    try {
      // 영수증 스캔 상태 업데이트
      await this.receiptScanRepository.update(item.receiptScanId, {
        uploadStatus: UploadStatus.UPLOADING,
      });

      // OCR 서비스 호출
      // TODO: processImage는 더 이상 사용되지 않음. processReceipts 사용
      // const ocrRequest = {
      //   imagePath: item.imagePath,
      //   language: "kor+eng",
      //   preprocessOptions: {
      //     denoise: true,
      //     deskew: true,
      //     contrast: true,
      //   },
      // };

      // const ocrResult = await this.ocrClientService.processImage(ocrRequest);
      throw new Error("OcrQueueService는 더 이상 사용되지 않습니다. OcrJobsService를 사용하세요.");

      // if (ocrResult.success) {
      //   // OCR 결과 저장
      //   await this.saveOcrResult(item.receiptScanId, ocrResult);

      //   // 영수증 스캔 상태 업데이트
      //   await this.receiptScanRepository.update(item.receiptScanId, {
      //     uploadStatus: UploadStatus.UPLOADED,
      //   });

      //   // 큐 아이템 완료 처리
      //   item.status = "COMPLETED";
      //   item.processedAt = new Date();
      //   this.queue.set(item.id, item);

      //   console.log(`OCR processing completed: ${item.id}`);
      } else {
        throw new Error(ocrResult.error || "OCR processing failed");
      }
    } catch (error) {
      console.error(`OCR processing failed for ${item.id}:`, error.message);

      // 재시도 가능 여부 확인
      if (item.attempts < item.maxAttempts) {
        // 재시도를 위해 PENDING 상태로 되돌림
        item.status = "PENDING";
        this.queue.set(item.id, item);
        console.log(
          `Will retry ${item.id} (${item.maxAttempts - item.attempts} attempts remaining)`
        );
      } else {
        // 최대 재시도 횟수 초과
        item.status = "FAILED";
        item.error = error.message;
        item.processedAt = new Date();
        this.queue.set(item.id, item);

        // 영수증 스캔 상태 업데이트
        await this.receiptScanRepository.update(item.receiptScanId, {
          uploadStatus: UploadStatus.FAILED,
        });

        console.error(`OCR processing permanently failed: ${item.id}`);
      }
    }
  }

  // OCR 결과 데이터베이스 저장
  private async saveOcrResult(
    receiptScanId: string,
    ocrResult: OcrResult
  ): Promise<void> {
    const result = this.ocrResultRepository.create({
      receiptScanId,
      rawText: ocrResult.text || "",
      overallConfidence: ocrResult.confidence || 0,
      structuredData: {},
      extractedFields: {},
      totalAmount: ocrResult.metadata?.totalAmount || null,
      receiptDate: ocrResult.metadata?.date
        ? new Date(ocrResult.metadata.date)
        : null,
      vendorName: ocrResult.metadata?.merchantName || null,
    });

    await this.ocrResultRepository.save(result);
    console.log(`OCR result saved for receipt scan: ${receiptScanId}`);
  }

  // 큐 상태 조회
  getQueueStatus() {
    const items = Array.from(this.queue.values());

    return {
      total: items.length,
      pending: items.filter((i) => i.status === "PENDING").length,
      processing: items.filter((i) => i.status === "PROCESSING").length,
      completed: items.filter((i) => i.status === "COMPLETED").length,
      failed: items.filter((i) => i.status === "FAILED").length,
    };
  }

  // 특정 영수증의 큐 아이템 조회
  getQueueItemByReceiptScan(receiptScanId: string): QueueItem | null {
    const items = Array.from(this.queue.values()).filter(
      (item) => item.receiptScanId === receiptScanId
    );

    return items.length > 0 ? items[0] : null;
  }
}
