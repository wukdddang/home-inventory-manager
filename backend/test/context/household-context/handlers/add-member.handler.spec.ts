import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import {
  AddMemberHandler,
  AddMemberCommand,
} from '@context/household-context/handlers/commands/add-member.handler';
import { HouseholdMemberService } from '@domain/household/household-member.service';
import { HouseholdMember } from '@domain/household/household-member.entity';

describe('AddMemberHandler', () => {
  let handler: AddMemberHandler;
  let householdMemberService: jest.Mocked<HouseholdMemberService>;

  const mockHouseholdMemberService = {
    멤버를_조회한다: jest.fn(),
    멤버를_추가한다: jest.fn(),
    거점의_멤버_목록을_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddMemberHandler,
        {
          provide: HouseholdMemberService,
          useValue: mockHouseholdMemberService,
        },
      ],
    }).compile();

    handler = module.get<AddMemberHandler>(AddMemberHandler);
    householdMemberService = module.get(HouseholdMemberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('멤버를 추가해야 한다', async () => {
      // Given
      const command = new AddMemberCommand('household-1', 'user-2', 'editor');

      const mockMember = {
        id: 'member-2',
        userId: 'user-2',
        householdId: 'household-1',
        role: 'editor',
        createdAt: new Date(),
      } as HouseholdMember;

      const mockMemberWithUser = {
        ...mockMember,
        user: {
          email: 'user2@example.com',
          displayName: '사용자2',
        },
      } as unknown as HouseholdMember;

      mockHouseholdMemberService.멤버를_조회한다.mockResolvedValue(null);
      mockHouseholdMemberService.멤버를_추가한다.mockResolvedValue(mockMember);
      mockHouseholdMemberService.거점의_멤버_목록을_조회한다.mockResolvedValue([
        mockMemberWithUser,
      ]);

      // When
      const result = await handler.execute(command);

      // Then
      expect(householdMemberService.멤버를_조회한다).toHaveBeenCalledWith(
        'user-2',
        'household-1',
      );
      expect(householdMemberService.멤버를_추가한다).toHaveBeenCalledWith({
        userId: 'user-2',
        householdId: 'household-1',
        role: 'editor',
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'member-2',
          userId: 'user-2',
          role: 'editor',
        }),
      );
    });

    it('이미 멤버이면 ConflictException을 던져야 한다', async () => {
      // Given
      const command = new AddMemberCommand('household-1', 'user-2', 'editor');
      mockHouseholdMemberService.멤버를_조회한다.mockResolvedValue({
        id: 'member-2',
      } as HouseholdMember);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
