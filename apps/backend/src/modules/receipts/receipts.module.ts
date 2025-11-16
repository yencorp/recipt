import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReceiptsController } from "./receipts.controller";
import { ReceiptsService } from "./receipts.service";
import { ReceiptScan } from "../../entities/receipt-scan.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ReceiptScan])],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
