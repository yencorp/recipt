import { Injectable } from "@nestjs/common";
import { DataSource, SelectQueryBuilder } from "typeorm";
import {
  BaseRepository,
  PaginationOptions,
  PaginationResult,
} from "./base.repository";
import {
  Budget,
  BudgetStatus,
  BudgetType,
  ApprovalStatus,
} from "../entities/budget.entity";

/**
 * 예산 검색 옵션
 */
export interface BudgetSearchOptions {
  query?: string;
  organizationId?: string;
  eventId?: string;
  type?: BudgetType | BudgetType[];
  status?: BudgetStatus | BudgetStatus[];
  approvalStatus?: ApprovalStatus | ApprovalStatus[];
  budgetYear?: number;
  budgetPeriod?: number;
  createdBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  minAmount?: number;
  maxAmount?: number;
  isOverBudget?: boolean;
  isUnderBudget?: boolean;
  isFinal?: boolean;
  periodStartDate?: Date;
  periodEndDate?: Date;
  tags?: string[];
}

/**
 * 예산 통계 결과
 */
export interface BudgetStatistics {
  total: number;
  byStatus: Record<BudgetStatus, number>;
  byType: Record<BudgetType, number>;
  byApprovalStatus: Record<ApprovalStatus, number>;
  totalBudgetAmount: number;
  totalActualAmount: number;
  averageBudgetAmount: number;
  averageActualAmount: number;
  overBudgetCount: number;
  underBudgetCount: number;
  finalizedCount: number;
  pendingApprovalCount: number;
  averageExecutionRate: number;
  budgetVariance: number;
  recentBudgets: number; // 지난 30일 내 생성된 예산
}

/**
 * 예산 집행 추세
 */
export interface BudgetExecutionTrend {
  period: string;
  budgetAmount: number;
  actualAmount: number;
  executionRate: number;
  variance: number;
}

/**
 * 예산 승인 워크플로우 통계
 */
export interface ApprovalWorkflowStats {
  totalSubmissions: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  averageApprovalTime: number; // 시간 단위
  approvalRate: number; // 승인률
  rejectionReasons: Array<{
    reason: string;
    count: number;
  }>;
}

/**
 * 연간 예산 비교
 */
export interface YearlyBudgetComparison {
  year: number;
  totalBudget: number;
  totalActual: number;
  executionRate: number;
  eventCount: number;
  averagePerEvent: number;
}

/**
 * Budget Repository 클래스
 * 예산 엔티티에 특화된 복잡한 쿼리와 비즈니스 로직을 처리
 */
@Injectable()
export class BudgetRepository extends BaseRepository<Budget> {
  constructor(dataSource: DataSource) {
    super(dataSource, Budget);
  }

  /**
   * 조직의 예산 목록 조회
   * @param organizationId 조직 ID
   * @param paginationOptions 페이징 옵션
   * @returns 페이징된 예산 목록
   */
  async findByOrganization(
    organizationId: string,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<Budget>> {
    try {
      const queryBuilder = this.createQueryBuilder("budget")
        .leftJoinAndSelect("budget.organization", "org")
        .leftJoinAndSelect("budget.event", "event")
        .where("budget.organizationId = :organizationId", { organizationId })
        .orderBy("budget.createdAt", "DESC");

      return await this.executePagedQuery(queryBuilder, paginationOptions);
    } catch (error) {
      throw new Error(
        `Failed to find budgets by organization: ${error.message}`
      );
    }
  }

  /**
   * 행사별 예산 조회
   * @param eventId 행사 ID
   * @returns 행사의 예산 (있으면)
   */
  async findByEvent(eventId: string): Promise<Budget | null> {
    try {
      return await this.repository.findOne({
        where: { eventId },
        relations: ["organization", "event", "incomes", "expenses"],
      });
    } catch (error) {
      throw new Error(`Failed to find budget by event: ${error.message}`);
    }
  }

  /**
   * 고급 예산 검색
   * @param searchOptions 검색 옵션
   * @param paginationOptions 페이징 옵션
   * @returns 페이징된 검색 결과
   */
  async searchBudgets(
    searchOptions: BudgetSearchOptions,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<Budget>> {
    try {
      const queryBuilder = this.createQueryBuilder("budget")
        .leftJoinAndSelect("budget.organization", "org")
        .leftJoinAndSelect("budget.event", "event");

      // 텍스트 검색 (제목, 설명)
      if (searchOptions.query) {
        const searchTerm = `%${searchOptions.query}%`;
        queryBuilder.andWhere(
          "(budget.title ILIKE :searchTerm OR budget.description ILIKE :searchTerm)",
          { searchTerm }
        );
      }

      // 조직 필터
      if (searchOptions.organizationId) {
        queryBuilder.andWhere("budget.organizationId = :organizationId", {
          organizationId: searchOptions.organizationId,
        });
      }

      // 행사 필터
      if (searchOptions.eventId) {
        queryBuilder.andWhere("budget.eventId = :eventId", {
          eventId: searchOptions.eventId,
        });
      }

      // 유형 필터
      if (searchOptions.type) {
        if (Array.isArray(searchOptions.type)) {
          queryBuilder.andWhere("budget.type IN (:...types)", {
            types: searchOptions.type,
          });
        } else {
          queryBuilder.andWhere("budget.type = :type", {
            type: searchOptions.type,
          });
        }
      }

      // 상태 필터
      if (searchOptions.status) {
        if (Array.isArray(searchOptions.status)) {
          queryBuilder.andWhere("budget.status IN (:...statuses)", {
            statuses: searchOptions.status,
          });
        } else {
          queryBuilder.andWhere("budget.status = :status", {
            status: searchOptions.status,
          });
        }
      }

      // 승인 상태 필터
      if (searchOptions.approvalStatus) {
        if (Array.isArray(searchOptions.approvalStatus)) {
          queryBuilder.andWhere(
            "budget.approvalStatus IN (:...approvalStatuses)",
            {
              approvalStatuses: searchOptions.approvalStatus,
            }
          );
        } else {
          queryBuilder.andWhere("budget.approvalStatus = :approvalStatus", {
            approvalStatus: searchOptions.approvalStatus,
          });
        }
      }

      // 예산 연도 필터
      if (searchOptions.budgetYear) {
        queryBuilder.andWhere("budget.budgetYear = :budgetYear", {
          budgetYear: searchOptions.budgetYear,
        });
      }

      // 예산 기간 필터
      if (searchOptions.budgetPeriod) {
        queryBuilder.andWhere("budget.budgetPeriod = :budgetPeriod", {
          budgetPeriod: searchOptions.budgetPeriod,
        });
      }

      // 생성자 필터
      if (searchOptions.createdBy) {
        queryBuilder.andWhere("budget.createdBy = :createdBy", {
          createdBy: searchOptions.createdBy,
        });
      }

      // 검토자 필터
      if (searchOptions.reviewedBy) {
        queryBuilder.andWhere("budget.reviewedBy = :reviewedBy", {
          reviewedBy: searchOptions.reviewedBy,
        });
      }

      // 승인자 필터
      if (searchOptions.approvedBy) {
        queryBuilder.andWhere("budget.approvedBy = :approvedBy", {
          approvedBy: searchOptions.approvedBy,
        });
      }

      // 금액 범위 필터
      if (searchOptions.minAmount) {
        queryBuilder.andWhere("budget.totalIncomeAmount >= :minAmount", {
          minAmount: searchOptions.minAmount,
        });
      }

      if (searchOptions.maxAmount) {
        queryBuilder.andWhere("budget.totalIncomeAmount <= :maxAmount", {
          maxAmount: searchOptions.maxAmount,
        });
      }

      // 예산 집행 상태 필터
      if (searchOptions.isOverBudget === true) {
        queryBuilder.andWhere(
          "budget.totalActualExpense > budget.totalExpenseAmount"
        );
      } else if (searchOptions.isOverBudget === false) {
        queryBuilder.andWhere(
          "budget.totalActualExpense <= budget.totalExpenseAmount"
        );
      }

      if (searchOptions.isUnderBudget === true) {
        queryBuilder.andWhere(
          "budget.totalActualExpense < budget.totalExpenseAmount"
        );
      }

      // 최종 확정 여부 필터
      if (searchOptions.isFinal !== undefined) {
        queryBuilder.andWhere("budget.isFinal = :isFinal", {
          isFinal: searchOptions.isFinal,
        });
      }

      // 기간 범위 필터
      if (searchOptions.periodStartDate && searchOptions.periodEndDate) {
        queryBuilder.andWhere(
          "(budget.periodStartDate <= :periodEndDate AND budget.periodEndDate >= :periodStartDate)",
          {
            periodStartDate: searchOptions.periodStartDate,
            periodEndDate: searchOptions.periodEndDate,
          }
        );
      }

      // 태그 필터
      if (searchOptions.tags && searchOptions.tags.length > 0) {
        queryBuilder.andWhere("budget.metadata->'tags' ?| ARRAY[:...tags]", {
          tags: searchOptions.tags,
        });
      }

      queryBuilder.orderBy("budget.createdAt", "DESC");

      return await this.executePagedQuery(queryBuilder, paginationOptions);
    } catch (error) {
      throw new Error(`Failed to search budgets: ${error.message}`);
    }
  }

  /**
   * 예산 통계 조회
   * @param organizationId 조직 ID (선택사항)
   * @param year 연도 (선택사항)
   * @returns 예산 통계
   */
  async getBudgetStatistics(
    organizationId?: string,
    year?: number
  ): Promise<BudgetStatistics> {
    try {
      const queryBuilder = this.createQueryBuilder("budget");

      if (organizationId) {
        queryBuilder.where("budget.organizationId = :organizationId", {
          organizationId,
        });
      }

      if (year) {
        queryBuilder.andWhere("budget.budgetYear = :year", { year });
      }

      const budgets = await queryBuilder.getMany();

      const stats: BudgetStatistics = {
        total: budgets.length,
        byStatus: {
          [BudgetStatus.DRAFT]: 0,
          [BudgetStatus.SUBMITTED]: 0,
          [BudgetStatus.UNDER_REVIEW]: 0,
          [BudgetStatus.APPROVED]: 0,
          [BudgetStatus.REJECTED]: 0,
          [BudgetStatus.ACTIVE]: 0,
          [BudgetStatus.COMPLETED]: 0,
          [BudgetStatus.CANCELLED]: 0,
        },
        byType: {
          [BudgetType.ANNUAL]: 0,
          [BudgetType.EVENT]: 0,
          [BudgetType.PROJECT]: 0,
          [BudgetType.SPECIAL]: 0,
          [BudgetType.EMERGENCY]: 0,
          [BudgetType.MONTHLY]: 0,
          [BudgetType.QUARTERLY]: 0,
        },
        byApprovalStatus: {
          [ApprovalStatus.PENDING]: 0,
          [ApprovalStatus.APPROVED]: 0,
          [ApprovalStatus.REJECTED]: 0,
        },
        totalBudgetAmount: 0,
        totalActualAmount: 0,
        averageBudgetAmount: 0,
        averageActualAmount: 0,
        overBudgetCount: 0,
        underBudgetCount: 0,
        finalizedCount: 0,
        pendingApprovalCount: 0,
        averageExecutionRate: 0,
        budgetVariance: 0,
        recentBudgets: 0,
      };

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let totalExecutionRate = 0;
      let executionRateCount = 0;

      budgets.forEach((budget) => {
        // 상태별 집계
        stats.byStatus[budget.status]++;

        // 유형별 집계
        stats.byType[budget.type]++;

        // 승인 상태별 집계
        stats.byApprovalStatus[budget.approvalStatus]++;

        // 금액 집계
        stats.totalBudgetAmount += budget.totalIncomeAmount;
        stats.totalActualAmount += budget.totalActualIncome;

        // 예산 초과/미달 집계
        if (budget.isOverBudget) stats.overBudgetCount++;
        if (budget.isUnderBudget) stats.underBudgetCount++;

        // 최종 확정 집계
        if (budget.isFinal) stats.finalizedCount++;

        // 승인 대기 집계
        if (budget.approvalStatus === ApprovalStatus.PENDING) {
          stats.pendingApprovalCount++;
        }

        // 집행률 집계
        if (budget.executionRate !== null) {
          totalExecutionRate += budget.executionRate;
          executionRateCount++;
        }

        // 최근 예산 집계
        if (budget.createdAt > thirtyDaysAgo) {
          stats.recentBudgets++;
        }
      });

      // 평균값 계산
      stats.averageBudgetAmount =
        stats.total > 0
          ? Math.round((stats.totalBudgetAmount / stats.total) * 100) / 100
          : 0;

      stats.averageActualAmount =
        stats.total > 0
          ? Math.round((stats.totalActualAmount / stats.total) * 100) / 100
          : 0;

      stats.averageExecutionRate =
        executionRateCount > 0
          ? Math.round((totalExecutionRate / executionRateCount) * 100) / 100
          : 0;

      stats.budgetVariance = stats.totalActualAmount - stats.totalBudgetAmount;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get budget statistics: ${error.message}`);
    }
  }

  /**
   * 예산 집행 추세 조회
   * @param organizationId 조직 ID
   * @param months 조회할 개월 수 (기본: 12개월)
   * @returns 월별 집행 추세
   */
  async getBudgetExecutionTrend(
    organizationId: string,
    months = 12
  ): Promise<BudgetExecutionTrend[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const queryBuilder = this.createQueryBuilder("budget")
        .select([
          "DATE_TRUNC('month', budget.periodStartDate) as period",
          "SUM(budget.totalIncomeAmount) as budgetAmount",
          "SUM(budget.totalActualIncome) as actualAmount",
          "AVG(budget.executionRate) as avgExecutionRate",
        ])
        .where("budget.organizationId = :organizationId", { organizationId })
        .andWhere("budget.periodStartDate >= :startDate", { startDate })
        .andWhere("budget.status NOT IN (:...excludeStatuses)", {
          excludeStatuses: [BudgetStatus.DRAFT, BudgetStatus.CANCELLED],
        })
        .groupBy("DATE_TRUNC('month', budget.periodStartDate)")
        .orderBy("period", "ASC");

      const results = await queryBuilder.getRawMany();

      return results.map((result) => ({
        period: result.period,
        budgetAmount: parseFloat(result.budgetAmount) || 0,
        actualAmount: parseFloat(result.actualAmount) || 0,
        executionRate: parseFloat(result.avgExecutionRate) || 0,
        variance:
          (parseFloat(result.actualAmount) || 0) -
          (parseFloat(result.budgetAmount) || 0),
      }));
    } catch (error) {
      throw new Error(`Failed to get budget execution trend: ${error.message}`);
    }
  }

  /**
   * 승인 워크플로우 통계 조회
   * @param organizationId 조직 ID
   * @param days 조회할 일수 (기본: 90일)
   * @returns 승인 워크플로우 통계
   */
  async getApprovalWorkflowStats(
    organizationId: string,
    days = 90
  ): Promise<ApprovalWorkflowStats> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const queryBuilder = this.createQueryBuilder("budget")
        .where("budget.organizationId = :organizationId", { organizationId })
        .andWhere("budget.submittedAt >= :startDate", { startDate });

      const budgets = await queryBuilder.getMany();

      const stats: ApprovalWorkflowStats = {
        totalSubmissions: budgets.length,
        pendingReview: 0,
        approved: 0,
        rejected: 0,
        averageApprovalTime: 0,
        approvalRate: 0,
        rejectionReasons: [],
      };

      let totalApprovalTime = 0;
      let approvalTimeCount = 0;
      const rejectionReasonCount: Map<string, number> = new Map();

      budgets.forEach((budget) => {
        switch (budget.approvalStatus) {
          case ApprovalStatus.PENDING:
            stats.pendingReview++;
            break;
          case ApprovalStatus.APPROVED:
            stats.approved++;
            break;
          case ApprovalStatus.REJECTED:
            stats.rejected++;
            // 거부 사유 집계
            if (budget.approvalNotes) {
              const currentCount =
                rejectionReasonCount.get(budget.approvalNotes) || 0;
              rejectionReasonCount.set(budget.approvalNotes, currentCount + 1);
            }
            break;
        }

        // 승인 시간 계산
        if (budget.submittedAt && budget.approvedAt) {
          const approvalTime =
            budget.approvedAt.getTime() - budget.submittedAt.getTime();
          totalApprovalTime += approvalTime / (1000 * 60 * 60); // 시간 단위로 변환
          approvalTimeCount++;
        }
      });

      // 평균 승인 시간 계산
      stats.averageApprovalTime =
        approvalTimeCount > 0
          ? Math.round((totalApprovalTime / approvalTimeCount) * 100) / 100
          : 0;

      // 승인률 계산
      const processedBudgets = stats.approved + stats.rejected;
      stats.approvalRate =
        processedBudgets > 0
          ? Math.round((stats.approved / processedBudgets) * 10000) / 100
          : 0;

      // 거부 사유 정리
      stats.rejectionReasons = Array.from(rejectionReasonCount.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      return stats;
    } catch (error) {
      throw new Error(
        `Failed to get approval workflow stats: ${error.message}`
      );
    }
  }

  /**
   * 연간 예산 비교 조회
   * @param organizationId 조직 ID
   * @param years 비교할 연도 수 (기본: 3년)
   * @returns 연도별 예산 비교
   */
  async getYearlyBudgetComparison(
    organizationId: string,
    years = 3
  ): Promise<YearlyBudgetComparison[]> {
    try {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years + 1;

      const queryBuilder = this.createQueryBuilder("budget")
        .select([
          "budget.budgetYear as year",
          "SUM(budget.totalIncomeAmount) as totalBudget",
          "SUM(budget.totalActualIncome) as totalActual",
          "AVG(budget.executionRate) as avgExecutionRate",
          "COUNT(*) as eventCount",
        ])
        .where("budget.organizationId = :organizationId", { organizationId })
        .andWhere("budget.budgetYear >= :startYear", { startYear })
        .andWhere("budget.status NOT IN (:...excludeStatuses)", {
          excludeStatuses: [BudgetStatus.DRAFT, BudgetStatus.CANCELLED],
        })
        .groupBy("budget.budgetYear")
        .orderBy("budget.budgetYear", "ASC");

      const results = await queryBuilder.getRawMany();

      return results.map((result) => ({
        year: parseInt(result.year),
        totalBudget: parseFloat(result.totalBudget) || 0,
        totalActual: parseFloat(result.totalActual) || 0,
        executionRate: parseFloat(result.avgExecutionRate) || 0,
        eventCount: parseInt(result.eventCount) || 0,
        averagePerEvent:
          parseInt(result.eventCount) > 0
            ? Math.round(
                ((parseFloat(result.totalBudget) || 0) /
                  parseInt(result.eventCount)) *
                  100
              ) / 100
            : 0,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get yearly budget comparison: ${error.message}`
      );
    }
  }

  /**
   * 승인 대기 중인 예산 조회
   * @param organizationId 조직 ID (선택사항)
   * @returns 승인 대기 중인 예산 목록
   */
  async findPendingApproval(organizationId?: string): Promise<Budget[]> {
    try {
      const queryBuilder = this.createQueryBuilder("budget")
        .leftJoinAndSelect("budget.organization", "org")
        .leftJoinAndSelect("budget.event", "event")
        .where("budget.approvalStatus = :approvalStatus", {
          approvalStatus: ApprovalStatus.PENDING,
        })
        .andWhere("budget.status = :status", {
          status: BudgetStatus.UNDER_REVIEW,
        });

      if (organizationId) {
        queryBuilder.andWhere("budget.organizationId = :organizationId", {
          organizationId,
        });
      }

      return await queryBuilder
        .orderBy("budget.submittedAt", "ASC") // 먼저 제출된 것부터
        .getMany();
    } catch (error) {
      throw new Error(
        `Failed to find pending approval budgets: ${error.message}`
      );
    }
  }

  /**
   * 예산 초과 예상 예산 조회
   * @param threshold 임계값 퍼센트 (기본: 80%)
   * @param organizationId 조직 ID (선택사항)
   * @returns 예산 초과 위험 예산 목록
   */
  async findAtRiskBudgets(
    threshold = 80,
    organizationId?: string
  ): Promise<Budget[]> {
    try {
      const queryBuilder = this.createQueryBuilder("budget")
        .leftJoinAndSelect("budget.organization", "org")
        .leftJoinAndSelect("budget.event", "event")
        .where("budget.status = :status", { status: BudgetStatus.ACTIVE })
        .andWhere("budget.executionRate >= :threshold", { threshold });

      if (organizationId) {
        queryBuilder.andWhere("budget.organizationId = :organizationId", {
          organizationId,
        });
      }

      return await queryBuilder
        .orderBy("budget.executionRate", "DESC")
        .getMany();
    } catch (error) {
      throw new Error(`Failed to find at-risk budgets: ${error.message}`);
    }
  }

  /**
   * 페이징 쿼리 실행 헬퍼 메서드
   * @param queryBuilder QueryBuilder
   * @param paginationOptions 페이징 옵션
   * @returns 페이징 결과
   */
  private async executePagedQuery(
    queryBuilder: SelectQueryBuilder<Budget>,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<Budget>> {
    const { page = 1, limit = 20 } = paginationOptions || {};
    const skip = (page - 1) * limit;

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
