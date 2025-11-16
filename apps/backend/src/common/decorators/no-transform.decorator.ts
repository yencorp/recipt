import { SetMetadata } from "@nestjs/common";

/**
 * NoTransform 데코레이터
 * 응답 변환을 건너뛰고 원본 응답 반환
 */
export const NoTransform = () => SetMetadata("noTransform", true);
