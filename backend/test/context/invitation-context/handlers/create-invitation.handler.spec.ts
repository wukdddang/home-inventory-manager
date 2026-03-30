import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateInvitationHandler,
  CreateInvitationCommand,
} from '@context/invitation-context/handlers/commands/create-invitation.handler';
import { HouseholdInvitationService } from '@domain/household-invitation/household-invitation.service';
import { HouseholdInvitation } from '@domain/household-invitation/household-invitation.entity';

describe('CreateInvitationHandler', () => {
  let handler: CreateInvitationHandler;
  let invitationService: jest.Mocked<HouseholdInvitationService>;

  const mockInvitationService = {
    초대를_생성한다: jest.fn(),
    토큰으로_초대를_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateInvitationHandler,
        {
          provide: HouseholdInvitationService,
          useValue: mockInvitationService,
        },
      ],
    }).compile();

    handler = module.get<CreateInvitationHandler>(CreateInvitationHandler);
    invitationService = module.get(HouseholdInvitationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('초대를 생성하고 결과를 반환해야 한다', async () => {
    // Given
    const command = new CreateInvitationCommand(
      'household-1',
      'user-1',
      'editor',
      null,
      7,
    );

    const mockCreated = {
      id: 'inv-1',
      householdId: 'household-1',
      invitedByUserId: 'user-1',
      role: 'editor',
      token: 'generated-token',
      status: 'pending',
      inviteeEmail: null,
      acceptedByUserId: null,
      acceptedAt: null,
      expiresAt: new Date('2026-04-06'),
      createdAt: new Date(),
    } as HouseholdInvitation;

    const mockWithRelations = {
      ...mockCreated,
      household: { name: '우리집' },
      invitedByUser: { displayName: '사용자1' },
    } as unknown as HouseholdInvitation;

    mockInvitationService.초대를_생성한다.mockResolvedValue(mockCreated);
    mockInvitationService.토큰으로_초대를_조회한다.mockResolvedValue(
      mockWithRelations,
    );

    // When
    const result = await handler.execute(command);

    // Then
    expect(invitationService.초대를_생성한다).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId: 'household-1',
        invitedByUserId: 'user-1',
        role: 'editor',
        inviteeEmail: null,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'inv-1',
        householdId: 'household-1',
        householdName: '우리집',
        invitedByDisplayName: '사용자1',
        role: 'editor',
        status: 'pending',
      }),
    );
  });

  it('이메일 초대를 생성해야 한다', async () => {
    // Given
    const command = new CreateInvitationCommand(
      'household-1',
      'user-1',
      'viewer',
      'invited@example.com',
      14,
    );

    const mockCreated = {
      id: 'inv-2',
      householdId: 'household-1',
      invitedByUserId: 'user-1',
      role: 'viewer',
      token: 'token-2',
      status: 'pending',
      inviteeEmail: 'invited@example.com',
      acceptedByUserId: null,
      acceptedAt: null,
      expiresAt: new Date('2026-04-13'),
      createdAt: new Date(),
    } as HouseholdInvitation;

    const mockWithRelations = {
      ...mockCreated,
      household: { name: '우리집' },
      invitedByUser: { displayName: '사용자1' },
    } as unknown as HouseholdInvitation;

    mockInvitationService.초대를_생성한다.mockResolvedValue(mockCreated);
    mockInvitationService.토큰으로_초대를_조회한다.mockResolvedValue(
      mockWithRelations,
    );

    // When
    const result = await handler.execute(command);

    // Then
    expect(result.inviteeEmail).toBe('invited@example.com');
    expect(result.role).toBe('viewer');
  });
});
