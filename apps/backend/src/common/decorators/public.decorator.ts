import { SetMetadata } from "@nestjs/common";

/**
 * Public 데코레이터
 * API 키 인증을 건너뛸 엔드포인트에 사용
 */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
