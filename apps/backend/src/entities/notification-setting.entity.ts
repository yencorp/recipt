import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { NotificationType } from "./notification.entity";

@Entity("notification_settings")
export class NotificationSetting {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "enum", enum: NotificationType })
  notificationType: NotificationType;

  // 알림 채널 활성화
  @Column({ type: "boolean", default: true })
  inAppEnabled: boolean;

  @Column({ type: "boolean", default: false })
  emailEnabled: boolean;

  @Column({ type: "boolean", default: false })
  pushEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
