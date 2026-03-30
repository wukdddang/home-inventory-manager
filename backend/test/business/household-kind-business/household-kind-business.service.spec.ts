import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdKindBusinessService } from '@business/household-kind-business/household-kind-business.service';
import { HouseholdKindContextService } from '@context/household-kind-context/household-kind-context.service';

describe('HouseholdKindBusinessService', () => {
  let service: HouseholdKindBusinessService;
  let contextService: jest.Mocked<HouseholdKindContextService>;

  const mockContextService = {
    유형_목록을_조회한다: jest.fn(),
    유형_목록을_일괄_저장한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdKindBusinessService,
        {
          provide: HouseholdKindContextService,
          useValue: mockContextService,
        },
      ],
    }).compile();

    service = module.get<HouseholdKindBusinessService>(
      HouseholdKindBusinessService,
    );
    contextService = module.get(HouseholdKindContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('유형_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 유형 목록을 조회해야 한다', async () => {
      const mockResult = [
        { id: '1', kindId: 'home', label: '집', sortOrder: 0 },
      ];
      mockContextService.유형_목록을_조회한다.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.유형_목록을_조회한다('user-1');

      expect(contextService.유형_목록을_조회한다).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('유형_목록을_일괄_저장한다', () => {
    it('컨텍스트 서비스를 호출하여 유형 목록을 일괄 저장해야 한다', async () => {
      const data = {
        userId: 'user-1',
        items: [{ kindId: 'home', label: '우리집', sortOrder: 0 }],
      };
      const mockResult = [
        { id: '1', kindId: 'home', label: '우리집', sortOrder: 0 },
      ];
      mockContextService.유형_목록을_일괄_저장한다.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.유형_목록을_일괄_저장한다(data);

      expect(contextService.유형_목록을_일괄_저장한다).toHaveBeenCalledWith(
        data,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
