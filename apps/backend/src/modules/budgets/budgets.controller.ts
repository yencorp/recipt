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
import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EventCreatorOrOrgAdminGuard } from "../../common/guards/event-creator-or-org-admin.guard";

@ApiTags("Budgets")
@Controller("budgets")
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: "예산서 목록 조회" })
  @ApiQuery({
    name: "organizationId",
    required: false,
    description: "조직 ID로 필터링",
  })
  @ApiResponse({ status: 200, description: "예산서 목록 조회 성공" })
  async findAll(@Query("organizationId") organizationId?: string) {
    return this.budgetsService.findAll(organizationId);
  }

  @Get("event/:eventId")
  @ApiOperation({ summary: "행사별 예산서 조회" })
  @ApiResponse({ status: 200, description: "예산서 조회 성공" })
  @ApiResponse({ status: 404, description: "예산서를 찾을 수 없음" })
  async findByEvent(@Param("eventId") eventId: string) {
    return this.budgetsService.findByEventId(eventId);
  }

  @Get(":id")
  @ApiOperation({ summary: "예산서 상세 조회" })
  @ApiResponse({ status: 200, description: "예산서 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "예산서를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.budgetsService.findOne(id);
  }

  @Post("draft")
  @UseGuards(EventCreatorOrOrgAdminGuard)
  @ApiOperation({ summary: "예산서 임시 저장 (DRAFT 상태로 생성)" })
  @ApiResponse({ status: 201, description: "임시 저장 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async saveDraft(@Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.saveDraft(createBudgetDto);
  }

  @Post()
  @UseGuards(EventCreatorOrOrgAdminGuard)
  @ApiOperation({ summary: "예산서 생성" })
  @ApiResponse({ status: 201, description: "예산서 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  @ApiResponse({ status: 409, description: "해당 행사에 이미 예산서가 존재" })
  async create(@Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create(createBudgetDto);
  }

  @Put(":id/draft")
  @UseGuards(EventCreatorOrOrgAdminGuard)
  @ApiOperation({ summary: "예산서 임시 저장 수정" })
  @ApiResponse({ status: 200, description: "임시 저장 수정 성공" })
  @ApiResponse({ status: 404, description: "예산서를 찾을 수 없음" })
  async updateDraft(
    @Param("id") id: string,
    @Body() updateBudgetDto: UpdateBudgetDto
  ) {
    return this.budgetsService.updateDraft(id, updateBudgetDto);
  }

  @Put(":id")
  @UseGuards(EventCreatorOrOrgAdminGuard)
  @ApiOperation({ summary: "예산서 수정" })
  @ApiResponse({ status: 200, description: "예산서 수정 성공" })
  @ApiResponse({ status: 404, description: "예산서를 찾을 수 없음" })
  @ApiResponse({ status: 409, description: "해당 행사에 이미 예산서가 존재" })
  async update(
    @Param("id") id: string,
    @Body() updateBudgetDto: UpdateBudgetDto
  ) {
    return this.budgetsService.update(id, updateBudgetDto);
  }

  @Delete(":id")
  @UseGuards(EventCreatorOrOrgAdminGuard)
  @ApiOperation({ summary: "예산서 삭제" })
  @ApiResponse({ status: 200, description: "예산서 삭제 성공" })
  @ApiResponse({ status: 404, description: "예산서를 찾을 수 없음" })
  async remove(@Param("id") id: string) {
    return this.budgetsService.remove(id);
  }
}
