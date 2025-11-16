import { SetMetadata } from "@nestjs/common";

/**
 * 캐시 키 데코레이터
 * 메서드에 캐시 키를 설정
 *
 * @param key - 캐시 키 (예: "events:list", "budgets:detail")
 */
export const CacheKey = (key: string) => SetMetadata("cacheKey", key);

/**
 * 캐시 TTL 데코레이터
 * 캐시 유지 시간(초) 설정
 *
 * @param ttl - Time to Live in seconds (기본: 3600초 = 1시간)
 */
export const CacheTTL = (ttl: number) => SetMetadata("cacheTTL", ttl);
