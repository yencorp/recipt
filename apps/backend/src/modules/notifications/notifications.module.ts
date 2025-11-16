import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
// TODO: Enable when @nestjs/websockets and nodemailer are installed
// import { NotificationsGateway } from "./notifications.gateway";
// import { EmailService } from "./email/email.service";
import { Notification } from "../../entities/notification.entity";
import { NotificationSetting } from "../../entities/notification-setting.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationSetting])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
