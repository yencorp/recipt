import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SettlementItemsController } from "./settlement-items.controller";
import { SettlementItemsService } from "./settlement-items.service";
import { SettlementItem } from "../../entities/settlement-item.entity";
import { Settlement } from "../../entities/settlement.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SettlementItem, Settlement])],
  controllers: [SettlementItemsController],
  providers: [SettlementItemsService],
  exports: [SettlementItemsService],
})
export class SettlementItemsModule {}
