import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";

/**
 * API 키 인증 가드
 * 외부 서비스 호출 시 사용 (선택적)
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 컨트롤러나 핸들러에 @Public() 데코레이터가 있으면 스킵
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException("API 키가 필요합니다.");
    }

    const validApiKeys = this.getValidApiKeys();

    if (!validApiKeys.includes(apiKey)) {
      throw new UnauthorizedException("유효하지 않은 API 키입니다.");
    }

    // API 키 정보를 요청 객체에 추가
    request["apiKeyInfo"] = {
      key: apiKey,
      validatedAt: new Date(),
    };

    return true;
  }

  /**
   * 요청에서 API 키 추출
   * 헤더 또는 쿼리 파라미터에서 확인
   */
  private extractApiKey(request: any): string | null {
    // X-API-Key 헤더에서 추출
    const headerKey = request.headers["x-api-key"];
    if (headerKey) {
      return headerKey;
    }

    // 쿼리 파라미터에서 추출 (덜 안전하지만 일부 클라이언트에서 필요)
    const queryKey = request.query?.api_key;
    if (queryKey) {
      return queryKey;
    }

    return null;
  }

  /**
   * 유효한 API 키 목록 가져오기
   */
  private getValidApiKeys(): string[] {
    const apiKeysString = this.configService.get<string>("API_KEYS");

    if (!apiKeysString) {
      return [];
    }

    // 콤마로 구분된 여러 API 키 지원
    return apiKeysString.split(",").map((key) => key.trim()).filter(Boolean);
  }
}
