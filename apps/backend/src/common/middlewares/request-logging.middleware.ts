import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

/**
 * 요청 로깅 미들웨어
 * 모든 API 호출을 로깅하여 감사 추적 제공
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;

    // 사용자 식별 (인증된 경우)
    const userId = (req as any)["user"]?.id || "anonymous";

    // 요청 시작 로그
    this.logger.log(`[${method}] ${originalUrl} - User: ${userId} - IP: ${ip}`);

    // 응답 완료 시 로그
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get("content-length") || 0;

      // 요청 완료 로그
      const logMessage = [
        `[${method}] ${originalUrl}`,
        `Status: ${statusCode}`,
        `Duration: ${duration}ms`,
        `Size: ${contentLength}bytes`,
        `User: ${userId}`,
        `IP: ${ip}`,
        `User-Agent: ${headers["user-agent"] || "unknown"}`,
      ].join(" | ");

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }

      // 성능 경고 (5초 이상 소요된 요청)
      if (duration > 5000) {
        this.logger.warn(
          `느린 요청 감지: [${method}] ${originalUrl} - ${duration}ms`
        );
      }
    });

    // 요청 에러 처리
    res.on("error", (error) => {
      this.logger.error(
        `요청 에러: [${method}] ${originalUrl} - ${error.message}`,
        error.stack
      );
    });

    next();
  }
}
