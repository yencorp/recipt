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
import { Event } from "../../entities/event.entity";
import { Budget } from "../../entities/budget.entity";
import { Settlement } from "../../entities/settlement.entity";
import { UserRole } from "../../entities/user.entity";
import { OrganizationRole } from "../../entities/user-organization.entity";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * 행사 작성자 또는 조직 관리자만 접근 가능한 가드
 * - 행사 작성자 (Event.createdById)
 * - 조직 관리자 (OrganizationRole.ADMIN)
 * - SUPER_ADMIN은 항상 접근 가능
 */
@Injectable()
export class EventCreatorOrOrgAdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>
  ) {}

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

    // SUPER_ADMIN은 항상 접근 가능
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // eventId 추출 (body, params, query 모두 확인)
    let eventId =
      request.body?.eventId ||
      request.params?.eventId ||
      request.query?.eventId;

    // Budget/Settlement 수정/삭제의 경우 id로 조회해서 eventId 찾기
    if (!eventId && request.params?.id) {
      const resourceId = request.params.id;
      const path = request.route.path;

      if (path.includes("/budgets/")) {
        const budget = await this.budgetRepository.findOne({
          where: { id: resourceId },
          relations: ["event"],
        });
        if (budget) {
          eventId = budget.eventId;
        }
      } else if (path.includes("/settlements/")) {
        const settlement = await this.settlementRepository.findOne({
          where: { id: resourceId },
          relations: ["event"],
        });
        if (settlement) {
          eventId = settlement.eventId;
        }
      }
    }

    if (!eventId) {
      throw new ForbiddenException(
        "행사 정보가 필요합니다. eventId를 제공해주세요."
      );
    }

    // 행사 조회
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("행사를 찾을 수 없습니다.");
    }

    // 1. 행사 작성자인지 확인
    if (event.createdById === user.id) {
      return true;
    }

    // 2. 조직 관리자인지 확인
    const userOrg = user.organizations?.find(
      (org: any) => org.organizationId === event.organizationId
    );

    if (userOrg && userOrg.role === OrganizationRole.ADMIN) {
      return true;
    }

    throw new ForbiddenException(
      "이 작업을 수행할 권한이 없습니다. 행사 작성자 또는 조직 관리자만 접근할 수 있습니다."
    );
  }
}
