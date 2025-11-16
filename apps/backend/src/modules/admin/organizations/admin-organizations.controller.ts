import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { AdminOrganizationsService } from "./admin-organizations.service";
import { AdminCreateOrganizationDto } from "./dto/admin-create-organization.dto";
import { AdminUpdateOrganizationDto } from "./dto/admin-update-organization.dto";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { AdminOnly } from "../../auth/roles.decorator";

@ApiTags("Admin - Organizations")
@Controller("admin/organizations")
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminOrganizationsController {
  constructor(
    private readonly adminOrgsService: AdminOrganizationsService
  ) {}

  @Get()
  @ApiOperation({ summary: "단체 목록 조회 (관리자 전용)" })
  @ApiQuery({ name: "search", required: false, description: "단체명 검색" })
  @ApiQuery({ name: "type", required: false, description: "유형 필터" })
  @ApiQuery({ name: "status", required: false, description: "상태 필터" })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호" })
  @ApiQuery({ name: "limit", required: false, description: "페이지당 개수" })
  @ApiResponse({ status: 200, description: "단체 목록 조회 성공" })
  async findAll(
    @Query("search") search?: string,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.adminOrgsService.findAll({
      search,
      type,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get("statistics")
  @ApiOperation({ summary: "단체 통계 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "단체 통계 조회 성공" })
  async getStatistics() {
    return this.adminOrgsService.getStatistics();
  }

  @Get(":id")
  @ApiOperation({ summary: "단체 상세 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "단체 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "단체를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.adminOrgsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "단체 생성 (관리자 전용)" })
  @ApiResponse({ status: 201, description: "단체 생성 성공" })
  @ApiResponse({ status: 409, description: "이미 존재하는 단체명" })
  async create(@Body() createDto: AdminCreateOrganizationDto) {
    return this.adminOrgsService.create(createDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "단체 수정 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "단체 수정 성공" })
  @ApiResponse({ status: 404, description: "단체를 찾을 수 없음" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: AdminUpdateOrganizationDto
  ) {
    return this.adminOrgsService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "단체 삭제 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "단체 삭제 성공" })
  @ApiResponse({ status: 404, description: "단체를 찾을 수 없음" })
  @ApiResponse({ status: 409, description: "소속 회원이 있어 삭제 불가" })
  async remove(@Param("id") id: string) {
    return this.adminOrgsService.remove(id);
  }
}
