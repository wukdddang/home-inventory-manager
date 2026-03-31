import { Test, TestingModule } from '@nestjs/testing';
import { InventoryItemBusinessService } from '@business/inventory-item-business/inventory-item-business.service';
import { InventoryItemContextService } from '@context/inventory-item-context/inventory-item-context.service';

describe('InventoryItemBusinessService', () => {
  let service: InventoryItemBusinessService;
  let contextService: jest.Mocked<InventoryItemContextService>;

  const mockContextService = {
    재고_품목_목록을_조회한다: jest.fn(),
    재고_품목을_생성한다: jest.fn(),
    재고_수량을_수정한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryItemBusinessService,
        {
          provide: InventoryItemContextService,
          useValue: mockContextService,
        },
      ],
    }).compile();

    service = module.get<InventoryItemBusinessService>(
      InventoryItemBusinessService,
    );
    contextService = module.get(InventoryItemContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('재고_품목_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 재고 목록을 조회해야 한다', async () => {
      // Given
      const mockResult = [
        { id: 'item-1', quantity: 10 },
        { id: 'item-2', quantity: 5 },
      ];
      mockContextService.재고_품목_목록을_조회한다.mockResolvedValue(
        mockResult as any,
      );

      // When
      const result =
        await service.재고_품목_목록을_조회한다('household-1');

      // Then
      expect(
        contextService.재고_품목_목록을_조회한다,
      ).toHaveBeenCalledWith('household-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('재고_품목을_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 재고 품목을 생성해야 한다', async () => {
      // Given
      const data = {
        productVariantId: 'variant-1',
        storageLocationId: 'storage-1',
        quantity: 5,
      };
      const mockResult = { id: 'item-1', ...data };
      mockContextService.재고_품목을_생성한다.mockResolvedValue(
        mockResult as any,
      );

      // When
      const result = await service.재고_품목을_생성한다(data);

      // Then
      expect(contextService.재고_품목을_생성한다).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockResult);
    });
  });

  describe('재고_수량을_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 재고 수량을 수정해야 한다', async () => {
      // Given
      const mockResult = { id: 'item-1', quantity: 20 };
      mockContextService.재고_수량을_수정한다.mockResolvedValue(
        mockResult as any,
      );

      // When
      const result = await service.재고_수량을_수정한다('item-1', 20);

      // Then
      expect(contextService.재고_수량을_수정한다).toHaveBeenCalledWith(
        'item-1',
        20,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
