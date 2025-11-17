import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { EmailNotVerifiedException } from "../../modules/auth/exceptions/email-not-verified.exception";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // EmailNotVerifiedException은 원래 응답 구조를 그대로 사용
    if (exception instanceof EmailNotVerifiedException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 로깅
      this.logException(request, status, exceptionResponse, undefined);

      // 원래 응답 구조 그대로 반환
      return response.status(status).json(exceptionResponse);
    }

    const status = this.getStatus(exception);
    const message = this.getMessage(exception);
    const stack = this.getStack(exception);

    // 에러 로깅
    this.logException(request, status, message, stack);

    // 에러 응답 포맷
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      ...(process.env.NODE_ENV === "development" && stack && { stack }),
    };

    response.status(status).json(errorResponse);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string | object {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === "string") {
        return response;
      }
      if (typeof response === "object" && response !== null) {
        return (response as any).message || response;
      }
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return "내부 서버 오류가 발생했습니다.";
  }

  private getStack(exception: unknown): string | undefined {
    if (exception instanceof Error) {
      return exception.stack;
    }
    return undefined;
  }

  private logException(
    request: Request,
    status: number,
    message: string | object,
    stack?: string
  ) {
    const { method, url, ip, headers } = request;
    const userAgent = headers["user-agent"] || "";

    const logContext = {
      method,
      url,
      ip,
      userAgent,
      statusCode: status,
      message,
    };

    if (status >= 500) {
      // 서버 에러 - ERROR 레벨로 로깅
      this.logger.error(
        `🔥 서버 에러 [${status}] ${method} ${url} - ${ip}`,
        JSON.stringify({ ...logContext, stack }, null, 2)
      );
    } else if (status >= 400) {
      // 클라이언트 에러 - WARN 레벨로 로깅
      this.logger.warn(
        `⚠️ 클라이언트 에러 [${status}] ${method} ${url} - ${ip}`,
        JSON.stringify(logContext, null, 2)
      );
    } else {
      // 기타 - INFO 레벨로 로깅
      this.logger.log(
        `ℹ️ 예외 [${status}] ${method} ${url} - ${ip}`,
        JSON.stringify(logContext, null, 2)
      );
    }
  }
}
