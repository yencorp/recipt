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
import { BudgetItemsService } from "./budget-items.service";
import { CreateBudgetIncomeDto } from "./dto/create-budget-income.dto";
import { UpdateBudgetIncomeDto } from "./dto/update-budget-income.dto";
import { CreateBudgetExpenseDto } from "./dto/create-budget-expense.dto";
import { UpdateBudgetExpenseDto } from "./dto/update-budget-expense.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { OrgAdminOnly } from "../auth/roles.decorator";

@ApiTags("Budget Items")
@Controller("budget-items")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetItemsController {
  constructor(private readonly budgetItemsService: BudgetItemsService) {}

  // ===== 수입 항목 API =====

  @Get("incomes")
  @ApiOperation({ summary: "수입 항목 목록 조회" })
  @ApiQuery({
    name: "budgetId",
    required: false,
    description: "예산 ID로 필터링",
  })
  @ApiResponse({ status: 200, description: "수입 항목 목록 조회 성공" })
  async findAllIncomes(@Query("budgetId") budgetId?: string) {
    return this.budgetItemsService.findAllIncomes(budgetId);
  }

  @Get("incomes/:id")
  @ApiOperation({ summary: "수입 항목 상세 조회" })
  @ApiResponse({ status: 200, description: "수입 항목 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "수입 항목을 찾을 수 없음" })
  async findOneIncome(@Param("id") id: string) {
    return this.budgetItemsService.findOneIncome(id);
  }

  @Post("incomes")
  @OrgAdminOnly()
  @ApiOperation({ summary: "수입 항목 생성" })
  @ApiResponse({ status: 201, description: "수입 항목 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async createIncome(@Body() createDto: CreateBudgetIncomeDto) {
    return this.budgetItemsService.createIncome(createDto);
  }

  @Put("incomes/:id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "수입 항목 수정" })
  @ApiResponse({ status: 200, description: "수입 항목 수정 성공" })
  @ApiResponse({ status: 404, description: "수입 항목을 찾을 수 없음" })
  async updateIncome(
    @Param("id") id: string,
    @Body() updateDto: UpdateBudgetIncomeDto
  ) {
    return this.budgetItemsService.updateIncome(id, updateDto);
  }

  @Delete("incomes/:id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "수입 항목 삭제" })
  @ApiResponse({ status: 200, description: "수입 항목 삭제 성공" })
  @ApiResponse({ status: 404, description: "수입 항목을 찾을 수 없음" })
  async removeIncome(@Param("id") id: string) {
    return this.budgetItemsService.removeIncome(id);
  }

  // ===== 지출 항목 API =====

  @Get("expenses")
  @ApiOperation({ summary: "지출 항목 목록 조회" })
  @ApiQuery({
    name: "budgetId",
    required: false,
    description: "예산 ID로 필터링",
  })
  @ApiResponse({ status: 200, description: "지출 항목 목록 조회 성공" })
  async findAllExpenses(@Query("budgetId") budgetId?: string) {
    return this.budgetItemsService.findAllExpenses(budgetId);
  }

  @Get("expenses/:id")
  @ApiOperation({ summary: "지출 항목 상세 조회" })
  @ApiResponse({ status: 200, description: "지출 항목 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "지출 항목을 찾을 수 없음" })
  async findOneExpense(@Param("id") id: string) {
    return this.budgetItemsService.findOneExpense(id);
  }

  @Post("expenses")
  @OrgAdminOnly()
  @ApiOperation({ summary: "지출 항목 생성" })
  @ApiResponse({ status: 201, description: "지출 항목 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async createExpense(@Body() createDto: CreateBudgetExpenseDto) {
    return this.budgetItemsService.createExpense(createDto);
  }

  @Put("expenses/:id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "지출 항목 수정" })
  @ApiResponse({ status: 200, description: "지출 항목 수정 성공" })
  @ApiResponse({ status: 404, description: "지출 항목을 찾을 수 없음" })
  async updateExpense(
    @Param("id") id: string,
    @Body() updateDto: UpdateBudgetExpenseDto
  ) {
    return this.budgetItemsService.updateExpense(id, updateDto);
  }

  @Delete("expenses/:id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "지출 항목 삭제" })
  @ApiResponse({ status: 200, description: "지출 항목 삭제 성공" })
  @ApiResponse({ status: 404, description: "지출 항목을 찾을 수 없음" })
  async removeExpense(@Param("id") id: string) {
    return this.budgetItemsService.removeExpense(id);
  }

  // ===== 예산 집계 API =====

  @Get("summary/:budgetId")
  @ApiOperation({ summary: "예산 집계 조회" })
  @ApiResponse({ status: 200, description: "예산 집계 조회 성공" })
  async getBudgetSummary(@Param("budgetId") budgetId: string) {
    return this.budgetItemsService.getBudgetSummary(budgetId);
  }

  @Get("incomes/category/:budgetId/:category")
  @ApiOperation({ summary: "카테고리별 수입 항목 조회" })
  @ApiResponse({
    status: 200,
    description: "카테고리별 수입 항목 조회 성공",
  })
  async getIncomesByCategory(
    @Param("budgetId") budgetId: string,
    @Param("category") category: string
  ) {
    return this.budgetItemsService.getIncomesByCategory(budgetId, category);
  }

  @Get("expenses/category/:budgetId/:category")
  @ApiOperation({ summary: "카테고리별 지출 항목 조회" })
  @ApiResponse({
    status: 200,
    description: "카테고리별 지출 항목 조회 성공",
  })
  async getExpensesByCategory(
    @Param("budgetId") budgetId: string,
    @Param("category") category: string
  ) {
    return this.budgetItemsService.getExpensesByCategory(budgetId, category);
  }
}
