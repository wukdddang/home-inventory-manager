import { Injectable } from '@nestjs/common';
import { HouseholdContextService } from '../../context/household-context/household-context.service';
import {
  AddMemberData,
  ChangeMemberRoleData,
  CreateHouseholdData,
  HouseholdMemberResult,
  HouseholdResult,
  UpdateHouseholdData,
} from '../../context/household-context/interfaces/household-context.interface';

@Injectable()
export class HouseholdBusinessService {
  constructor(
    private readonly householdContextService: HouseholdContextService,
  ) {}

  async 거점을_생성한다(data: CreateHouseholdData): Promise<HouseholdResult> {
    return this.householdContextService.거점을_생성한다(data);
  }

  async 거점_목록을_조회한다(userId: string): Promise<HouseholdResult[]> {
    return this.householdContextService.거점_목록을_조회한다(userId);
  }

  async 거점_상세를_조회한다(id: string): Promise<HouseholdResult> {
    return this.householdContextService.거점_상세를_조회한다(id);
  }

  async 거점을_수정한다(
    id: string,
    data: UpdateHouseholdData,
  ): Promise<HouseholdResult> {
    return this.householdContextService.거점을_수정한다(id, data);
  }

  async 거점을_삭제한다(id: string): Promise<void> {
    return this.householdContextService.거점을_삭제한다(id);
  }

  async 멤버_목록을_조회한다(
    householdId: string,
  ): Promise<HouseholdMemberResult[]> {
    return this.householdContextService.멤버_목록을_조회한다(householdId);
  }

  async 멤버를_추가한다(
    data: AddMemberData,
  ): Promise<HouseholdMemberResult> {
    return this.householdContextService.멤버를_추가한다(data);
  }

  async 멤버_역할을_변경한다(
    memberId: string,
    requestingUserId: string,
    data: ChangeMemberRoleData,
  ): Promise<void> {
    return this.householdContextService.멤버_역할을_변경한다(
      memberId,
      requestingUserId,
      data,
    );
  }

  async 멤버를_제거한다(
    memberId: string,
    requestingUserId: string,
  ): Promise<void> {
    return this.householdContextService.멤버를_제거한다(
      memberId,
      requestingUserId,
    );
  }
}
