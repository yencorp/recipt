import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import {
  NotificationType,
  NotificationPriority,
} from "../../../entities/notification.entity";

export class CreateNotificationDto {
  @ApiProperty({
    description: "알림 타입",
    enum: NotificationType,
    example: NotificationType.EVENT,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: "알림 제목",
    example: "새로운 행사가 등록되었습니다",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: "알림 메시지",
    example: "2025년 봄 정기총회가 등록되었습니다. 확인해주세요.",
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: "우선순위",
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
    required: false,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({
    description: "수신자 ID",
    example: "user-uuid",
  })
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({
    description: "발신자 ID (선택)",
    example: "admin-uuid",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  senderId?: string;

  @ApiProperty({
    description: "관련 엔티티 타입 (선택)",
    example: "event",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  relatedEntityType?: string;

  @ApiProperty({
    description: "관련 엔티티 ID (선택)",
    example: "entity-uuid",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  relatedEntityId?: string;

  @ApiProperty({
    description: "액션 URL (선택)",
    example: "/events/detail/event-uuid",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  actionUrl?: string;
}
