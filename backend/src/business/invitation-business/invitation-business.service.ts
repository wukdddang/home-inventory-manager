import { Injectable } from '@nestjs/common';
import { InvitationContextService } from '../../context/invitation-context/invitation-context.service';
import {
  CreateInvitationData,
  InvitationResult,
} from '../../context/invitation-context/interfaces/invitation-context.interface';

@Injectable()
export class InvitationBusinessService {
  constructor(
    private readonly invitationContextService: InvitationContextService,
  ) {}

  async 초대를_생성한다(
    data: CreateInvitationData,
  ): Promise<InvitationResult> {
    return this.invitationContextService.초대를_생성한다(data);
  }

  async 초대_목록을_조회한다(
    householdId: string,
  ): Promise<InvitationResult[]> {
    return this.invitationContextService.초대_목록을_조회한다(householdId);
  }

  async 토큰으로_초대를_조회한다(
    token: string,
  ): Promise<InvitationResult> {
    return this.invitationContextService.토큰으로_초대를_조회한다(token);
  }

  async 초대를_취소한다(
    invitationId: string,
    householdId: string,
  ): Promise<void> {
    return this.invitationContextService.초대를_취소한다(
      invitationId,
      householdId,
    );
  }

  async 초대를_수락한다(
    token: string,
    userId: string,
    userEmail: string,
  ): Promise<void> {
    return this.invitationContextService.초대를_수락한다(
      token,
      userId,
      userEmail,
    );
  }
}
