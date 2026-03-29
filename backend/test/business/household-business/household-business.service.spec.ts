import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdBusinessService } from '@business/household-business/household-business.service';
import { HouseholdContextService } from '@context/household-context/household-context.service';

describe('HouseholdBusinessService', () => {
  let service: HouseholdBusinessService;
  let householdContextService: jest.Mocked<HouseholdContextService>;

  const mockHouseholdContextService = {
    거점을_생성한다: jest.fn(),
    거점_목록을_조회한다: jest.fn(),
    거점_상세를_조회한다: jest.fn(),
    거점을_수정한다: jest.fn(),
    거점을_삭제한다: jest.fn(),
    멤버_목록을_조회한다: jest.fn(),
    멤버를_추가한다: jest.fn(),
    멤버_역할을_변경한다: jest.fn(),
    멤버를_제거한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdBusinessService,
        {
          provide: HouseholdContextService,
          useValue: mockHouseholdContextService,
        },
      ],
    }).compile();

    service = module.get<HouseholdBusinessService>(HouseholdBusinessService);
    householdContextService = module.get(HouseholdContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('거점을_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 거점을 생성해야 한다', async () => {
      // Given
      const data = { userId: 'user-1', name: '우리집', kind: 'house' };
      const mockResult = {
        id: 'household-1',
        name: '우리집',
        kind: 'house',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockHouseholdContextService.거점을_생성한다.mockResolvedValue(mockResult);

      // When
      const result = await service.거점을_생성한다(data);

      // Then
      expect(householdContextService.거점을_생성한다).toHaveBeenCalledWith(
        data,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('거점_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 거점 목록을 조회해야 한다', async () => {
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
      mockHouseholdContextService.거점_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.거점_목록을_조회한다('user-1');

      // Then
      expect(householdContextService.거점_목록을_조회한다).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('거점_상세를_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 거점 상세를 조회해야 한다', async () => {
      // Given
      const mockResult = {
        id: 'household-1',
        name: '우리집',
        kind: 'house',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockHouseholdContextService.거점_상세를_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.거점_상세를_조회한다('household-1');

      // Then
      expect(householdContextService.거점_상세를_조회한다).toHaveBeenCalledWith(
        'household-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('거점을_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 거점을 수정해야 한다', async () => {
      // Given
      const data = { name: '새 이름' };
      const mockResult = {
        id: 'household-1',
        name: '새 이름',
        kind: 'house',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockHouseholdContextService.거점을_수정한다.mockResolvedValue(mockResult);

      // When
      const result = await service.거점을_수정한다('household-1', data);

      // Then
      expect(householdContextService.거점을_수정한다).toHaveBeenCalledWith(
        'household-1',
        data,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('거점을_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 거점을 삭제해야 한다', async () => {
      // Given
      mockHouseholdContextService.거점을_삭제한다.mockResolvedValue(undefined);

      // When
      await service.거점을_삭제한다('household-1');

      // Then
      expect(householdContextService.거점을_삭제한다).toHaveBeenCalledWith(
        'household-1',
      );
    });
  });

  describe('멤버_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 멤버 목록을 조회해야 한다', async () => {
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
      mockHouseholdContextService.멤버_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.멤버_목록을_조회한다('household-1');

      // Then
      expect(householdContextService.멤버_목록을_조회한다).toHaveBeenCalledWith(
        'household-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('멤버를_추가한다', () => {
    it('컨텍스트 서비스를 호출하여 멤버를 추가해야 한다', async () => {
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
      mockHouseholdContextService.멤버를_추가한다.mockResolvedValue(mockResult);

      // When
      const result = await service.멤버를_추가한다(data);

      // Then
      expect(householdContextService.멤버를_추가한다).toHaveBeenCalledWith(
        data,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('멤버_역할을_변경한다', () => {
    it('컨텍스트 서비스를 호출하여 멤버 역할을 변경해야 한다', async () => {
      // Given
      const data = { role: 'viewer' as const };
      mockHouseholdContextService.멤버_역할을_변경한다.mockResolvedValue(
        undefined,
      );

      // When
      await service.멤버_역할을_변경한다('member-1', 'user-requester', data);

      // Then
      expect(
        householdContextService.멤버_역할을_변경한다,
      ).toHaveBeenCalledWith('member-1', 'user-requester', data);
    });
  });

  describe('멤버를_제거한다', () => {
    it('컨텍스트 서비스를 호출하여 멤버를 제거해야 한다', async () => {
      // Given
      mockHouseholdContextService.멤버를_제거한다.mockResolvedValue(undefined);

      // When
      await service.멤버를_제거한다('member-1', 'user-requester');

      // Then
      expect(householdContextService.멤버를_제거한다).toHaveBeenCalledWith(
        'member-1',
        'user-requester',
      );
    });
  });
});
