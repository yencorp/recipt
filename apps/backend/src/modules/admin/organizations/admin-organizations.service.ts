import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Organization,
  OrganizationType,
  OrganizationStatus,
} from "../../../entities/organization.entity";
import { UserOrganization } from "../../../entities/user-organization.entity";
import { AdminCreateOrganizationDto } from "./dto/admin-create-organization.dto";
import { AdminUpdateOrganizationDto } from "./dto/admin-update-organization.dto";

export interface AdminOrganizationFilterDto {
  search?: string;
  type?: OrganizationType;
  status?: OrganizationStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class AdminOrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private readonly userOrgRepository: Repository<UserOrganization>
  ) {}

  // 단체 목록 조회
  async findAll(filterDto: AdminOrganizationFilterDto) {
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.orgRepository.createQueryBuilder("org");

    // 검색
    if (filterDto?.search) {
      query.andWhere("org.name LIKE :search", {
        search: `%${filterDto.search}%`,
      });
    }

    // 유형 필터
    if (filterDto?.type) {
      query.andWhere("org.type = :type", { type: filterDto.type });
    }

    // 상태 필터
    if (filterDto?.status) {
      query.andWhere("org.status = :status", { status: filterDto.status });
    }

    // 정렬
    query.orderBy("org.createdAt", "DESC");

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

  // 단체 상세 조회
  async findOne(id: string) {
    const org = await this.orgRepository.findOne({
      where: { id },
      relations: ["userOrganizations", "userOrganizations.user"],
    });

    if (!org) {
      throw new NotFoundException("단체를 찾을 수 없습니다.");
    }

    return org;
  }

  // 단체 생성
  async create(createDto: AdminCreateOrganizationDto) {
    // 중복 체크
    const existing = await this.orgRepository.findOne({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new ConflictException("이미 존재하는 단체명입니다.");
    }

    const org = this.orgRepository.create(createDto);
    return this.orgRepository.save(org);
  }

  // 단체 수정
  async update(id: string, updateDto: AdminUpdateOrganizationDto) {
    const org = await this.findOne(id);

    // 이름 중복 체크
    if (updateDto.name && updateDto.name !== org.name) {
      const existing = await this.orgRepository.findOne({
        where: { name: updateDto.name },
      });

      if (existing) {
        throw new ConflictException("이미 존재하는 단체명입니다.");
      }
    }

    await this.orgRepository.update(id, updateDto);
    return this.findOne(id);
  }

  // 단체 삭제
  async remove(id: string) {
    const org = await this.findOne(id);

    // 소속 회원 수 확인
    const memberCount = await this.userOrgRepository.count({
      where: { organizationId: id },
    });

    if (memberCount > 0) {
      throw new ConflictException(
        `${memberCount}명의 회원이 소속되어 있어 삭제할 수 없습니다.`
      );
    }

    await this.orgRepository.softRemove(org);
    return { message: "단체가 삭제되었습니다.", id };
  }

  // 단체 통계
  async getStatistics() {
    const total = await this.orgRepository.count();
    const active = await this.orgRepository.count({
      where: { status: OrganizationStatus.ACTIVE },
    });
    const inactive = await this.orgRepository.count({
      where: { status: OrganizationStatus.INACTIVE },
    });
    const suspended = await this.orgRepository.count({
      where: { status: OrganizationStatus.SUSPENDED },
    });

    const byType = await Promise.all(
      Object.values(OrganizationType).map(async (type) => ({
        type,
        count: await this.orgRepository.count({ where: { type } }),
      }))
    );

    return {
      total,
      byStatus: { active, inactive, suspended },
      byType,
    };
  }
}
