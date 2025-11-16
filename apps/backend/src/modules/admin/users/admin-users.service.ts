import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { User, UserRole, UserStatus } from "../../../entities/user.entity";
import {
  UserOrganization,
  OrganizationRole,
} from "../../../entities/user-organization.entity";
import { AdminUpdateUserDto } from "./dto/admin-update-user.dto";
import { AssignOrganizationDto } from "./dto/assign-organization.dto";

export interface AdminUserFilterDto {
  search?: string; // 이름 또는 이메일 검색
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserOrganization)
    private readonly userOrgRepository: Repository<UserOrganization>
  ) {}

  // 전체 사용자 목록 조회 (검색, 필터링, 페이징)
  async findAll(filterDto: AdminUserFilterDto) {
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.userOrganizations", "userOrganizations")
      .leftJoinAndSelect("userOrganizations.organization", "organization");

    // 검색 (이름 또는 이메일)
    if (filterDto?.search) {
      query.andWhere(
        "(user.name LIKE :search OR user.email LIKE :search)",
        {
          search: `%${filterDto.search}%`,
        }
      );
    }

    // 역할 필터링
    if (filterDto?.role) {
      query.andWhere("user.role = :role", { role: filterDto.role });
    }

    // 상태 필터링
    if (filterDto?.status) {
      query.andWhere("user.status = :status", { status: filterDto.status });
    }

    // 단체별 필터링
    if (filterDto?.organizationId) {
      query.andWhere("userOrganizations.organizationId = :organizationId", {
        organizationId: filterDto.organizationId,
      });
    }

    // 정렬: 최신순
    query.orderBy("user.createdAt", "DESC");

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

  // 사용자 상세 조회
  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["userOrganizations", "userOrganizations.organization"],
    });

    if (!user) {
      throw new NotFoundException("사용자를 찾을 수 없습니다.");
    }

    return user;
  }

  // 사용자 정보 업데이트 (관리자 전용)
  async update(id: string, updateDto: AdminUpdateUserDto) {
    const user = await this.findOne(id);

    // 역할 변경 기록
    if (updateDto.role && user.role !== updateDto.role) {
      console.log(
        `Admin changed user ${id} role from ${user.role} to ${updateDto.role}`
      );
    }

    // 상태 변경 기록
    if (updateDto.status && user.status !== updateDto.status) {
      console.log(
        `Admin changed user ${id} status from ${user.status} to ${updateDto.status}`
      );
    }

    await this.userRepository.update(id, updateDto);
    return this.findOne(id);
  }

  // 사용자 계정 활성화
  async activate(id: string) {
    const user = await this.findOne(id);

    if (user.status === UserStatus.ACTIVE) {
      return { message: "이미 활성화된 계정입니다.", user };
    }

    await this.userRepository.update(id, { status: UserStatus.ACTIVE });
    console.log(`Admin activated user ${id}`);

    return {
      message: "사용자 계정이 활성화되었습니다.",
      user: await this.findOne(id),
    };
  }

  // 사용자 계정 비활성화
  async deactivate(id: string) {
    const user = await this.findOne(id);

    if (user.status === UserStatus.INACTIVE) {
      return { message: "이미 비활성화된 계정입니다.", user };
    }

    await this.userRepository.update(id, { status: UserStatus.INACTIVE });
    console.log(`Admin deactivated user ${id}`);

    return {
      message: "사용자 계정이 비활성화되었습니다.",
      user: await this.findOne(id),
    };
  }

  // 사용자 계정 정지
  async suspend(id: string, reason?: string) {
    const user = await this.findOne(id);

    await this.userRepository.update(id, { status: UserStatus.SUSPENDED });
    console.log(`Admin suspended user ${id}. Reason: ${reason || "N/A"}`);

    return {
      message: "사용자 계정이 정지되었습니다.",
      user: await this.findOne(id),
    };
  }

  // 단체 배정
  async assignToOrganization(userId: string, assignDto: AssignOrganizationDto) {
    const user = await this.findOne(userId);

    // 이미 배정되어 있는지 확인
    const existing = await this.userOrgRepository.findOne({
      where: {
        userId,
        organizationId: assignDto.organizationId,
      },
    });

    if (existing) {
      // 역할만 업데이트
      await this.userOrgRepository.update(existing.id, {
        role: assignDto.role,
      });

      return {
        message: "단체 내 역할이 업데이트되었습니다.",
        userOrganization: await this.userOrgRepository.findOne({
          where: { id: existing.id },
          relations: ["organization"],
        }),
      };
    }

    // 새로 배정
    const userOrg = this.userOrgRepository.create({
      userId,
      organizationId: assignDto.organizationId,
      role: assignDto.role,
    });

    await this.userOrgRepository.save(userOrg);
    console.log(
      `Admin assigned user ${userId} to organization ${assignDto.organizationId} as ${assignDto.role}`
    );

    return {
      message: "사용자가 단체에 배정되었습니다.",
      userOrganization: await this.userOrgRepository.findOne({
        where: { id: userOrg.id },
        relations: ["organization"],
      }),
    };
  }

  // 단체 배정 해제
  async removeFromOrganization(userId: string, organizationId: string) {
    const userOrg = await this.userOrgRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    });

    if (!userOrg) {
      throw new NotFoundException("해당 단체 배정 정보를 찾을 수 없습니다.");
    }

    await this.userOrgRepository.softRemove(userOrg);
    console.log(
      `Admin removed user ${userId} from organization ${organizationId}`
    );

    return {
      message: "사용자가 단체에서 제거되었습니다.",
    };
  }

  // 사용자 통계
  async getStatistics() {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({
      where: { status: UserStatus.ACTIVE },
    });
    const inactive = await this.userRepository.count({
      where: { status: UserStatus.INACTIVE },
    });
    const suspended = await this.userRepository.count({
      where: { status: UserStatus.SUSPENDED },
    });

    const byRole = await Promise.all(
      Object.values(UserRole).map(async (role) => ({
        role,
        count: await this.userRepository.count({ where: { role } }),
      }))
    );

    return {
      total,
      byStatus: { active, inactive, suspended },
      byRole,
    };
  }
}
