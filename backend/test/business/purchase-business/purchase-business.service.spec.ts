import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseBusinessService } from '@business/purchase-business/purchase-business.service';
import { PurchaseContextService } from '@context/purchase-context/purchase-context.service';

describe('PurchaseBusinessService', () => {
  let service: PurchaseBusinessService;
  let contextService: jest.Mocked<PurchaseContextService>;

  const mockContextService = {
    구매_목록을_조회한다: jest.fn(),
    구매를_등록한다: jest.fn(),
    구매에_재고를_나중에_연결한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseBusinessService,
        {
          provide: PurchaseContextService,
          useValue: mockContextService,
        },
      ],
    }).compile();

    service = module.get<PurchaseBusinessService>(PurchaseBusinessService);
    contextService = module.get(PurchaseContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('구매_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 구매 목록을 조회해야 한다', async () => {
      // Given
      const mockResult = [
        { id: 'p-1', unitPrice: 1500, batches: [] },
      ];
      mockContextService.구매_목록을_조회한다.mockResolvedValue(
        mockResult as any,
      );

      // When
      const result =
        await service.구매_목록을_조회한다('household-1');

      // Then
      expect(contextService.구매_목록을_조회한다).toHaveBeenCalledWith(
        'household-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('구매를_등록한다', () => {
    it('컨텍스트 서비스를 호출하여 구매를 등록해야 한다', async () => {
      // Given
      const data = {
        householdId: 'household-1',
        unitPrice: 1500,
        purchasedAt: new Date('2026-03-01'),
        batches: [{ quantity: 3 }],
      };
      const mockResult = { id: 'p-1', ...data, batches: [] };
      mockContextService.구매를_등록한다.mockResolvedValue(
        mockResult as any,
      );

      // When
      const result = await service.구매를_등록한다(data as any);

      // Then
      expect(contextService.구매를_등록한다).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockResult);
    });
  });

  describe('구매에_재고를_나중에_연결한다', () => {
    it('컨텍스트 서비스를 호출하여 재고를 연결해야 한다', async () => {
      // Given
      const data = { inventoryItemId: 'item-1' };
      const mockResult = {
        id: 'p-1',
        inventoryItemId: 'item-1',
        batches: [],
      };
      mockContextService.구매에_재고를_나중에_연결한다.mockResolvedValue(
        mockResult as any,
      );

      // When
      const result = await service.구매에_재고를_나중에_연결한다(
        'p-1',
        'household-1',
        data,
        'user-1',
      );

      // Then
      expect(
        contextService.구매에_재고를_나중에_연결한다,
      ).toHaveBeenCalledWith('p-1', 'household-1', data, 'user-1');
      expect(result).toEqual(mockResult);
    });
  });
});
