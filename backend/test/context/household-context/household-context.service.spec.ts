import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { HouseholdContextService } from '@context/household-context/household-context.service';
import { CreateHouseholdCommand } from '@context/household-context/handlers/commands/create-household.handler';
import { UpdateHouseholdCommand } from '@context/household-context/handlers/commands/update-household.handler';
import { DeleteHouseholdCommand } from '@context/household-context/handlers/commands/delete-household.handler';
import { AddMemberCommand } from '@context/household-context/handlers/commands/add-member.handler';
import { ChangeMemberRoleCommand } from '@context/household-context/handlers/commands/change-member-role.handler';
import { RemoveMemberCommand } from '@context/household-context/handlers/commands/remove-member.handler';
import { GetHouseholdListQuery } from '@context/household-context/handlers/queries/get-household-list.handler';
import { GetHouseholdDetailQuery } from '@context/household-context/handlers/queries/get-household-detail.handler';
import { GetMemberListQuery } from '@context/household-context/handlers/queries/get-member-list.handler';

describe('HouseholdContextService', () => {
  let service: HouseholdContextService;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockCommandBus = { execute: jest.fn() };
  const mockQueryBus = { execute: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdContextService,
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    service = module.get<HouseholdContextService>(HouseholdContextService);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('거점을_생성한다', () => {
    it('CreateHouseholdCommand를 실행해야 한다', async () => {
      // Given
      const data = { userId: 'user-1', name: '우리집', kind: 'house' };
      const mockResult = {
        id: 'household-1',
        name: '우리집',
        kind: 'house',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.거점을_생성한다(data);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateHouseholdCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('거점을_수정한다', () => {
    it('UpdateHouseholdCommand를 실행해야 한다', async () => {
      // Given
      const data = { name: '새 이름' };
      const mockResult = {
        id: 'household-1',
        name: '새 이름',
        kind: 'house',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.거점을_수정한다('household-1', data);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateHouseholdCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('거점을_삭제한다', () => {
    it('DeleteHouseholdCommand를 실행해야 한다', async () => {
      // Given
      mockCommandBus.execute.mockResolvedValue(undefined);

      // When
      await service.거점을_삭제한다('household-1');

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteHouseholdCommand),
      );
    });
  });

  describe('거점_목록을_조회한다', () => {
    it('GetHouseholdListQuery를 실행해야 한다', async () => {
      // Given
      const mockResult = [
        {
          id: 'household-1',
          name: '우리집',
          kind: 'house',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.거점_목록을_조회한다('user-1');

      // Then
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetHouseholdListQuery),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('거점_상세를_조회한다', () => {
    it('GetHouseholdDetailQuery를 실행해야 한다', async () => {
      // Given
      const mockResult = {
        id: 'household-1',
        name: '우리집',
        kind: 'house',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.거점_상세를_조회한다('household-1');

      // Then
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetHouseholdDetailQuery),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('멤버_목록을_조회한다', () => {
    it('GetMemberListQuery를 실행해야 한다', async () => {
      // Given
      const mockResult = [
        {
          id: 'member-1',
          userId: 'user-1',
          email: 'test@example.com',
          displayName: '테스트',
          role: 'admin',
          createdAt: new Date(),
        },
      ];
      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.멤버_목록을_조회한다('household-1');

      // Then
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetMemberListQuery),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('멤버를_추가한다', () => {
    it('AddMemberCommand를 실행해야 한다', async () => {
      // Given
      const data = {
        householdId: 'household-1',
        userId: 'user-2',
        role: 'editor' as const,
      };
      const mockResult = {
        id: 'member-2',
        userId: 'user-2',
        email: 'user2@example.com',
        displayName: '사용자2',
        role: 'editor',
        createdAt: new Date(),
      };
      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.멤버를_추가한다(data);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(AddMemberCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('멤버_역할을_변경한다', () => {
    it('ChangeMemberRoleCommand를 실행해야 한다', async () => {
      // Given
      mockCommandBus.execute.mockResolvedValue(undefined);

      // When
      await service.멤버_역할을_변경한다('member-1', 'user-requester', {
        role: 'viewer',
      });

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ChangeMemberRoleCommand),
      );
    });
  });

  describe('멤버를_제거한다', () => {
    it('RemoveMemberCommand를 실행해야 한다', async () => {
      // Given
      mockCommandBus.execute.mockResolvedValue(undefined);

      // When
      await service.멤버를_제거한다('member-1', 'user-requester');

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RemoveMemberCommand),
      );
    });
  });
});
