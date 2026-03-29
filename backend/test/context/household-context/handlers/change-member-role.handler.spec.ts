import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ChangeMemberRoleHandler,
  ChangeMemberRoleCommand,
} from '@context/household-context/handlers/commands/change-member-role.handler';
import { HouseholdMemberService } from '@domain/household/household-member.service';
import { HouseholdMember } from '@domain/household/household-member.entity';

describe('ChangeMemberRoleHandler', () => {
  let handler: ChangeMemberRoleHandler;
  let householdMemberService: jest.Mocked<HouseholdMemberService>;

  const mockHouseholdMemberService = {
    ID로_멤버를_조회한다: jest.fn(),
    거점의_admin_수를_조회한다: jest.fn(),
    멤버를_저장한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeMemberRoleHandler,
        {
          provide: HouseholdMemberService,
          useValue: mockHouseholdMemberService,
        },
      ],
    }).compile();

    handler = module.get<ChangeMemberRoleHandler>(ChangeMemberRoleHandler);
    householdMemberService = module.get(HouseholdMemberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('멤버의 역할을 변경해야 한다', async () => {
      // Given
      const command = new ChangeMemberRoleCommand(
        'member-1',
        'user-requester',
        'viewer',
      );

      const mockMember = {
        id: 'member-1',
        userId: 'user-target',
        householdId: 'household-1',
        role: 'editor',
      } as HouseholdMember;

      mockHouseholdMemberService.ID로_멤버를_조회한다.mockResolvedValue(
        mockMember,
      );
      mockHouseholdMemberService.멤버를_저장한다.mockResolvedValue(mockMember);

      // When
      await handler.execute(command);

      // Then
      expect(householdMemberService.ID로_멤버를_조회한다).toHaveBeenCalledWith(
        'member-1',
      );
      expect(householdMemberService.멤버를_저장한다).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'viewer' }),
      );
    });

    it('자기 자신의 역할을 변경하면 BadRequestException을 던져야 한다', async () => {
      // Given
      const command = new ChangeMemberRoleCommand(
        'member-1',
        'user-1',
        'viewer',
      );

      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        householdId: 'household-1',
        role: 'admin',
      } as HouseholdMember;

      mockHouseholdMemberService.ID로_멤버를_조회한다.mockResolvedValue(
        mockMember,
      );

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('마지막 admin의 역할을 변경하면 BadRequestException을 던져야 한다', async () => {
      // Given
      const command = new ChangeMemberRoleCommand(
        'member-1',
        'user-requester',
        'editor',
      );

      const mockMember = {
        id: 'member-1',
        userId: 'user-target',
        householdId: 'household-1',
        role: 'admin',
      } as HouseholdMember;

      mockHouseholdMemberService.ID로_멤버를_조회한다.mockResolvedValue(
        mockMember,
      );
      mockHouseholdMemberService.거점의_admin_수를_조회한다.mockResolvedValue(1);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('멤버가 없으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const command = new ChangeMemberRoleCommand(
        'member-1',
        'user-requester',
        'viewer',
      );

      mockHouseholdMemberService.ID로_멤버를_조회한다.mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
