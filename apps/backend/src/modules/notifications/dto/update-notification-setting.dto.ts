import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty } from "class-validator";
import { NotificationType } from "../../../entities/notification.entity";

export class UpdateNotificationSettingDto {
  @ApiProperty({
    description: "알림 타입",
    enum: NotificationType,
    example: NotificationType.EVENT,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  notificationType: NotificationType;

  @ApiProperty({
    description: "인앱 알림 활성화",
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  inAppEnabled: boolean;

  @ApiProperty({
    description: "이메일 알림 활성화",
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  emailEnabled: boolean;

  @ApiProperty({
    description: "푸시 알림 활성화",
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  pushEnabled: boolean;
}
