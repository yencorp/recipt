import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SettlementsController } from "./settlements.controller";
import { SettlementsService } from "./settlements.service";
import { Settlement } from "../../entities/settlement.entity";
import { SettlementItem } from "../../entities/settlement-item.entity";
import { Budget } from "../../entities/budget.entity";
import { Event } from "../../entities/event.entity";
import { EventCreatorOrOrgAdminGuard } from "../../common/guards/event-creator-or-org-admin.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement, SettlementItem, Budget, Event]),
  ],
  controllers: [SettlementsController],
  providers: [SettlementsService, EventCreatorOrOrgAdminGuard],
  exports: [SettlementsService],
})
export class SettlementsModule {}
