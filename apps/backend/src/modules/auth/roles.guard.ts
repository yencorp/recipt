import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, ORG_ROLES_KEY } from "./roles.decorator";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator";
import { UserRole } from "../../entities/user.entity";
import { OrganizationRole } from "../../entities/user-organization.entity";

@Injectable()
export class RolesGuard implements CanActivate {
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

    // 요구되는 역할 정보 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredOrgRoles = this.reflector.getAllAndOverride<
      OrganizationRole[]
    >(ORG_ROLES_KEY, [context.getHandler(), context.getClass()]);

    // 역할 요구사항이 없으면 통과
    if (!requiredRoles && !requiredOrgRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("인증이 필요합니다.");
    }

    // 전역 역할 체크
    if (requiredRoles) {
      const hasRole = requiredRoles.some((role) => user.role === role);

      if (!hasRole) {
        throw new ForbiddenException(
          `이 작업을 수행할 권한이 없습니다. 필요한 역할: ${requiredRoles.join(", ")}`,
        );
      }
    }

    // 단체별 역할 체크
    if (requiredOrgRoles) {
      // organizationId가 요청 파라미터나 바디에 있어야 함
      const organizationId =
        request.params.organizationId ||
        request.body?.organizationId ||
        request.query?.organizationId;

      if (!organizationId) {
        throw new ForbiddenException(
          "단체 정보가 필요합니다. organizationId를 제공해주세요.",
        );
      }

      // 사용자의 단체 역할 확인
      const userOrg = user.organizations?.find(
        (org: any) => org.organizationId === organizationId,
      );

      if (!userOrg) {
        throw new ForbiddenException("해당 단체의 멤버가 아닙니다.");
      }

      const hasOrgRole = requiredOrgRoles.some(
        (role) => userOrg.role === role,
      );

      if (!hasOrgRole) {
        throw new ForbiddenException(
          `이 작업을 수행할 단체 내 권한이 없습니다. 필요한 역할: ${requiredOrgRoles.join(", ")}`,
        );
      }
    }

    return true;
  }
}
