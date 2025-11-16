import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { User } from "../../../entities/user.entity";
import { Organization } from "../../../entities/organization.entity";
import { Event } from "../../../entities/event.entity";
import { Budget } from "../../../entities/budget.entity";
import { Settlement } from "../../../entities/settlement.entity";

export interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxOrganizationsPerUser: number;
  sessionTimeout: number;
}

@Injectable()
export class AdminSystemService {
  private systemSettings: SystemSettings = {
    maintenanceMode: false,
    registrationEnabled: true,
    maxOrganizationsPerUser: 10,
    sessionTimeout: 3600,
  };

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>
  ) {}

  // 시스템 설정 조회
  async getSettings() {
    return this.systemSettings;
  }

  // 시스템 설정 업데이트
  async updateSettings(updates: Partial<SystemSettings>) {
    this.systemSettings = {
      ...this.systemSettings,
      ...updates,
    };

    console.log("System settings updated:", this.systemSettings);
    return this.systemSettings;
  }

  // 시스템 상태 조회
  async getSystemStatus() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      status: "healthy",
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      uptimeSeconds: uptime,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      settings: this.systemSettings,
      timestamp: new Date().toISOString(),
    };
  }

  // 데이터베이스 통계
  async getDatabaseStats() {
    const [
      userCount,
      orgCount,
      eventCount,
      budgetCount,
      settlementCount,
      recentUsers,
      recentOrgs,
    ] = await Promise.all([
      this.userRepository.count(),
      this.orgRepository.count(),
      this.eventRepository.count(),
      this.budgetRepository.count(),
      this.settlementRepository.count(),
      this.userRepository.count({
        where: {
          createdAt: MoreThan(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ),
        },
      }),
      this.orgRepository.count({
        where: {
          createdAt: MoreThan(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ),
        },
      }),
    ]);

    return {
      users: {
        total: userCount,
        recentWeek: recentUsers,
      },
      organizations: {
        total: orgCount,
        recentWeek: recentOrgs,
      },
      events: {
        total: eventCount,
      },
      budgets: {
        total: budgetCount,
      },
      settlements: {
        total: settlementCount,
      },
    };
  }

  // 백업 인터페이스 (실제 구현은 추후)
  async initiateBackup() {
    console.log("Backup initiated at", new Date().toISOString());

    return {
      message: "백업이 요청되었습니다. (실제 백업 서비스는 추후 구현)",
      timestamp: new Date().toISOString(),
      status: "pending",
    };
  }

  // 복원 인터페이스 (실제 구현은 추후)
  async initiateRestore(backupId: string) {
    console.log(`Restore requested for backup: ${backupId}`);

    return {
      message: "복원이 요청되었습니다. (실제 복원 서비스는 추후 구현)",
      backupId,
      timestamp: new Date().toISOString(),
      status: "pending",
    };
  }
}
