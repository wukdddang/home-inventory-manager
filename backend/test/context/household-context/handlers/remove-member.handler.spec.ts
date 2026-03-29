import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  RemoveMemberHandler,
  RemoveMemberCommand,
} from '@context/household-context/handlers/commands/remove-member.handler';
import { HouseholdMemberService } from '@domain/household/household-member.service';
import { HouseholdMember } from '@domain/household/household-member.entity';

describe('RemoveMemberHandler', () => {
  let handler: RemoveMemberHandler;
  let householdMemberService: jest.Mocked<HouseholdMemberService>;

  const mockHouseholdMemberService = {
    ID로_멤버를_조회한다: jest.fn(),
    멤버를_삭제한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveMemberHandler,
        {
          provide: HouseholdMemberService,
          useValue: mockHouseholdMemberService,
        },
      ],
    }).compile();

    handler = module.get<RemoveMemberHandler>(RemoveMemberHandler);
    householdMemberService = module.get(HouseholdMemberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('멤버를 제거해야 한다', async () => {
      // Given
      const command = new RemoveMemberCommand('member-1', 'user-requester');

      const mockMember = {
        id: 'member-1',
        userId: 'user-target',
        householdId: 'household-1',
        role: 'editor',
      } as HouseholdMember;

      mockHouseholdMemberService.ID로_멤버를_조회한다.mockResolvedValue(
        mockMember,
      );
      mockHouseholdMemberService.멤버를_삭제한다.mockResolvedValue(true);

      // When
      await handler.execute(command);

      // Then
      expect(householdMemberService.ID로_멤버를_조회한다).toHaveBeenCalledWith(
        'member-1',
      );
      expect(householdMemberService.멤버를_삭제한다).toHaveBeenCalledWith(
        'member-1',
      );
    });

    it('자기 자신을 제거하면 BadRequestException을 던져야 한다', async () => {
      // Given
      const command = new RemoveMemberCommand('member-1', 'user-1');

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

    it('멤버가 없으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const command = new RemoveMemberCommand('member-1', 'user-requester');

      mockHouseholdMemberService.ID로_멤버를_조회한다.mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
