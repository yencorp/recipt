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
import { SettlementsService } from "./settlements.service";
import { CreateSettlementDto } from "./dto/create-settlement.dto";
import { UpdateSettlementDto } from "./dto/update-settlement.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { OrgAdminOnly } from "../auth/roles.decorator";

@ApiTags("Settlements")
@Controller("settlements")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get()
  @ApiOperation({ summary: "결산서 목록 조회" })
  @ApiQuery({
    name: "organizationId",
    required: false,
    description: "조직 ID로 필터링",
  })
  @ApiResponse({ status: 200, description: "결산서 목록 조회 성공" })
  async findAll(@Query("organizationId") organizationId?: string) {
    return this.settlementsService.findAll(organizationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "결산서 상세 조회" })
  @ApiResponse({ status: 200, description: "결산서 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "결산서를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.settlementsService.findOne(id);
  }

  @Post()
  @OrgAdminOnly()
  @ApiOperation({ summary: "결산서 생성" })
  @ApiResponse({ status: 201, description: "결산서 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async create(@Body() createDto: CreateSettlementDto) {
    return this.settlementsService.create(createDto);
  }

  @Put(":id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "결산서 수정" })
  @ApiResponse({ status: 200, description: "결산서 수정 성공" })
  @ApiResponse({ status: 404, description: "결산서를 찾을 수 없음" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateSettlementDto
  ) {
    return this.settlementsService.update(id, updateDto);
  }

  @Delete(":id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "결산서 삭제" })
  @ApiResponse({ status: 200, description: "결산서 삭제 성공" })
  @ApiResponse({ status: 404, description: "결산서를 찾을 수 없음" })
  async remove(@Param("id") id: string) {
    return this.settlementsService.remove(id);
  }

  @Get(":id/compare")
  @ApiOperation({ summary: "예산서 대비 결산 비교" })
  @ApiResponse({ status: 200, description: "예산 대비 결산 비교 성공" })
  @ApiResponse({ status: 404, description: "결산서 또는 예산서를 찾을 수 없음" })
  async compareWithBudget(@Param("id") id: string) {
    return this.settlementsService.compareWithBudget(id);
  }
}
