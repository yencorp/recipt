import { Controller, Get, Post, Put, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SettlementsService } from "./settlements.service";

@ApiTags("Settlements")
@Controller("settlements")
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get()
  @ApiOperation({ summary: "결산서 목록 조회" })
  @ApiResponse({ status: 200, description: "결산서 목록 조회 성공" })
  async findAll() {
    return this.settlementsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "결산서 상세 조회" })
  @ApiResponse({ status: 200, description: "결산서 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "결산서를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.settlementsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "결산서 생성" })
  @ApiResponse({ status: 201, description: "결산서 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async create(@Body() createSettlementDto: any) {
    // TODO: DTO 클래스 구현 필요
    return this.settlementsService.create(createSettlementDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "결산서 수정" })
  @ApiResponse({ status: 200, description: "결산서 수정 성공" })
  @ApiResponse({ status: 404, description: "결산서를 찾을 수 없음" })
  async update(@Param("id") id: string, @Body() updateSettlementDto: any) {
    // TODO: DTO 클래스 구현 필요
    return this.settlementsService.update(id, updateSettlementDto);
  }
}
