import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseBatchBusinessService } from '@business/purchase-batch-business/purchase-batch-business.service';
import { PurchaseBatchContextService } from '@context/purchase-batch-context/purchase-batch-context.service';

describe('PurchaseBatchBusinessService', () => {
  let service: PurchaseBatchBusinessService;
  let contextService: jest.Mocked<PurchaseBatchContextService>;

  const mockContextService = {
    로트_목록을_조회한다: jest.fn(),
    유통기한_임박_목록을_조회한다: jest.fn(),
    만료된_목록을_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseBatchBusinessService,
        {
          provide: PurchaseBatchContextService,
          useValue: mockContextService,
        },
      ],
    }).compile();

    service = module.get<PurchaseBatchBusinessService>(
      PurchaseBatchBusinessService,
    );
    contextService = module.get(PurchaseBatchContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('로트_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 로트 목록을 조회해야 한다', async () => {
      const mockResult = [{ id: 'b-1' }];
      mockContextService.로트_목록을_조회한다.mockResolvedValue(mockResult as any);

      const result = await service.로트_목록을_조회한다('household-1');

      expect(contextService.로트_목록을_조회한다).toHaveBeenCalledWith('household-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('유통기한_임박_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 임박 목록을 조회해야 한다', async () => {
      const mockResult = [{ id: 'b-1' }];
      mockContextService.유통기한_임박_목록을_조회한다.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.유통기한_임박_목록을_조회한다('household-1', 7);

      expect(contextService.유통기한_임박_목록을_조회한다).toHaveBeenCalledWith(
        'household-1',
        7,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('만료된_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 만료 목록을 조회해야 한다', async () => {
      const mockResult = [{ id: 'b-1' }];
      mockContextService.만료된_목록을_조회한다.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.만료된_목록을_조회한다('household-1');

      expect(contextService.만료된_목록을_조회한다).toHaveBeenCalledWith(
        'household-1',
      );
      expect(result).toEqual(mockResult);
    });
  });
});
