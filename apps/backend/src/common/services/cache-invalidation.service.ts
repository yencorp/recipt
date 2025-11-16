import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

/**
 * 캐시 무효화 서비스
 * 데이터 변경 시 관련 캐시를 삭제
 */
@Injectable()
export class CacheInvalidationService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 특정 패턴의 캐시 키 삭제
   * @param pattern - 캐시 키 패턴 (예: "events:*")
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Redis store의 경우 패턴 매칭 삭제 지원
    const store = this.cacheManager.store as any;

    if (store.keys) {
      // cache-manager-redis-store의 경우
      const keys = await store.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
      }
    } else {
      // 폴백: 수동으로 주요 키 삭제
      await this.invalidateKnownKeys(pattern);
    }
  }

  /**
   * 단일 캐시 키 삭제
   * @param key - 캐시 키
   */
  async invalidateKey(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * 여러 캐시 키 삭제
   * @param keys - 캐시 키 배열
   */
  async invalidateKeys(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }

  /**
   * 전체 캐시 초기화
   */
  async invalidateAll(): Promise<void> {
    await this.cacheManager.reset();
  }

  /**
   * 엔티티별 캐시 무효화
   */
  async invalidateEvents(): Promise<void> {
    await this.invalidatePattern("events:*");
  }

  async invalidateBudgets(): Promise<void> {
    await this.invalidatePattern("budgets:*");
  }

  async invalidateSettlements(): Promise<void> {
    await this.invalidatePattern("settlements:*");
  }

  async invalidateOrganizations(): Promise<void> {
    await this.invalidatePattern("organizations:*");
  }

  async invalidateUsers(): Promise<void> {
    await this.invalidatePattern("users:*");
  }

  async invalidateReceipts(): Promise<void> {
    await this.invalidatePattern("receipts:*");
  }

  async invalidatePosts(): Promise<void> {
    await this.invalidatePattern("posts:*");
  }

  /**
   * 폴백: 알려진 캐시 키 패턴 삭제
   */
  private async invalidateKnownKeys(pattern: string): Promise<void> {
    const baseKey = pattern.replace(":*", "");
    const commonSuffixes = [
      ":list",
      ":detail",
      ":GET",
      ":POST",
      ":PATCH",
      ":DELETE",
    ];

    const keysToDelete = commonSuffixes.map((suffix) => `${baseKey}${suffix}`);
    await this.invalidateKeys(keysToDelete);
  }
}
