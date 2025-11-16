import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import * as validator from "validator";

/**
 * SQL Injection 방지를 위한 입력값 검증 데코레이터
 */
export const Sanitize = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const value = request.body[data as string] || request.query[data as string];

    if (typeof value === "string") {
      // SQL 인젝션 패턴 제거
      let sanitized = value;

      // SQL 키워드 검증
      const sqlKeywords = [
        "SELECT",
        "INSERT",
        "UPDATE",
        "DELETE",
        "DROP",
        "CREATE",
        "ALTER",
        "EXEC",
        "UNION",
        "DECLARE",
      ];

      const upperValue = sanitized.toUpperCase();
      for (const keyword of sqlKeywords) {
        if (upperValue.includes(keyword)) {
          throw new Error(`입력값에 허용되지 않는 SQL 키워드가 포함되어 있습니다: ${keyword}`);
        }
      }

      // 위험한 문자 이스케이프
      sanitized = validator.escape(sanitized);

      return sanitized;
    }

    return value;
  }
);

/**
 * XSS 방지를 위한 HTML 제거 데코레이터
 */
export const StripHtml = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const value = request.body[data as string] || request.query[data as string];

    if (typeof value === "string") {
      // HTML 태그 제거
      return validator.stripLow(validator.escape(value));
    }

    return value;
  }
);

/**
 * 이메일 정규화 데코레이터
 */
export const NormalizeEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const value = request.body[data as string] || request.query[data as string];

    if (typeof value === "string" && validator.isEmail(value)) {
      return validator.normalizeEmail(value);
    }

    return value;
  }
);
