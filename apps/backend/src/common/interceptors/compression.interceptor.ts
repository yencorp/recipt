import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Request, Response } from "express";

/**
 * 압축 인터셉터
 * 응답 크기가 임계값 이상일 때 압축 권장
 * (실제 압축은 express의 compression 미들웨어가 처리)
 */
@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  private readonly compressionThreshold = 1024; // 1KB

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<Request>();

    // Accept-Encoding 헤더 확인
    const acceptEncoding = request.headers["accept-encoding"] || "";
    const supportsGzip = acceptEncoding.includes("gzip");

    return next.handle().pipe(
      map((data) => {
        // 응답 데이터 크기 추정
        const dataSize = JSON.stringify(data).length;

        // 압축 권장 헤더 추가
        if (supportsGzip && dataSize > this.compressionThreshold) {
          response.setHeader("X-Content-Uncompressed-Size", dataSize.toString());
        }

        return data;
      })
    );
  }
}
