import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { OrganizationsService } from "./organizations.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { AdminOnly, OrgAdminOnly } from "../auth/roles.decorator";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { AddMemberDto } from "./dto/add-member.dto";

@ApiTags("Organizations")
@Controller("organizations")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT")
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: "단체 생성 (관리자 전용)" })
  @ApiResponse({ status: 201, description: "단체 생성 성공" })
  @ApiResponse({ status: 409, description: "중복된 단체명" })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: "단체 목록 조회" })
  @ApiResponse({ status: 200, description: "단체 목록 조회 성공" })
  async findAll() {
    return this.organizationsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "단체 상세 조회" })
  @ApiResponse({ status: 200, description: "단체 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "단체를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.organizationsService.findOne(id);
  }

  @Put(":id")
  @AdminOnly()
  @ApiOperation({ summary: "단체 정보 수정 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "단체 정보 수정 성공" })
  @ApiResponse({ status: 404, description: "단체를 찾을 수 없음" })
  @ApiResponse({ status: 409, description: "중복된 단체명" })
  async update(
    @Param("id") id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(":id")
  @AdminOnly()
  @ApiOperation({ summary: "단체 삭제 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "단체 삭제 성공" })
  @ApiResponse({ status: 403, description: "구성원이 있는 단체는 삭제 불가" })
  @ApiResponse({ status: 404, description: "단체를 찾을 수 없음" })
  async remove(@Param("id") id: string) {
    return this.organizationsService.remove(id);
  }

  // 단체 구성원 관리
  @Get(":id/members")
  @ApiOperation({ summary: "단체 구성원 조회" })
  @ApiResponse({ status: 200, description: "구성원 목록 조회 성공" })
  @ApiResponse({ status: 404, description: "단체를 찾을 수 없음" })
  async getMembers(@Param("id") id: string) {
    return this.organizationsService.getMembers(id);
  }

  @Post(":id/members")
  @OrgAdminOnly()
  @ApiOperation({ summary: "단체 구성원 추가 (단체 관리자 전용)" })
  @ApiResponse({ status: 201, description: "구성원 추가 성공" })
  @ApiResponse({ status: 404, description: "단체 또는 사용자를 찾을 수 없음" })
  @ApiResponse({ status: 409, description: "이미 구성원임" })
  async addMember(
    @Param("id") id: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.organizationsService.addMember(id, addMemberDto);
  }

  @Delete(":id/members/:userId")
  @OrgAdminOnly()
  @ApiOperation({ summary: "단체 구성원 제거 (단체 관리자 전용)" })
  @ApiResponse({ status: 200, description: "구성원 제거 성공" })
  @ApiResponse({ status: 404, description: "단체 또는 구성원을 찾을 수 없음" })
  async removeMember(
    @Param("id") id: string,
    @Param("userId") userId: string,
  ) {
    return this.organizationsService.removeMember(id, userId);
  }

  @Put(":id/members/:userId")
  @OrgAdminOnly()
  @ApiOperation({ summary: "단체 구성원 역할/권한 수정 (단체 관리자 전용)" })
  @ApiResponse({ status: 200, description: "구성원 정보 수정 성공" })
  @ApiResponse({ status: 404, description: "단체 또는 구성원을 찾을 수 없음" })
  async updateMemberRole(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() updateData: Partial<AddMemberDto>,
  ) {
    return this.organizationsService.updateMemberRole(id, userId, updateData);
  }
}
