import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ReceiptsService } from "./receipts.service";
import { UploadReceiptDto } from "./dto/upload-receipt.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { OrgAdminOnly } from "../auth/roles.decorator";

@ApiTags("Receipts")
@Controller("receipts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  @ApiOperation({ summary: "영수증 목록 조회" })
  @ApiQuery({
    name: "organizationId",
    required: false,
    description: "조직 ID로 필터링",
  })
  @ApiResponse({ status: 200, description: "영수증 목록 조회 성공" })
  async findAll(@Query("organizationId") organizationId?: string) {
    return this.receiptsService.findAll(organizationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "영수증 상세 조회" })
  @ApiResponse({ status: 200, description: "영수증 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "영수증을 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.receiptsService.findOne(id);
  }

  @Post("upload")
  @OrgAdminOnly()
  @ApiOperation({ summary: "영수증 업로드 (준비 단계)" })
  @ApiResponse({ status: 201, description: "영수증 업로드 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async uploadReceipt(@Body() uploadDto: UploadReceiptDto) {
    return this.receiptsService.uploadReceipt(uploadDto);
  }

  @Post(":id/process-ocr")
  @OrgAdminOnly()
  @ApiOperation({ summary: "OCR 처리 요청 (준비 단계)" })
  @ApiResponse({ status: 200, description: "OCR 처리 요청 성공" })
  @ApiResponse({ status: 404, description: "영수증을 찾을 수 없음" })
  async requestOcrProcessing(@Param("id") id: string) {
    return this.receiptsService.requestOcrProcessing(id);
  }

  @Delete(":id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "영수증 삭제" })
  @ApiResponse({ status: 200, description: "영수증 삭제 성공" })
  @ApiResponse({ status: 404, description: "영수증을 찾을 수 없음" })
  async remove(@Param("id") id: string) {
    return this.receiptsService.remove(id);
  }
}
