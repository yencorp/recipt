import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OcrJobsService } from "./ocr-jobs.service";
import { OcrClientService } from "./ocr-client.service";
import { OcrQueueService } from "./ocr-queue.service";
import { ReceiptScan } from "../../entities/receipt-scan.entity";
import { OcrResult } from "../../entities/ocr-result.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReceiptScan, OcrResult]),
  ],
  providers: [OcrJobsService, OcrClientService, OcrQueueService],
  exports: [OcrJobsService, OcrClientService, OcrQueueService],
})
export class OcrModule {}
