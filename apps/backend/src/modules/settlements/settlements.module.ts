import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SettlementsController } from "./settlements.controller";
import { SettlementsService } from "./settlements.service";
import { Settlement } from "../../entities/settlement.entity";
import { SettlementItem } from "../../entities/settlement-item.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Settlement, SettlementItem])],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
