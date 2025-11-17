import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PrintService } from "./print.service";
import { GeneratePDFDto } from "./dto/generate-pdf.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

@ApiTags("Print")
@Controller("print")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrintController {
  constructor(private readonly printService: PrintService) {}

  @Get("budget/:eventId")
  @ApiOperation({ summary: "예산서 인쇄 데이터 조회" })
  @ApiResponse({ status: 200, description: "예산서 인쇄 데이터 조회 성공" })
  @ApiResponse({ status: 404, description: "이벤트를 찾을 수 없음" })
  async getPrintBudgetData(
    @Param("eventId") eventId: string,
    @Request() req,
  ) {
    return this.printService.getPrintBudgetData(eventId, req.user);
  }

  @Get("settlement/:eventId")
  @ApiOperation({ summary: "결산서 인쇄 데이터 조회" })
  @ApiResponse({ status: 200, description: "결산서 인쇄 데이터 조회 성공" })
  @ApiResponse({ status: 404, description: "이벤트를 찾을 수 없음" })
  async getPrintSettlementData(
    @Param("eventId") eventId: string,
    @Request() req,
  ) {
    return this.printService.getPrintSettlementData(eventId, req.user);
  }

  @Post("pdf")
  @ApiOperation({ summary: "PDF 생성" })
  @ApiResponse({ status: 201, description: "PDF 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  @ApiResponse({ status: 404, description: "이벤트를 찾을 수 없음" })
  async generatePDF(@Body() generatePDFDto: GeneratePDFDto, @Request() req) {
    return this.printService.generatePDF(generatePDFDto, req.user);
  }
}
