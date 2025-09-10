import { Controller, Get, Post, Put, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { BudgetsService } from "./budgets.service";

@ApiTags("Budgets")
@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: "예산서 목록 조회" })
  @ApiResponse({ status: 200, description: "예산서 목록 조회 성공" })
  async findAll() {
    return this.budgetsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "예산서 상세 조회" })
  @ApiResponse({ status: 200, description: "예산서 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "예산서를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.budgetsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "예산서 생성" })
  @ApiResponse({ status: 201, description: "예산서 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async create(@Body() createBudgetDto: any) {
    // TODO: DTO 클래스 구현 필요
    return this.budgetsService.create(createBudgetDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "예산서 수정" })
  @ApiResponse({ status: 200, description: "예산서 수정 성공" })
  @ApiResponse({ status: 404, description: "예산서를 찾을 수 없음" })
  async update(@Param("id") id: string, @Body() updateBudgetDto: any) {
    // TODO: DTO 클래스 구현 필요
    return this.budgetsService.update(id, updateBudgetDto);
  }
}
