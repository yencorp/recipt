import { Controller, Get, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import axios from "axios";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private configService: ConfigService,
    private dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get()
  @ApiOperation({
    summary: "기본 헬스체크",
    description: "API 서버의 기본 상태를 확인합니다.",
  })
  @ApiResponse({
    status: 200,
    description: "서버가 정상 상태입니다.",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ok" },
        timestamp: { type: "string", example: "2025-09-07T07:15:30.000Z" },
        uptime: { type: "number", example: 12345.67 },
      },
    },
  })
  async getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get("detailed")
  @ApiOperation({
    summary: "상세 헬스체크",
    description:
      "데이터베이스, Redis, OCR 서비스를 포함한 전체 시스템 상태를 확인합니다.",
  })
  @ApiResponse({
    status: 200,
    description: "전체 시스템 상태 정보",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ok" },
        timestamp: { type: "string" },
        uptime: { type: "number" },
        services: {
          type: "object",
          properties: {
            database: { type: "object" },
            redis: { type: "object" },
            ocrService: { type: "object" },
          },
        },
      },
    },
  })
  async getDetailedHealth() {
    const healthChecks = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        ocrService: await this.checkOcrService(),
      },
    };

    // 전체 상태 결정
    const allServicesHealthy = Object.values(healthChecks.services).every(
      (service: any) => service.status === "ok"
    );

    healthChecks.status = allServicesHealthy ? "ok" : "degraded";

    return healthChecks;
  }

  private async checkDatabase(): Promise<{
    status: string;
    responseTime?: number;
    error?: string;
  }> {
    if (!this.configService.get("HEALTH_CHECK_DATABASE")) {
      return { status: "disabled" };
    }

    try {
      const startTime = Date.now();
      await this.dataSource.query("SELECT 1");
      const responseTime = Date.now() - startTime;

      return {
        status: "ok",
        responseTime,
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<{
    status: string;
    responseTime?: number;
    error?: string;
  }> {
    if (!this.configService.get("HEALTH_CHECK_REDIS")) {
      return { status: "disabled" };
    }

    try {
      const startTime = Date.now();
      const testKey = `health-check:${Date.now()}`;

      await this.cacheManager.set(testKey, "test", 10000);
      const value = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);

      if (value !== "test") {
        throw new Error("Redis read/write test failed");
      }

      const responseTime = Date.now() - startTime;

      return {
        status: "ok",
        responseTime,
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  private async checkOcrService(): Promise<{
    status: string;
    responseTime?: number;
    error?: string;
  }> {
    if (!this.configService.get("HEALTH_CHECK_OCR_SERVICE")) {
      return { status: "disabled" };
    }

    try {
      const startTime = Date.now();
      const ocrServiceUrl = this.configService.get("OCR_SERVICE_URL");

      await axios.get(`${ocrServiceUrl}/health`, {
        timeout: 5000,
      });

      const responseTime = Date.now() - startTime;

      return {
        status: "ok",
        responseTime,
      };
    } catch (error) {
      return {
        status: "error",
        error: error.response?.data?.message || error.message,
      };
    }
  }

  @Get("readiness")
  @ApiOperation({
    summary: "Readiness 프로브",
    description: "애플리케이션이 트래픽을 받을 준비가 되었는지 확인합니다.",
  })
  async getReadiness() {
    const services = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };

    const ready = Object.values(services)
      .filter((service: any) => service.status !== "disabled")
      .every((service: any) => service.status === "ok");

    if (!ready) {
      throw new Error("Application not ready");
    }

    return {
      status: "ready",
      timestamp: new Date().toISOString(),
      services,
    };
  }

  @Get("liveness")
  @ApiOperation({
    summary: "Liveness 프로브",
    description: "애플리케이션이 살아있는지 확인합니다.",
  })
  async getLiveness() {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
