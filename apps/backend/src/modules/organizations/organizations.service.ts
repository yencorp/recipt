import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Organization,
  OrganizationStatus,
} from "../../entities/organization.entity";
import {
  UserOrganization,
  MembershipStatus,
} from "../../entities/user-organization.entity";
import { User } from "../../entities/user.entity";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { AddMemberDto } from "./dto/add-member.dto";

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private readonly userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    // 이름 중복 확인
    const existing = await this.organizationRepository.findOne({
      where: { name: createOrganizationDto.name },
    });

    if (existing) {
      throw new ConflictException("이미 존재하는 단체명입니다.");
    }

    const organization = this.organizationRepository.create({
      ...createOrganizationDto,
      status: createOrganizationDto.status || OrganizationStatus.ACTIVE,
      isActive: true,
      statistics: {
        totalMembers: 0,
        totalEvents: 0,
        totalBudgets: 0,
        totalSettlements: 0,
        lastActivityAt: new Date(),
      },
    });

    return this.organizationRepository.save(organization);
  }

  async findAll() {
    return this.organizationRepository.find({
      relations: ["userOrganizations"],
      order: { priority: "ASC", createdAt: "DESC" },
    });
  }

  async findOne(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ["userOrganizations", "userOrganizations.user"],
    });

    if (!organization) {
      throw new NotFoundException("단체를 찾을 수 없습니다.");
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.findOne(id);

    // 이름 변경 시 중복 확인
    if (updateOrganizationDto.name) {
      const existing = await this.organizationRepository.findOne({
        where: { name: updateOrganizationDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException("이미 존재하는 단체명입니다.");
      }
    }

    await this.organizationRepository.update(id, updateOrganizationDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const organization = await this.findOne(id);

    // 멤버가 있는 단체는 삭제 불가
    if (organization.userOrganizations?.length > 0) {
      throw new ForbiddenException(
        "구성원이 있는 단체는 삭제할 수 없습니다. 먼저 모든 구성원을 제거해주세요.",
      );
    }

    await this.organizationRepository.remove(organization);
    return { message: "단체가 삭제되었습니다." };
  }

  // 단체 구성원 관리
  async getMembers(organizationId: string) {
    const organization = await this.findOne(organizationId);

    const members = await this.userOrganizationRepository.find({
      where: { organizationId },
      relations: ["user"],
      order: { joinedAt: "DESC" },
    });

    return members.map((uo) => ({
      id: uo.id,
      userId: uo.user.id,
      userName: uo.user.name,
      userEmail: uo.user.email,
      role: uo.role,
      status: uo.status,
      permissions: uo.permissions,
      joinedAt: uo.joinedAt,
      approvedAt: uo.approvedAt,
      approve: uo.approve,
    }));
  }

  async addMember(organizationId: string, addMemberDto: AddMemberDto) {
    const organization = await this.findOne(organizationId);

    // 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { id: addMemberDto.userId },
    });

    if (!user) {
      throw new NotFoundException("사용자를 찾을 수 없습니다.");
    }

    // 이미 멤버인지 확인
    const existingMembership = await this.userOrganizationRepository.findOne({
      where: {
        userId: addMemberDto.userId,
        organizationId,
      },
    });

    if (existingMembership) {
      throw new ConflictException("이미 해당 단체의 구성원입니다.");
    }

    // 멤버 추가
    const userOrganization = this.userOrganizationRepository.create({
      userId: addMemberDto.userId,
      organizationId,
      role: addMemberDto.role,
      status: addMemberDto.status || MembershipStatus.ACTIVE,
      permissions: addMemberDto.permissions,
      joinedAt: new Date(),
      approvedAt: new Date(),
      approve: true,
    });

    await this.userOrganizationRepository.save(userOrganization);

    // 단체 통계 업데이트
    organization.incrementMemberCount();
    await this.organizationRepository.save(organization);

    return this.getMembers(organizationId);
  }

  async removeMember(organizationId: string, userId: string) {
    await this.findOne(organizationId);

    const membership = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
    });

    if (!membership) {
      throw new NotFoundException("해당 구성원을 찾을 수 없습니다.");
    }

    await this.userOrganizationRepository.remove(membership);

    // 단체 통계 업데이트
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (organization) {
      organization.decrementMemberCount();
      await this.organizationRepository.save(organization);
    }

    return { message: "구성원이 제거되었습니다." };
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    updateData: Partial<AddMemberDto>,
  ) {
    await this.findOne(organizationId);

    const membership = await this.userOrganizationRepository.findOne({
      where: { userId, organizationId },
    });

    if (!membership) {
      throw new NotFoundException("해당 구성원을 찾을 수 없습니다.");
    }

    if (updateData.role) {
      membership.role = updateData.role;
    }

    if (updateData.status) {
      membership.status = updateData.status;
    }

    if (updateData.permissions) {
      membership.permissions = {
        ...membership.permissions,
        ...updateData.permissions,
      };
    }

    await this.userOrganizationRepository.save(membership);

    return this.getMembers(organizationId);
  }
}
