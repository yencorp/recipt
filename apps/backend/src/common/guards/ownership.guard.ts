import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "../../entities/user.entity";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * 리소스 소유권을 검증하는 가드
 * - 사용자가 자신의 데이터만 수정/삭제할 수 있도록 보장
 * - SUPER_ADMIN은 모든 리소스에 접근 가능
 * - 단체 데이터는 해당 단체 멤버만 접근 가능
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Public 데코레이터가 있으면 통과
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("인증이 필요합니다.");
    }

    // SUPER_ADMIN은 모든 리소스에 접근 가능
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // userId 파라미터가 있는 경우 (사용자 프로필 등)
    const targetUserId = request.params.userId || request.params.id;
    if (targetUserId) {
      // 본인의 데이터만 접근 가능
      if (targetUserId !== user.id) {
        throw new ForbiddenException("본인의 데이터만 수정/조회할 수 있습니다.");
      }
      return true;
    }

    // organizationId가 있는 경우 (단체 관련 리소스)
    const organizationId =
      request.params.organizationId ||
      request.body?.organizationId ||
      request.query?.organizationId;

    if (organizationId) {
      // 사용자가 해당 단체의 멤버인지 확인
      const isMember = user.organizations?.some(
        (org: any) =>
          org.organizationId === organizationId &&
          org.status === "ACTIVE", // ACTIVE 상태인 멤버만
      );

      if (!isMember) {
        throw new ForbiddenException(
          "해당 단체의 활성 멤버만 접근할 수 있습니다.",
        );
      }

      return true;
    }

    // 특정 리소스 소유권 체크가 필요한 경우
    // 각 컨트롤러에서 추가 검증 로직을 구현해야 함
    return true;
  }
}

/**
 * 리소스 소유권 검증을 위한 데코레이터
 */
import { SetMetadata } from "@nestjs/common";

export const OWNERSHIP_CHECK_KEY = "ownershipCheck";
export const CheckOwnership = () => SetMetadata(OWNERSHIP_CHECK_KEY, true);
