import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { HouseholdMemberService } from '../../../../domain/household/household-member.service';
import { HouseholdMemberResult } from '../../interfaces/household-context.interface';

export class AddMemberCommand {
  constructor(
    public readonly householdId: string,
    public readonly userId: string,
    public readonly role: 'admin' | 'editor' | 'viewer',
  ) {}
}

@CommandHandler(AddMemberCommand)
export class AddMemberHandler implements ICommandHandler<AddMemberCommand> {
  constructor(
    private readonly householdMemberService: HouseholdMemberService,
  ) {}

  async execute(command: AddMemberCommand): Promise<HouseholdMemberResult> {
    const existing = await this.householdMemberService.멤버를_조회한다(
      command.userId,
      command.householdId,
    );
    if (existing) {
      throw new ConflictException('이미 해당 거점의 멤버입니다');
    }

    const member = await this.householdMemberService.멤버를_추가한다({
      userId: command.userId,
      householdId: command.householdId,
      role: command.role,
    });

    const members =
      await this.householdMemberService.거점의_멤버_목록을_조회한다(
        command.householdId,
      );
    const savedMember = members.find((m) => m.id === member.id);

    return {
      id: member.id,
      userId: member.userId,
      email: savedMember?.user?.email ?? '',
      displayName: savedMember?.user?.displayName ?? '',
      role: member.role,
      createdAt: member.createdAt,
    };
  }
}
