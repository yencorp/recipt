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
import { SettlementItemsService } from "./settlement-items.service";
import { CreateSettlementItemDto } from "./dto/create-settlement-item.dto";
import { UpdateSettlementItemDto } from "./dto/update-settlement-item.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { OrgAdminOnly } from "../auth/roles.decorator";

@ApiTags("Settlement Items")
@Controller("settlement-items")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettlementItemsController {
  constructor(
    private readonly settlementItemsService: SettlementItemsService
  ) {}

  @Get()
  @ApiOperation({ summary: "결산 항목 목록 조회" })
  @ApiQuery({
    name: "settlementId",
    required: false,
    description: "결산서 ID로 필터링",
  })
  @ApiResponse({ status: 200, description: "결산 항목 목록 조회 성공" })
  async findAll(@Query("settlementId") settlementId?: string) {
    return this.settlementItemsService.findAll(settlementId);
  }

  @Get(":id")
  @ApiOperation({ summary: "결산 항목 상세 조회" })
  @ApiResponse({ status: 200, description: "결산 항목 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "결산 항목을 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.settlementItemsService.findOne(id);
  }

  @Post()
  @OrgAdminOnly()
  @ApiOperation({ summary: "결산 항목 생성" })
  @ApiResponse({ status: 201, description: "결산 항목 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async create(@Body() createDto: CreateSettlementItemDto) {
    return this.settlementItemsService.create(createDto);
  }

  @Put(":id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "결산 항목 수정" })
  @ApiResponse({ status: 200, description: "결산 항목 수정 성공" })
  @ApiResponse({ status: 404, description: "결산 항목을 찾을 수 없음" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateSettlementItemDto
  ) {
    return this.settlementItemsService.update(id, updateDto);
  }

  @Delete(":id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "결산 항목 삭제" })
  @ApiResponse({ status: 200, description: "결산 항목 삭제 성공" })
  @ApiResponse({ status: 404, description: "결산 항목을 찾을 수 없음" })
  async remove(@Param("id") id: string) {
    return this.settlementItemsService.remove(id);
  }

  @Get("data-source/:settlementId/:dataSource")
  @ApiOperation({ summary: "데이터 출처별 결산 항목 조회" })
  @ApiResponse({
    status: 200,
    description: "데이터 출처별 결산 항목 조회 성공",
  })
  async findByDataSource(
    @Param("settlementId") settlementId: string,
    @Param("dataSource") dataSource: string
  ) {
    return this.settlementItemsService.findByDataSource(
      settlementId,
      dataSource
    );
  }

  @Get("category/:settlementId/:category")
  @ApiOperation({ summary: "카테고리별 결산 항목 조회" })
  @ApiResponse({
    status: 200,
    description: "카테고리별 결산 항목 조회 성공",
  })
  async findByCategory(
    @Param("settlementId") settlementId: string,
    @Param("category") category: string
  ) {
    return this.settlementItemsService.findByCategory(settlementId, category);
  }
}
