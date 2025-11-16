import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { AdminDashboardService } from "./admin-dashboard.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { AdminOnly } from "../../auth/roles.decorator";

@ApiTags("Admin - Dashboard")
@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService
  ) {}

  @Get("overview")
  @ApiOperation({ summary: "대시보드 개요 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "대시보드 개요 조회 성공" })
  async getOverview() {
    return this.adminDashboardService.getOverview();
  }

  @Get("recent-activities")
  @ApiOperation({ summary: "최근 활동 조회 (관리자 전용)" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "조회 개수 (기본: 20)",
  })
  @ApiResponse({ status: 200, description: "최근 활동 조회 성공" })
  async getRecentActivities(@Query("limit") limit?: number) {
    return this.adminDashboardService.getRecentActivities(
      limit ? Number(limit) : 20
    );
  }

  @Get("usage-stats")
  @ApiOperation({ summary: "사용 통계 조회 (관리자 전용)" })
  @ApiQuery({
    name: "days",
    required: false,
    description: "조회 기간 (일 단위, 기본: 30)",
  })
  @ApiResponse({ status: 200, description: "사용 통계 조회 성공" })
  async getUsageStats(@Query("days") days?: number) {
    return this.adminDashboardService.getUsageStats(
      days ? Number(days) : 30
    );
  }

  @Get("finance-stats")
  @ApiOperation({ summary: "재무 통계 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "재무 통계 조회 성공" })
  async getFinanceStats() {
    return this.adminDashboardService.getFinanceStats();
  }

  @Get("notification-stats")
  @ApiOperation({ summary: "알림 통계 조회 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "알림 통계 조회 성공" })
  async getNotificationStats() {
    return this.adminDashboardService.getNotificationStats();
  }
}
