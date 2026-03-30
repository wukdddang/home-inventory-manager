import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateInvitationData,
  InvitationResult,
} from './interfaces/invitation-context.interface';
import { CreateInvitationCommand } from './handlers/commands/create-invitation.handler';
import { RevokeInvitationCommand } from './handlers/commands/revoke-invitation.handler';
import { AcceptInvitationCommand } from './handlers/commands/accept-invitation.handler';
import { GetInvitationListQuery } from './handlers/queries/get-invitation-list.handler';
import { GetInvitationByTokenQuery } from './handlers/queries/get-invitation-by-token.handler';

@Injectable()
export class InvitationContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 초대를_생성한다(
    data: CreateInvitationData,
  ): Promise<InvitationResult> {
    return this.commandBus.execute(
      new CreateInvitationCommand(
        data.householdId,
        data.invitedByUserId,
        data.role,
        data.inviteeEmail ?? null,
        data.expiresInDays ?? 7,
      ),
    );
  }

  async 초대_목록을_조회한다(
    householdId: string,
  ): Promise<InvitationResult[]> {
    return this.queryBus.execute(new GetInvitationListQuery(householdId));
  }

  async 토큰으로_초대를_조회한다(
    token: string,
  ): Promise<InvitationResult> {
    return this.queryBus.execute(new GetInvitationByTokenQuery(token));
  }

  async 초대를_취소한다(
    invitationId: string,
    householdId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RevokeInvitationCommand(invitationId, householdId),
    );
  }

  async 초대를_수락한다(
    token: string,
    userId: string,
    userEmail: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new AcceptInvitationCommand(token, userId, userEmail),
    );
  }
}
