import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AcceptInvitationHandler,
  AcceptInvitationCommand,
} from '@context/invitation-context/handlers/commands/accept-invitation.handler';
import { HouseholdInvitationService } from '@domain/household-invitation/household-invitation.service';
import { HouseholdMemberService } from '@domain/household/household-member.service';
import { HouseholdInvitation } from '@domain/household-invitation/household-invitation.entity';
import { HouseholdMember } from '@domain/household/household-member.entity';

describe('AcceptInvitationHandler', () => {
  let handler: AcceptInvitationHandler;
  let invitationService: jest.Mocked<HouseholdInvitationService>;
  let memberService: jest.Mocked<HouseholdMemberService>;

  const mockInvitationService = {
    토큰으로_초대를_조회한다: jest.fn(),
    초대를_저장한다: jest.fn(),
  };

  const mockMemberService = {
    멤버를_조회한다: jest.fn(),
    멤버를_추가한다: jest.fn(),
  };

  const futureDate = new Date('2099-12-31');
  const pastDate = new Date('2020-01-01');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptInvitationHandler,
        {
          provide: HouseholdInvitationService,
          useValue: mockInvitationService,
        },
        {
          provide: HouseholdMemberService,
          useValue: mockMemberService,
        },
      ],
    }).compile();

    handler = module.get<AcceptInvitationHandler>(AcceptInvitationHandler);
    invitationService = module.get(HouseholdInvitationService);
    memberService = module.get(HouseholdMemberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('초대를 수락하고 멤버를 추가해야 한다', async () => {
    // Given
    const command = new AcceptInvitationCommand(
      'token-1',
      'user-2',
      'user2@example.com',
    );
    const mockInvitation = {
      id: 'inv-1',
      householdId: 'household-1',
      role: 'editor',
      token: 'token-1',
      status: 'pending',
      inviteeEmail: null,
      expiresAt: futureDate,
    } as HouseholdInvitation;

    mockInvitationService.토큰으로_초대를_조회한다.mockResolvedValue(
      mockInvitation,
    );
    mockMemberService.멤버를_조회한다.mockResolvedValue(null);
    mockMemberService.멤버를_추가한다.mockResolvedValue({} as HouseholdMember);
    mockInvitationService.초대를_저장한다.mockResolvedValue(
      mockInvitation,
    );

    // When
    await handler.execute(command);

    // Then
    expect(memberService.멤버를_추가한다).toHaveBeenCalledWith({
      userId: 'user-2',
      householdId: 'household-1',
      role: 'editor',
    });
    expect(mockInvitation.status).toBe('accepted');
    expect(mockInvitation.acceptedByUserId).toBe('user-2');
    expect(mockInvitation.acceptedAt).toBeInstanceOf(Date);
  });

  it('초대가 없으면 NotFoundException을 던져야 한다', async () => {
    const command = new AcceptInvitationCommand(
      'bad-token',
      'user-2',
      'user2@example.com',
    );
    mockInvitationService.토큰으로_초대를_조회한다.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('만료된 초대는 BadRequestException을 던져야 한다', async () => {
    const command = new AcceptInvitationCommand(
      'token-1',
      'user-2',
      'user2@example.com',
    );
    const mockInvitation = {
      status: 'pending',
      expiresAt: pastDate,
    } as HouseholdInvitation;

    mockInvitationService.토큰으로_초대를_조회한다.mockResolvedValue(
      mockInvitation,
    );
    mockInvitationService.초대를_저장한다.mockResolvedValue(mockInvitation);

    await expect(handler.execute(command)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockInvitation.status).toBe('expired');
  });

  it('이미 처리된 초대는 BadRequestException을 던져야 한다', async () => {
    const command = new AcceptInvitationCommand(
      'token-1',
      'user-2',
      'user2@example.com',
    );
    mockInvitationService.토큰으로_초대를_조회한다.mockResolvedValue({
      status: 'accepted',
      expiresAt: futureDate,
    } as HouseholdInvitation);

    await expect(handler.execute(command)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('이메일 초대에서 다른 이메일이면 ForbiddenException을 던져야 한다', async () => {
    const command = new AcceptInvitationCommand(
      'token-1',
      'user-2',
      'wrong@example.com',
    );
    mockInvitationService.토큰으로_초대를_조회한다.mockResolvedValue({
      status: 'pending',
      inviteeEmail: 'correct@example.com',
      expiresAt: futureDate,
    } as HouseholdInvitation);

    await expect(handler.execute(command)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('이미 멤버이면 ConflictException을 던져야 한다', async () => {
    const command = new AcceptInvitationCommand(
      'token-1',
      'user-2',
      'user2@example.com',
    );
    mockInvitationService.토큰으로_초대를_조회한다.mockResolvedValue({
      householdId: 'household-1',
      status: 'pending',
      inviteeEmail: null,
      expiresAt: futureDate,
    } as HouseholdInvitation);
    mockMemberService.멤버를_조회한다.mockResolvedValue({
      id: 'existing-member',
    } as HouseholdMember);

    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
  });
});
