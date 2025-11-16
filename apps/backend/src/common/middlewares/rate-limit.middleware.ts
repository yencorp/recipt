import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Rate Limiting 미들웨어
 * DDoS 공격 방지를 위한 요청 제한
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor() {
    // 기본값: 15분에 100개 요청
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);

    // 1분마다 만료된 항목 정리
    setInterval(() => this.cleanup(), 60000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const identifier = this.getIdentifier(req);
    const now = Date.now();
    const record = this.requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
      // 새로운 윈도우 시작
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      this.setRateLimitHeaders(res, 1, this.maxRequests, now + this.windowMs);
      return next();
    }

    if (record.count >= this.maxRequests) {
      // 요청 제한 초과
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      this.setRateLimitHeaders(res, record.count, this.maxRequests, record.resetTime);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // 요청 카운트 증가
    record.count++;
    this.requestCounts.set(identifier, record);
    this.setRateLimitHeaders(res, record.count, this.maxRequests, record.resetTime);

    next();
  }

  /**
   * 클라이언트 식별자 생성
   * IP 주소 또는 인증된 사용자 ID 사용
   */
  private getIdentifier(req: Request): string {
    // 인증된 사용자가 있으면 사용자 ID 사용
    if ((req as any)["user"]?.id) {
      return `user:${(req as any)["user"].id}`;
    }

    // 프록시 뒤에 있을 경우 실제 IP 추출
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? (forwarded as string).split(",")[0].trim()
      : req.socket.remoteAddress || "unknown";

    return `ip:${ip}`;
  }

  /**
   * Rate Limit 관련 헤더 설정
   */
  private setRateLimitHeaders(
    res: Response,
    current: number,
    limit: number,
    resetTime: number
  ) {
    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - current).toString());
    res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString());
  }

  /**
   * 만료된 레코드 정리
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}
