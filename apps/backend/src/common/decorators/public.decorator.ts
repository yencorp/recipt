import { SetMetadata } from "@nestjs/common";

/**
 * Public 데코레이터
 * API 키 인증을 건너뛸 엔드포인트에 사용
 */
export const Public = () => SetMetadata("isPublic", true);
