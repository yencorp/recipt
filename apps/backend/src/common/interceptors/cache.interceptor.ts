import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { Reflector } from "@nestjs/core";

/**
 * 캐시 인터셉터
 * Redis 기반 응답 캐싱
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    // 캐시 키 및 TTL 가져오기
    const cacheKey = this.reflector.get<string>(
      "cacheKey",
      context.getHandler()
    );
    const cacheTTL = this.reflector.get<number>(
      "cacheTTL",
      context.getHandler()
    );

    // 캐시 설정이 없으면 바로 실행
    if (!cacheKey) {
      return next.handle();
    }

    // 요청 정보로 고유한 캐시 키 생성
    const request = context.switchToHttp().getRequest();
    const fullCacheKey = this.generateCacheKey(cacheKey, request);

    // 캐시에서 값 조회
    const cachedValue = await this.cacheManager.get(fullCacheKey);
    if (cachedValue) {
      // 캐시 히트
      return of(cachedValue);
    }

    // 캐시 미스 - 실행 후 캐시에 저장
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(
          fullCacheKey,
          response,
          cacheTTL || 3600 // 기본 1시간
        );
      })
    );
  }

  /**
   * 요청 정보를 포함한 고유한 캐시 키 생성
   */
  private generateCacheKey(baseKey: string, request: any): string {
    const { method, url, query, params, user } = request;
    const userId = user?.id || "anonymous";

    // 쿼리 파라미터와 URL 파라미터를 포함한 캐시 키
    const queryString = Object.keys(query || {})
      .sort()
      .map((key) => `${key}=${query[key]}`)
      .join("&");

    const paramsString = Object.keys(params || {})
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    return `${baseKey}:${method}:${url}:${userId}:${queryString}:${paramsString}`;
  }
}
