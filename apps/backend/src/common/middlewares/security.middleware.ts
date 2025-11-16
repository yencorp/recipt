import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

/**
 * 보안 헤더 미들웨어
 * OWASP 권장 보안 헤더 설정
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // HTTPS 강제 (프로덕션 환경)
    if (
      process.env.NODE_ENV === "production" &&
      req.headers["x-forwarded-proto"] !== "https"
    ) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    // Strict-Transport-Security: HTTPS만 사용하도록 강제
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    // X-Content-Type-Options: MIME 타입 스니핑 방지
    res.setHeader("X-Content-Type-Options", "nosniff");

    // X-Frame-Options: 클릭재킹 방지
    res.setHeader("X-Frame-Options", "DENY");

    // X-XSS-Protection: XSS 필터 활성화
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Content-Security-Policy: XSS 및 데이터 주입 공격 방지
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
    res.setHeader("Content-Security-Policy", csp);

    // Referrer-Policy: 리퍼러 정보 제어
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions-Policy: 브라우저 기능 제어
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );

    // X-Powered-By 헤더 제거 (서버 정보 노출 방지)
    res.removeHeader("X-Powered-By");

    next();
  }
}
