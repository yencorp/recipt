import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    // @Public() 데코레이터가 있는 경우 인증 건너뛰기
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // JWT 토큰이 없거나 유효하지 않은 경우
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      // Authorization 헤더가 없는 경우
      if (!authHeader) {
        throw new UnauthorizedException("인증 토큰이 필요합니다.");
      }

      // 토큰 형식이 잘못된 경우
      if (!authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedException(
          "Bearer 토큰 형식이 아닙니다. 'Bearer {token}' 형식으로 전송해주세요."
        );
      }

      // JWT 토큰이 유효하지 않거나 만료된 경우
      if (info?.name === "TokenExpiredError") {
        throw new UnauthorizedException("토큰이 만료되었습니다.");
      }

      if (info?.name === "JsonWebTokenError") {
        throw new UnauthorizedException("유효하지 않은 토큰입니다.");
      }

      if (info?.name === "NotBeforeError") {
        throw new UnauthorizedException("토큰이 아직 활성화되지 않았습니다.");
      }

      // 기타 인증 오류
      throw (
        err ||
        new UnauthorizedException(info?.message || "인증에 실패했습니다.")
      );
    }

    return user;
  }
}
