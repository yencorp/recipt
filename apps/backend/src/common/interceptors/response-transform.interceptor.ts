import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Reflector } from "@nestjs/core";

/**
 * 응답 변환 인터셉터
 * 모든 API 응답을 표준 형식으로 변환
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // @NoTransform() 데코레이터가 있으면 원본 응답 반환
    const noTransform = this.reflector.get<boolean>(
      "noTransform",
      context.getHandler()
    );

    if (noTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // 이미 표준 형식이면 그대로 반환
        if (this.isStandardResponse(data)) {
          return data;
        }

        // 표준 형식으로 변환
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      })
    );
  }

  /**
   * 이미 표준 형식인지 확인
   */
  private isStandardResponse(data: any): boolean {
    return (
      data &&
      typeof data === "object" &&
      "success" in data &&
      "timestamp" in data
    );
  }
}
