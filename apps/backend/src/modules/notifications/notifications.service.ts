import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from "../../entities/notification.entity";
import { NotificationSetting } from "../../entities/notification-setting.entity";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationSettingDto } from "./dto/update-notification-setting.dto";

export interface NotificationFilterDto {
  userId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationSetting)
    private readonly settingRepository: Repository<NotificationSetting>
  ) {}

  // 알림 생성
  async create(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create(
      createNotificationDto
    );
    return this.notificationRepository.save(notification);
  }

  // 알림 목록 조회 (페이징)
  async findAll(filterDto: NotificationFilterDto) {
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.notificationRepository
      .createQueryBuilder("notification")
      .leftJoinAndSelect("notification.sender", "sender");

    // 필터링
    if (filterDto?.userId) {
      query.andWhere("notification.recipientId = :userId", {
        userId: filterDto.userId,
      });
    }

    if (filterDto?.type) {
      query.andWhere("notification.type = :type", { type: filterDto.type });
    }

    if (filterDto?.status) {
      query.andWhere("notification.status = :status", {
        status: filterDto.status,
      });
    }

    // 정렬: 최신순
    query.orderBy("notification.createdAt", "DESC");

    // 페이징
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 알림 상세 조회
  async findOne(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ["sender", "recipient"],
    });

    if (!notification) {
      throw new NotFoundException("알림을 찾을 수 없습니다.");
    }

    return notification;
  }

  // 알림 읽음 처리
  async markAsRead(id: string) {
    const notification = await this.findOne(id);
    notification.markAsRead();
    return this.notificationRepository.save(notification);
  }

  // 알림 읽지 않음 처리
  async markAsUnread(id: string) {
    const notification = await this.findOne(id);
    notification.markAsUnread();
    return this.notificationRepository.save(notification);
  }

  // 알림 보관
  async archive(id: string) {
    const notification = await this.findOne(id);
    notification.archive();
    return this.notificationRepository.save(notification);
  }

  // 알림 삭제 (소프트)
  async remove(id: string) {
    const notification = await this.findOne(id);
    await this.notificationRepository.softRemove(notification);
    return { message: "알림이 삭제되었습니다.", id };
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      {
        recipientId: userId,
        status: NotificationStatus.UNREAD,
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      }
    );

    return { message: "모든 알림을 읽음 처리했습니다." };
  }

  // 읽지 않은 알림 개수
  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: {
        recipientId: userId,
        status: NotificationStatus.UNREAD,
      },
    });

    return { count };
  }

  // 알림 설정 조회
  async getSettings(userId: string) {
    const settings = await this.settingRepository.find({
      where: { userId },
    });

    // 설정이 없으면 기본값 생성
    if (settings.length === 0) {
      return this.createDefaultSettings(userId);
    }

    return settings;
  }

  // 기본 알림 설정 생성
  private async createDefaultSettings(userId: string) {
    const defaultSettings = Object.values(NotificationType).map((type) => ({
      userId,
      notificationType: type,
      inAppEnabled: true,
      emailEnabled: false,
      pushEnabled: false,
    }));

    return this.settingRepository.save(defaultSettings);
  }

  // 알림 설정 업데이트
  async updateSetting(
    userId: string,
    updateDto: UpdateNotificationSettingDto
  ) {
    let setting = await this.settingRepository.findOne({
      where: {
        userId,
        notificationType: updateDto.notificationType,
      },
    });

    if (!setting) {
      // 설정이 없으면 생성
      setting = this.settingRepository.create({
        userId,
        ...updateDto,
      });
    } else {
      // 설정 업데이트
      Object.assign(setting, updateDto);
    }

    return this.settingRepository.save(setting);
  }

  // 알림 발송 가능 여부 확인
  async canSendNotification(
    userId: string,
    type: NotificationType,
    channel: "inApp" | "email" | "push"
  ): Promise<boolean> {
    const setting = await this.settingRepository.findOne({
      where: {
        userId,
        notificationType: type,
      },
    });

    if (!setting) {
      // 설정이 없으면 기본값 (인앱만 활성화)
      return channel === "inApp";
    }

    switch (channel) {
      case "inApp":
        return setting.inAppEnabled;
      case "email":
        return setting.emailEnabled;
      case "push":
        return setting.pushEnabled;
      default:
        return false;
    }
  }
}
