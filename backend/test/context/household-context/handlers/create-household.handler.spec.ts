import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateHouseholdHandler,
  CreateHouseholdCommand,
} from '@context/household-context/handlers/commands/create-household.handler';
import { HouseholdService } from '@domain/household/household.service';
import { HouseholdMemberService } from '@domain/household/household-member.service';
import { Household } from '@domain/household/household.entity';
import { HouseholdMember } from '@domain/household/household-member.entity';

describe('CreateHouseholdHandler', () => {
  let handler: CreateHouseholdHandler;
  let householdService: jest.Mocked<HouseholdService>;
  let householdMemberService: jest.Mocked<HouseholdMemberService>;

  const mockHouseholdService = {
    거점을_생성한다: jest.fn(),
  };

  const mockHouseholdMemberService = {
    멤버를_추가한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateHouseholdHandler,
        { provide: HouseholdService, useValue: mockHouseholdService },
        {
          provide: HouseholdMemberService,
          useValue: mockHouseholdMemberService,
        },
      ],
    }).compile();

    handler = module.get<CreateHouseholdHandler>(CreateHouseholdHandler);
    householdService = module.get(HouseholdService);
    householdMemberService = module.get(HouseholdMemberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('거점을 생성하고 생성자를 admin 멤버로 등록해야 한다', async () => {
      // Given
      const command = new CreateHouseholdCommand('user-1', '우리집', 'house');

      const mockHousehold = {
        id: 'household-1',
        name: '우리집',
        kind: 'house',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Household;

      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        householdId: 'household-1',
        role: 'admin',
      } as HouseholdMember;

      mockHouseholdService.거점을_생성한다.mockResolvedValue(mockHousehold);
      mockHouseholdMemberService.멤버를_추가한다.mockResolvedValue(mockMember);

      // When
      const result = await handler.execute(command);

      // Then
      expect(householdService.거점을_생성한다).toHaveBeenCalledWith({
        name: '우리집',
        kind: 'house',
      });
      expect(householdMemberService.멤버를_추가한다).toHaveBeenCalledWith({
        userId: 'user-1',
        householdId: 'household-1',
        role: 'admin',
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'household-1',
          name: '우리집',
          kind: 'house',
        }),
      );
    });
  });
});
