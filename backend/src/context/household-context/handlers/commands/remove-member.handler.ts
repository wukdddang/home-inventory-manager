import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HouseholdMemberService } from '../../../../domain/household/household-member.service';

export class RemoveMemberCommand {
  constructor(
    public readonly memberId: string,
    public readonly requestingUserId: string,
  ) {}
}

@CommandHandler(RemoveMemberCommand)
export class RemoveMemberHandler
  implements ICommandHandler<RemoveMemberCommand>
{
  constructor(
    private readonly householdMemberService: HouseholdMemberService,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
    const member = await this.householdMemberService.ID로_멤버를_조회한다(
      command.memberId,
    );
    if (!member) {
      throw new NotFoundException('멤버를 찾을 수 없습니다');
    }

    if (member.userId === command.requestingUserId) {
      throw new BadRequestException('자기 자신을 제거할 수 없습니다');
    }

    await this.householdMemberService.멤버를_삭제한다(member.id);
  }
}
