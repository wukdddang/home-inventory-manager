import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { HouseholdMemberService } from '../../../domain/household/household-member.service';

@Injectable()
export class HouseholdMemberGuard implements CanActivate {
  constructor(
    private readonly householdMemberService: HouseholdMemberService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const householdId =
      request.params?.householdId ?? request.params?.id;

    if (!userId || !householdId) {
      throw new ForbiddenException('거점 접근 권한이 없습니다');
    }

    const member = await this.householdMemberService.멤버를_조회한다(
      userId,
      householdId,
    );

    if (!member) {
      throw new ForbiddenException('해당 거점의 멤버가 아닙니다');
    }

    request.householdMember = member;
    return true;
  }
}
