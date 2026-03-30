import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseService } from '@domain/purchase/purchase.service';
import { Purchase } from '@domain/purchase/purchase.entity';

describe('PurchaseService', () => {
  let service: PurchaseService;
  let repository: jest.Mocked<Repository<Purchase>>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        {
          provide: getRepositoryToken(Purchase),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PurchaseService>(PurchaseService);
    repository = module.get(getRepositoryToken(Purchase));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('구매_목록을_조회한다', () => {
    it('거점의 구매 목록을 조회해야 한다', async () => {
      const mockPurchases = [
        { id: 'p-1', unitPrice: 1000 },
        { id: 'p-2', unitPrice: 2000 },
      ] as Purchase[];
      mockRepository.find.mockResolvedValue(mockPurchases);

      const result =
        await service.구매_목록을_조회한다('household-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { householdId: 'household-1' },
        relations: ['inventoryItem'],
        order: { purchasedAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('구매를_단건_조회한다', () => {
    it('구매 기록을 단건 조회해야 한다', async () => {
      const mockPurchase = { id: 'p-1', householdId: 'household-1' } as Purchase;
      mockRepository.findOne.mockResolvedValue(mockPurchase);

      const result = await service.구매를_단건_조회한다('p-1', 'household-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'p-1', householdId: 'household-1' },
        relations: ['inventoryItem'],
      });
      expect(result).toEqual(mockPurchase);
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.구매를_단건_조회한다('not-exist', 'household-1');

      expect(result).toBeNull();
    });
  });

  describe('구매를_생성한다', () => {
    it('구매 기록을 생성해야 한다', async () => {
      const data = {
        householdId: 'household-1',
        unitPrice: 1500,
        purchasedAt: new Date('2026-03-01'),
        supplierName: '이마트',
        itemName: '우유',
      };
      const mockPurchase = { id: 'p-1', ...data } as Purchase;
      mockRepository.create.mockReturnValue(mockPurchase);
      mockRepository.save.mockResolvedValue(mockPurchase);

      const result = await service.구매를_생성한다(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockPurchase);
    });
  });

  describe('구매에_재고를_연결한다', () => {
    it('구매 기록에 재고를 연결해야 한다', async () => {
      const updated = {
        id: 'p-1',
        householdId: 'household-1',
        inventoryItemId: 'item-1',
      } as Purchase;
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updated);

      const result = await service.구매에_재고를_연결한다(
        'p-1',
        'household-1',
        'item-1',
      );

      expect(repository.update).toHaveBeenCalledWith(
        { id: 'p-1', householdId: 'household-1' },
        { inventoryItemId: 'item-1' },
      );
      expect(result?.inventoryItemId).toBe('item-1');
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.구매에_재고를_연결한다(
        'not-exist',
        'household-1',
        'item-1',
      );

      expect(result).toBeNull();
    });
  });
});
