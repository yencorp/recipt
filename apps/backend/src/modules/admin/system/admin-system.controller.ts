import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AdminSystemService, SystemSettings } from "./admin-system.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { AdminOnly } from "../../auth/roles.decorator";

@ApiTags("Admin - System")
@Controller("admin/system")
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminSystemController {
  constructor(private readonly adminSystemService: AdminSystemService) {}

  @Get("status")
  @ApiOperation({ summary: "시스템 상태 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "시스템 상태 조회 성공" })
  async getSystemStatus() {
    return this.adminSystemService.getSystemStatus();
  }

  @Get("settings")
  @ApiOperation({ summary: "시스템 설정 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "시스템 설정 조회 성공" })
  async getSettings() {
    return this.adminSystemService.getSettings();
  }

  @Put("settings")
  @ApiOperation({ summary: "시스템 설정 업데이트 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "시스템 설정 업데이트 성공" })
  async updateSettings(@Body() updates: Partial<SystemSettings>) {
    return this.adminSystemService.updateSettings(updates);
  }

  @Get("database/stats")
  @ApiOperation({ summary: "데이터베이스 통계 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "데이터베이스 통계 조회 성공" })
  async getDatabaseStats() {
    return this.adminSystemService.getDatabaseStats();
  }

  @Post("backup")
  @ApiOperation({ summary: "백업 요청 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "백업 요청 성공" })
  async initiateBackup() {
    return this.adminSystemService.initiateBackup();
  }

  @Post("restore/:backupId")
  @ApiOperation({ summary: "복원 요청 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "복원 요청 성공" })
  async initiateRestore(@Param("backupId") backupId: string) {
    return this.adminSystemService.initiateRestore(backupId);
  }
}
