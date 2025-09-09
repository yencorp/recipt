import { Injectable } from "@nestjs/common";
import { DataSource, FindOptionsWhere, SelectQueryBuilder } from "typeorm";
import {
  BaseRepository,
  PaginationOptions,
  PaginationResult,
} from "./base.repository";
import { User, UserStatus, UserRole } from "../entities/user.entity";

/**
 * 사용자 검색 옵션
 */
export interface UserSearchOptions {
  query?: string;
  status?: UserStatus;
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
  hasRecentLogin?: boolean;
  isEmailVerified?: boolean;
  isLocked?: boolean;
}

/**
 * 사용자 통계 결과
 */
export interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  emailVerified: number;
  recentLogins: number; // 지난 30일 내 로그인
  lockedAccounts: number;
  roleDistribution: Record<UserRole, number>;
}

/**
 * 로그인 통계
 */
export interface LoginStatistics {
  totalLogins: number;
  uniqueUsers: number;
  averageLoginsPerUser: number;
  recentLoginTrend: Array<{
    date: string;
    logins: number;
    uniqueUsers: number;
  }>;
}

/**
 * User Repository 클래스
 * 사용자 엔티티에 특화된 복잡한 쿼리와 비즈니스 로직을 처리
 */
@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(dataSource: DataSource) {
    super(dataSource, User);
  }

  /**
   * 이메일로 사용자 조회 (로그인용)
   * @param email 이메일 주소
   * @returns 사용자 또는 null
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.repository.findOne({
        where: { email: email.toLowerCase().trim() },
      });
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * 활성 사용자 조회 (로그인 가능한 사용자)
   * @param email 이메일 주소
   * @returns 활성 사용자 또는 null
   */
  async findActiveUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.repository.findOne({
        where: {
          email: email.toLowerCase().trim(),
          isActive: true,
        },
      });

      // 추가 로그인 가능 여부 검증
      if (user && !user.canLogin) {
        return null;
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to find active user by email: ${error.message}`);
    }
  }

  /**
   * 이메일 중복 체크
   * @param email 이메일 주소
   * @param excludeUserId 제외할 사용자 ID (업데이트 시)
   * @returns 중복 여부
   */
  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const where: FindOptionsWhere<User> = {
        email: email.toLowerCase().trim(),
      };

      if (excludeUserId) {
        where.id = { $ne: excludeUserId } as unknown as any;
      }

      return await this.exists(where);
    } catch (error) {
      throw new Error(`Failed to check email availability: ${error.message}`);
    }
  }

  /**
   * 조직의 사용자 목록 조회
   * @param organizationId 조직 ID
   * @param paginationOptions 페이징 옵션
   * @returns 페이징된 사용자 목록
   */
  async findByOrganization(
    organizationId: string,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<User>> {
    try {
      const queryBuilder = this.createQueryBuilder("user")
        .innerJoin("user.userOrganizations", "userOrg")
        .where("userOrg.organizationId = :organizationId", { organizationId })
        .andWhere("userOrg.isActive = :isActive", { isActive: true })
        .orderBy("user.name", "ASC");

      const { page = 1, limit = 20 } = paginationOptions || {};
      const skip = (page - 1) * limit;

      const [users, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      throw new Error(`Failed to find users by organization: ${error.message}`);
    }
  }

  /**
   * 고급 사용자 검색
   * @param searchOptions 검색 옵션
   * @param paginationOptions 페이징 옵션
   * @returns 페이징된 검색 결과
   */
  async searchUsers(
    searchOptions: UserSearchOptions,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<User>> {
    try {
      const queryBuilder = this.createQueryBuilder("user");

      // 텍스트 검색 (이름, 이메일)
      if (searchOptions.query) {
        const searchTerm = `%${searchOptions.query}%`;
        queryBuilder.andWhere(
          "(user.name ILIKE :searchTerm OR user.email ILIKE :searchTerm)",
          { searchTerm }
        );
      }

      // 상태 필터
      if (searchOptions.status) {
        queryBuilder.andWhere("user.status = :status", {
          status: searchOptions.status,
        });
      }

      // 역할 필터
      if (searchOptions.role) {
        queryBuilder.andWhere("user.role = :role", {
          role: searchOptions.role,
        });
      }

      // 활성 상태 필터
      if (searchOptions.isActive !== undefined) {
        queryBuilder.andWhere("user.isActive = :isActive", {
          isActive: searchOptions.isActive,
        });
      }

      // 이메일 인증 필터
      if (searchOptions.isEmailVerified !== undefined) {
        if (searchOptions.isEmailVerified) {
          queryBuilder.andWhere("user.emailVerifiedAt IS NOT NULL");
        } else {
          queryBuilder.andWhere("user.emailVerifiedAt IS NULL");
        }
      }

      // 계정 잠금 상태 필터
      if (searchOptions.isLocked !== undefined) {
        if (searchOptions.isLocked) {
          queryBuilder.andWhere("user.lockedUntil IS NOT NULL");
          queryBuilder.andWhere("user.lockedUntil > NOW()");
        } else {
          queryBuilder.andWhere(
            "(user.lockedUntil IS NULL OR user.lockedUntil <= NOW())"
          );
        }
      }

      // 최근 로그인 필터 (지난 30일)
      if (searchOptions.hasRecentLogin !== undefined) {
        if (searchOptions.hasRecentLogin) {
          queryBuilder.andWhere(
            "user.lastLoginAt > NOW() - INTERVAL '30 days'"
          );
        } else {
          queryBuilder.andWhere(
            "(user.lastLoginAt IS NULL OR user.lastLoginAt <= NOW() - INTERVAL '30 days')"
          );
        }
      }

      // 조직 필터
      if (searchOptions.organizationId) {
        queryBuilder
          .innerJoin("user.userOrganizations", "userOrg")
          .andWhere("userOrg.organizationId = :organizationId", {
            organizationId: searchOptions.organizationId,
          })
          .andWhere("userOrg.isActive = :isActive", { isActive: true });
      }

      queryBuilder.orderBy("user.createdAt", "DESC");

      return await this.executePagedQuery(queryBuilder, paginationOptions);
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  /**
   * 사용자 통계 조회
   * @param organizationId 조직 ID (선택사항)
   * @returns 사용자 통계
   */
  async getUserStatistics(organizationId?: string): Promise<UserStatistics> {
    try {
      const queryBuilder = this.createQueryBuilder("user");

      if (organizationId) {
        queryBuilder
          .innerJoin("user.userOrganizations", "userOrg")
          .where("userOrg.organizationId = :organizationId", { organizationId })
          .andWhere("userOrg.isActive = :isActive", { isActive: true });
      }

      const users = await queryBuilder.getMany();

      const stats: UserStatistics = {
        total: users.length,
        active: 0,
        inactive: 0,
        pending: 0,
        suspended: 0,
        emailVerified: 0,
        recentLogins: 0,
        lockedAccounts: 0,
        roleDistribution: {
          [UserRole.SUPER_ADMIN]: 0,
          [UserRole.ORGANIZATION_ADMIN]: 0,
          [UserRole.TREASURER]: 0,
          [UserRole.ACCOUNTANT]: 0,
          [UserRole.MEMBER]: 0,
          [UserRole.GUEST]: 0,
        },
      };

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      users.forEach((user) => {
        // 상태별 집계
        switch (user.status) {
          case UserStatus.ACTIVE:
            stats.active++;
            break;
          case UserStatus.INACTIVE:
            stats.inactive++;
            break;
          case UserStatus.PENDING_VERIFICATION:
            stats.pending++;
            break;
          case UserStatus.SUSPENDED:
            stats.suspended++;
            break;
        }

        // 역할별 집계
        stats.roleDistribution[user.role]++;

        // 이메일 인증 여부
        if (user.isEmailVerified) {
          stats.emailVerified++;
        }

        // 최근 로그인 여부
        if (user.lastLoginAt && user.lastLoginAt > thirtyDaysAgo) {
          stats.recentLogins++;
        }

        // 잠금 계정 여부
        if (user.isLocked) {
          stats.lockedAccounts++;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }

  /**
   * 로그인 통계 조회
   * @param days 조회할 일수 (기본: 30일)
   * @param organizationId 조직 ID (선택사항)
   * @returns 로그인 통계
   */
  async getLoginStatistics(
    days = 30,
    organizationId?: string
  ): Promise<LoginStatistics> {
    try {
      const queryBuilder = this.createQueryBuilder("user")
        .select([
          "DATE(user.lastLoginAt) as loginDate",
          "COUNT(*) as loginCount",
        ])
        .where("user.lastLoginAt > NOW() - INTERVAL :days DAY", { days })
        .andWhere("user.lastLoginAt IS NOT NULL")
        .groupBy("DATE(user.lastLoginAt)")
        .orderBy("loginDate", "ASC");

      if (organizationId) {
        queryBuilder
          .innerJoin("user.userOrganizations", "userOrg")
          .andWhere("userOrg.organizationId = :organizationId", {
            organizationId,
          })
          .andWhere("userOrg.isActive = :isActive", { isActive: true });
      }

      const dailyStats = await queryBuilder.getRawMany();

      // 전체 통계 계산은 별도 쿼리로 처리
      const totalUsersQueryBuilder = this.createQueryBuilder("user");
      if (organizationId) {
        totalUsersQueryBuilder
          .innerJoin("user.userOrganizations", "userOrg")
          .where("userOrg.organizationId = :organizationId", { organizationId })
          .andWhere("userOrg.isActive = :isActive", { isActive: true });
      }
      await totalUsersQueryBuilder.getCount();

      const recentDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const recentUsersQueryBuilder = this.createQueryBuilder("user").where(
        "user.lastLoginAt >= :recentDate",
        { recentDate }
      );
      if (organizationId) {
        recentUsersQueryBuilder
          .innerJoin("user.userOrganizations", "userOrg")
          .andWhere("userOrg.organizationId = :organizationId", {
            organizationId,
          })
          .andWhere("userOrg.isActive = :isActive", { isActive: true });
      }
      const recentLoginUsers = await recentUsersQueryBuilder.getCount();

      return {
        totalLogins: dailyStats.reduce(
          (sum, stat) => sum + parseInt(stat.loginCount),
          0
        ),
        uniqueUsers: recentLoginUsers,
        averageLoginsPerUser:
          recentLoginUsers > 0
            ? dailyStats.reduce(
                (sum, stat) => sum + parseInt(stat.loginCount),
                0
              ) / recentLoginUsers
            : 0,
        recentLoginTrend: dailyStats.map((stat) => ({
          date: stat.loginDate,
          logins: parseInt(stat.loginCount),
          uniqueUsers: parseInt(stat.loginCount), // 일일 고유 사용자 수는 별도 쿼리 필요
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get login statistics: ${error.message}`);
    }
  }

  /**
   * 실패한 로그인 시도가 많은 사용자 조회
   * @param threshold 임계값 (기본: 3)
   * @param hours 시간 범위 (기본: 24시간)
   * @returns 위험 사용자 목록
   */
  async findUsersWithFailedLogins(threshold = 3): Promise<User[]> {
    try {
      return await this.createQueryBuilder("user")
        .where("user.failedLoginAttempts >= :threshold", { threshold })
        .orderBy("user.failedLoginAttempts", "DESC")
        .addOrderBy("user.updatedAt", "DESC")
        .getMany();
    } catch (error) {
      throw new Error(
        `Failed to find users with failed logins: ${error.message}`
      );
    }
  }

  /**
   * 이메일 인증 토큰으로 사용자 조회
   * @param token 인증 토큰
   * @returns 사용자 또는 null
   */
  async findByEmailVerificationToken(token: string): Promise<User | null> {
    try {
      return await this.repository.findOne({
        where: { emailVerificationToken: token },
      });
    } catch (error) {
      throw new Error(
        `Failed to find user by verification token: ${error.message}`
      );
    }
  }

  /**
   * 비밀번호 재설정 토큰으로 사용자 조회
   * @param token 재설정 토큰
   * @returns 사용자 또는 null (유효한 토큰인 경우만)
   */
  async findByPasswordResetToken(token: string): Promise<User | null> {
    try {
      return await this.createQueryBuilder("user")
        .where("user.passwordResetToken = :token", { token })
        .andWhere("user.passwordResetTokenExpiresAt > :now", {
          now: new Date(),
        })
        .getOne();
    } catch (error) {
      throw new Error(
        `Failed to find user by password reset token: ${error.message}`
      );
    }
  }

  /**
   * 사용자 로그인 성공 처리
   * @param userId 사용자 ID
   * @param ip IP 주소
   * @returns 업데이트된 사용자
   */
  async recordSuccessfulLogin(
    userId: string,
    ip?: string
  ): Promise<User | null> {
    try {
      const user = await this.findById(userId);
      if (!user) return null;

      user.updateLastLogin(ip);
      return await this.repository.save(user);
    } catch (error) {
      throw new Error(`Failed to record successful login: ${error.message}`);
    }
  }

  /**
   * 사용자 로그인 실패 처리
   * @param userId 사용자 ID
   * @returns 업데이트된 사용자
   */
  async recordFailedLogin(userId: string): Promise<User | null> {
    try {
      const user = await this.findById(userId);
      if (!user) return null;

      user.incrementFailedLoginAttempts();
      return await this.repository.save(user);
    } catch (error) {
      throw new Error(`Failed to record failed login: ${error.message}`);
    }
  }

  /**
   * 만료된 토큰 정리 (정기 작업용)
   * @returns 정리된 사용자 수
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.createQueryBuilder("user")
        .update()
        .set({
          passwordResetToken: null,
          passwordResetTokenExpiresAt: null,
        })
        .where("passwordResetTokenExpiresAt < :now", { now: new Date() })
        .execute();

      return result.affected || 0;
    } catch (error) {
      throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
    }
  }

  /**
   * 페이징 쿼리 실행 헬퍼 메서드
   * @param queryBuilder QueryBuilder
   * @param paginationOptions 페이징 옵션
   * @returns 페이징 결과
   */
  private async executePagedQuery(
    queryBuilder: SelectQueryBuilder<User>,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<User>> {
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
