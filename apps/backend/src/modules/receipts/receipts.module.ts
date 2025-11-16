import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReceiptsController } from "./receipts.controller";
import { ReceiptsService } from "./receipts.service";
import { ReceiptUploadController } from "./receipt-upload.controller";
import { ThumbnailService } from "./services/thumbnail.service";
import { ReceiptScan } from "../../entities/receipt-scan.entity";
import { OcrModule } from "../ocr/ocr.module";

@Module({
  imports: [TypeOrmModule.forFeature([ReceiptScan]), OcrModule],
  controllers: [ReceiptsController, ReceiptUploadController],
  providers: [ReceiptsService, ThumbnailService],
  exports: [ReceiptsService, ThumbnailService],
})
export class ReceiptsModule {}
