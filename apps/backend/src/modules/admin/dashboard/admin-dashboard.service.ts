import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { User, UserStatus } from "../../../entities/user.entity";
import {
  Organization,
  OrganizationStatus,
} from "../../../entities/organization.entity";
import { Event, EventStatus } from "../../../entities/event.entity";
import { Budget } from "../../../entities/budget.entity";
import { Settlement } from "../../../entities/settlement.entity";
import { Notification } from "../../../entities/notification.entity";

@Injectable()
export class AdminDashboardService {
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
    private readonly settlementRepository: Repository<Settlement>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>
  ) {}

  // 대시보드 개요
  async getOverview() {
    const [
      totalUsers,
      activeUsers,
      totalOrgs,
      activeOrgs,
      totalEvents,
      upcomingEvents,
      totalBudgets,
      totalSettlements,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.orgRepository.count(),
      this.orgRepository.count({
        where: { status: OrganizationStatus.ACTIVE },
      }),
      this.eventRepository.count(),
      this.eventRepository.count({
        where: {
          status: EventStatus.UPCOMING,
          startDate: MoreThan(new Date()),
        },
      }),
      this.budgetRepository.count(),
      this.settlementRepository.count(),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        growthRate: 0, // TODO: 이전 기간 대비 증가율 계산
      },
      organizations: {
        total: totalOrgs,
        active: activeOrgs,
        growthRate: 0,
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
      },
      finance: {
        totalBudgets,
        totalSettlements,
        completionRate:
          totalBudgets > 0
            ? Math.round((totalSettlements / totalBudgets) * 100)
            : 0,
      },
    };
  }

  // 최근 활동
  async getRecentActivities(limit = 20) {
    const [recentUsers, recentOrgs, recentEvents] = await Promise.all([
      this.userRepository.find({
        order: { createdAt: "DESC" },
        take: limit,
        select: ["id", "name", "email", "createdAt"],
      }),
      this.orgRepository.find({
        order: { createdAt: "DESC" },
        take: limit,
        select: ["id", "name", "type", "createdAt"],
      }),
      this.eventRepository.find({
        order: { createdAt: "DESC" },
        take: limit,
        select: ["id", "title", "status", "startDate", "createdAt"],
        relations: ["organization"],
      }),
    ]);

    return {
      recentUsers,
      recentOrganizations: recentOrgs,
      recentEvents,
    };
  }

  // 사용 통계 (기간별)
  async getUsageStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [newUsers, newOrgs, newEvents] = await Promise.all([
      this.userRepository.count({
        where: { createdAt: MoreThan(startDate) },
      }),
      this.orgRepository.count({
        where: { createdAt: MoreThan(startDate) },
      }),
      this.eventRepository.count({
        where: { createdAt: MoreThan(startDate) },
      }),
    ]);

    return {
      period: `Last ${days} days`,
      newUsers,
      newOrganizations: newOrgs,
      newEvents,
      averagePerDay: {
        users: Math.round((newUsers / days) * 10) / 10,
        organizations: Math.round((newOrgs / days) * 10) / 10,
        events: Math.round((newEvents / days) * 10) / 10,
      },
    };
  }

  // 재무 통계
  async getFinanceStats() {
    const budgets = await this.budgetRepository.find({
      select: ["id", "totalIncomeAmount", "totalExpenseAmount"],
    });

    const settlements = await this.settlementRepository.find({
      select: ["id", "totalIncomeAmount", "totalExpenseAmount", "netAmount"],
    });

    const totalBudgetIncome = budgets.reduce(
      (sum, b) => sum + Number(b.totalIncomeAmount || 0),
      0
    );
    const totalBudgetExpense = budgets.reduce(
      (sum, b) => sum + Number(b.totalExpenseAmount || 0),
      0
    );

    const totalActualIncome = settlements.reduce(
      (sum, s) => sum + Number(s.totalIncomeAmount || 0),
      0
    );
    const totalActualExpense = settlements.reduce(
      (sum, s) => sum + Number(s.totalExpenseAmount || 0),
      0
    );
    const totalNetAmount = settlements.reduce(
      (sum, s) => sum + Number(s.netAmount || 0),
      0
    );

    return {
      budget: {
        totalIncome: totalBudgetIncome,
        totalExpense: totalBudgetExpense,
        netBudget: totalBudgetIncome - totalBudgetExpense,
        count: budgets.length,
      },
      actual: {
        totalIncome: totalActualIncome,
        totalExpense: totalActualExpense,
        netAmount: totalNetAmount,
        count: settlements.length,
      },
      variance: {
        income: totalActualIncome - totalBudgetIncome,
        expense: totalActualExpense - totalBudgetExpense,
        incomePercent:
          totalBudgetIncome > 0
            ? Math.round(
                ((totalActualIncome - totalBudgetIncome) /
                  totalBudgetIncome) *
                  100 *
                  10
              ) / 10
            : 0,
        expensePercent:
          totalBudgetExpense > 0
            ? Math.round(
                ((totalActualExpense - totalBudgetExpense) /
                  totalBudgetExpense) *
                  100 *
                  10
              ) / 10
            : 0,
      },
    };
  }

  // 알림 통계
  async getNotificationStats() {
    const total = await this.notificationRepository.count();
    const unread = await this.notificationRepository.count({
      where: { status: "UNREAD" },
    });
    const read = await this.notificationRepository.count({
      where: { status: "READ" },
    });

    return {
      total,
      unread,
      read,
      readRate: total > 0 ? Math.round((read / total) * 100) : 0,
    };
  }
}
