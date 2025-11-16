import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OcrJobsService } from "./ocr-jobs.service";
import { ReceiptScan } from "../../entities/receipt-scan.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ReceiptScan])],
  providers: [OcrJobsService],
  exports: [OcrJobsService],
})
export class OcrModule {}
