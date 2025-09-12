import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers["user-agent"] || "";
    const startTime = Date.now();

    // 요청 시작 로그
    this.logger.log(`🚀 ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // 응답 완료 이벤트 리스너
    res.on("finish", () => {
      const { statusCode } = res;
      const contentLength = res.get("content-length");
      const responseTime = Date.now() - startTime;

      // 상태 코드에 따른 로그 레벨 결정
      const logLevel = this.getLogLevel(statusCode);
      const statusIcon = this.getStatusIcon(statusCode);

      const logMessage = `${statusIcon} ${method} ${originalUrl} ${statusCode} ${responseTime}ms - ${
        contentLength || 0
      }b`;

      if (logLevel === "error") {
        this.logger.error(logMessage);
      } else if (logLevel === "warn") {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    // 에러 이벤트 리스너
    res.on("error", (error) => {
      const responseTime = Date.now() - startTime;
      this.logger.error(
        `❌ ${method} ${originalUrl} ERROR ${responseTime}ms - ${error.message}`,
        error.stack
      );
    });

    next();
  }

  private getLogLevel(statusCode: number): "log" | "warn" | "error" {
    if (statusCode >= 500) return "error";
    if (statusCode >= 400) return "warn";
    return "log";
  }

  private getStatusIcon(statusCode: number): string {
    if (statusCode >= 500) return "🔥"; // 서버 에러
    if (statusCode >= 400) return "⚠️"; // 클라이언트 에러
    if (statusCode >= 300) return "🔄"; // 리다이렉션
    if (statusCode >= 200) return "✅"; // 성공
    return "📝"; // 정보성 응답
  }
}
