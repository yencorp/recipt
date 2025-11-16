import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { User } from "./user.entity";

export enum NotificationType {
  SYSTEM = "SYSTEM", // 시스템 공지
  EVENT = "EVENT", // 행사 관련
  BUDGET = "BUDGET", // 예산 관련
  SETTLEMENT = "SETTLEMENT", // 결산 관련
  COMMENT = "COMMENT", // 댓글
  APPROVAL = "APPROVAL", // 승인 요청
  REMINDER = "REMINDER", // 리마인더
}

export enum NotificationStatus {
  UNREAD = "UNREAD",
  READ = "READ",
  ARCHIVED = "ARCHIVED",
}

export enum NotificationPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: NotificationType })
  type: NotificationType;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({
    type: "enum",
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  // 수신자
  @Column({ type: "uuid" })
  recipientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "recipientId" })
  recipient: User;

  // 발신자 (선택)
  @Column({ type: "uuid", nullable: true })
  senderId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "senderId" })
  sender: User;

  // 관련 엔티티 (선택)
  @Column({ type: "varchar", length: 50, nullable: true })
  relatedEntityType: string; // 'event', 'budget', 'settlement' etc.

  @Column({ type: "uuid", nullable: true })
  relatedEntityId: string;

  // 액션 URL (선택)
  @Column({ type: "varchar", length: 500, nullable: true })
  actionUrl: string;

  // 읽음 처리 시간
  @Column({ type: "timestamp", nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // 비즈니스 메서드
  markAsRead(): void {
    if (this.status === NotificationStatus.UNREAD) {
      this.status = NotificationStatus.READ;
      this.readAt = new Date();
    }
  }

  markAsUnread(): void {
    if (this.status === NotificationStatus.READ) {
      this.status = NotificationStatus.UNREAD;
      this.readAt = null;
    }
  }

  archive(): void {
    this.status = NotificationStatus.ARCHIVED;
  }
}
