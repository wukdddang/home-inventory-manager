import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  RevokeInvitationHandler,
  RevokeInvitationCommand,
} from '@context/invitation-context/handlers/commands/revoke-invitation.handler';
import { HouseholdInvitationService } from '@domain/household-invitation/household-invitation.service';
import { HouseholdInvitation } from '@domain/household-invitation/household-invitation.entity';

describe('RevokeInvitationHandler', () => {
  let handler: RevokeInvitationHandler;
  let invitationService: jest.Mocked<HouseholdInvitationService>;

  const mockInvitationService = {
    ID로_초대를_조회한다: jest.fn(),
    초대를_저장한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevokeInvitationHandler,
        {
          provide: HouseholdInvitationService,
          useValue: mockInvitationService,
        },
      ],
    }).compile();

    handler = module.get<RevokeInvitationHandler>(RevokeInvitationHandler);
    invitationService = module.get(HouseholdInvitationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('pending 초대를 revoked로 변경해야 한다', async () => {
    // Given
    const command = new RevokeInvitationCommand('inv-1', 'household-1');
    const mockInvitation = {
      id: 'inv-1',
      householdId: 'household-1',
      status: 'pending',
    } as HouseholdInvitation;

    mockInvitationService.ID로_초대를_조회한다.mockResolvedValue(
      mockInvitation,
    );
    mockInvitationService.초대를_저장한다.mockResolvedValue({
      ...mockInvitation,
      status: 'revoked',
    } as HouseholdInvitation);

    // When
    await handler.execute(command);

    // Then
    expect(mockInvitation.status).toBe('revoked');
    expect(invitationService.초대를_저장한다).toHaveBeenCalledWith(
      mockInvitation,
    );
  });

  it('초대가 없으면 NotFoundException을 던져야 한다', async () => {
    const command = new RevokeInvitationCommand('inv-999', 'household-1');
    mockInvitationService.ID로_초대를_조회한다.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('다른 거점의 초대이면 NotFoundException을 던져야 한다', async () => {
    const command = new RevokeInvitationCommand('inv-1', 'household-2');
    mockInvitationService.ID로_초대를_조회한다.mockResolvedValue({
      id: 'inv-1',
      householdId: 'household-1',
      status: 'pending',
    } as HouseholdInvitation);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('pending이 아닌 초대는 BadRequestException을 던져야 한다', async () => {
    const command = new RevokeInvitationCommand('inv-1', 'household-1');
    mockInvitationService.ID로_초대를_조회한다.mockResolvedValue({
      id: 'inv-1',
      householdId: 'household-1',
      status: 'accepted',
    } as HouseholdInvitation);

    await expect(handler.execute(command)).rejects.toThrow(
      BadRequestException,
    );
  });
});
