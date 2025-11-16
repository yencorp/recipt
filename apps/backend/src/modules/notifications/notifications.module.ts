import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationsGateway } from "./notifications.gateway";
import { Notification } from "../../entities/notification.entity";
import { NotificationSetting } from "../../entities/notification-setting.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationSetting])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
