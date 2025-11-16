import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { AdminUsersService } from "./admin-users.service";
import { AdminUpdateUserDto } from "./dto/admin-update-user.dto";
import { AssignOrganizationDto } from "./dto/assign-organization.dto";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { AdminOnly } from "../../auth/roles.decorator";

@ApiTags("Admin - Users")
@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: "전체 사용자 목록 조회 (관리자 전용)" })
  @ApiQuery({
    name: "search",
    required: false,
    description: "이름 또는 이메일 검색",
  })
  @ApiQuery({
    name: "role",
    required: false,
    description: "역할로 필터링",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "상태로 필터링",
  })
  @ApiQuery({
    name: "organizationId",
    required: false,
    description: "단체별 필터링",
  })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호" })
  @ApiQuery({ name: "limit", required: false, description: "페이지당 개수" })
  @ApiResponse({ status: 200, description: "사용자 목록 조회 성공" })
  async findAll(
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("organizationId") organizationId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.adminUsersService.findAll({
      search,
      role,
      status,
      organizationId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get("statistics")
  @ApiOperation({ summary: "사용자 통계 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "사용자 통계 조회 성공" })
  async getStatistics() {
    return this.adminUsersService.getStatistics();
  }

  @Get(":id")
  @ApiOperation({ summary: "사용자 상세 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "사용자 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "사용자 정보 업데이트 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "사용자 정보 업데이트 성공" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: AdminUpdateUserDto
  ) {
    return this.adminUsersService.update(id, updateDto);
  }

  @Put(":id/activate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "사용자 계정 활성화 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "계정 활성화 성공" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async activate(@Param("id") id: string) {
    return this.adminUsersService.activate(id);
  }

  @Put(":id/deactivate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "사용자 계정 비활성화 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "계정 비활성화 성공" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async deactivate(@Param("id") id: string) {
    return this.adminUsersService.deactivate(id);
  }

  @Put(":id/suspend")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "사용자 계정 정지 (관리자 전용)" })
  @ApiQuery({ name: "reason", required: false, description: "정지 사유" })
  @ApiResponse({ status: 200, description: "계정 정지 성공" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async suspend(@Param("id") id: string, @Query("reason") reason?: string) {
    return this.adminUsersService.suspend(id, reason);
  }

  @Put(":id/organizations")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "사용자 단체 배정 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "단체 배정 성공" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async assignToOrganization(
    @Param("id") id: string,
    @Body() assignDto: AssignOrganizationDto
  ) {
    return this.adminUsersService.assignToOrganization(id, assignDto);
  }

  @Delete(":id/organizations/:organizationId")
  @ApiOperation({ summary: "사용자 단체 배정 해제 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "단체 배정 해제 성공" })
  @ApiResponse({ status: 404, description: "배정 정보를 찾을 수 없음" })
  async removeFromOrganization(
    @Param("id") id: string,
    @Param("organizationId") organizationId: string
  ) {
    return this.adminUsersService.removeFromOrganization(id, organizationId);
  }
}
