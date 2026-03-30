import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { InventoryItem } from '@domain/inventory-item/inventory-item.entity';

describe('InventoryItemService', () => {
  let service: InventoryItemService;
  let repository: jest.Mocked<Repository<InventoryItem>>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryItemService,
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryItemService>(InventoryItemService);
    repository = module.get(getRepositoryToken(InventoryItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('재고_품목_목록을_조회한다', () => {
    it('거점의 재고 품목 목록을 조회해야 한다', async () => {
      const mockItems = [
        { id: 'item-1', quantity: 10 },
        { id: 'item-2', quantity: 5 },
      ] as InventoryItem[];
      mockRepository.find.mockResolvedValue(mockItems);

      const result =
        await service.재고_품목_목록을_조회한다('household-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { storageLocation: { householdId: 'household-1' } },
        relations: [
          'productVariant',
          'productVariant.product',
          'productVariant.unit',
          'storageLocation',
        ],
        order: { createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('재고_품목을_단건_조회한다', () => {
    it('재고 품목을 단건 조회해야 한다', async () => {
      const mockItem = { id: 'item-1', quantity: 10 } as InventoryItem;
      mockRepository.findOne.mockResolvedValue(mockItem);

      const result = await service.재고_품목을_단건_조회한다('item-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        relations: [
          'productVariant',
          'productVariant.product',
          'productVariant.unit',
          'storageLocation',
        ],
      });
      expect(result).toEqual(mockItem);
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.재고_품목을_단건_조회한다('not-exist');

      expect(result).toBeNull();
    });
  });

  describe('재고_품목을_생성한다', () => {
    it('재고 품목을 생성하고 저장해야 한다', async () => {
      const data = {
        productVariantId: 'variant-1',
        storageLocationId: 'storage-1',
        quantity: 5,
        minStockLevel: 2,
      };
      const mockItem = { id: 'item-1', ...data } as InventoryItem;
      mockRepository.create.mockReturnValue(mockItem);
      mockRepository.save.mockResolvedValue(mockItem);

      const result = await service.재고_품목을_생성한다(data);

      expect(repository.create).toHaveBeenCalledWith({
        ...data,
        quantity: 5,
      });
      expect(result).toEqual(mockItem);
    });

    it('수량 미지정 시 0으로 생성해야 한다', async () => {
      const data = {
        productVariantId: 'variant-1',
        storageLocationId: 'storage-1',
      };
      const mockItem = { id: 'item-1', ...data, quantity: 0 } as InventoryItem;
      mockRepository.create.mockReturnValue(mockItem);
      mockRepository.save.mockResolvedValue(mockItem);

      await service.재고_품목을_생성한다(data);

      expect(repository.create).toHaveBeenCalledWith({
        ...data,
        quantity: 0,
      });
    });
  });

  describe('재고_수량을_수정한다', () => {
    it('재고 수량을 수정해야 한다', async () => {
      const mockItem = {
        id: 'item-1',
        quantity: 10,
      } as InventoryItem;
      const updated = { ...mockItem, quantity: 15 } as InventoryItem;
      mockRepository.findOne.mockResolvedValue(mockItem);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.재고_수량을_수정한다('item-1', 15);

      expect(result?.quantity).toBe(15);
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.재고_수량을_수정한다('not-exist', 15);

      expect(result).toBeNull();
    });
  });

  describe('재고_수량을_증가한다', () => {
    it('재고 수량을 증가시켜야 한다', async () => {
      const mockItem = {
        id: 'item-1',
        quantity: 10,
      } as InventoryItem;
      mockRepository.findOne.mockResolvedValue(mockItem);
      mockRepository.save.mockResolvedValue({
        ...mockItem,
        quantity: 13,
      } as InventoryItem);

      const result = await service.재고_수량을_증가한다('item-1', 3);

      expect(result?.quantity).toBe(13);
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.재고_수량을_증가한다('not-exist', 3);

      expect(result).toBeNull();
    });
  });
});
