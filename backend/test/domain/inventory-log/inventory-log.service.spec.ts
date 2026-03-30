import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryLogService } from '@domain/inventory-log/inventory-log.service';
import { InventoryLog } from '@domain/inventory-log/inventory-log.entity';

describe('InventoryLogService', () => {
  let service: InventoryLogService;
  let repository: jest.Mocked<Repository<InventoryLog>>;

  const mockRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryLogService,
        {
          provide: getRepositoryToken(InventoryLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryLogService>(InventoryLogService);
    repository = module.get(getRepositoryToken(InventoryLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('재고_변경_이력을_생성한다', () => {
    it('재고 변경 이력을 생성해야 한다', async () => {
      const data = {
        inventoryItemId: 'item-1',
        type: 'in' as const,
        quantityDelta: 5,
        quantityAfter: 15,
        userId: 'user-1',
        itemLabel: '우유',
        memo: '구매 입고',
        refType: 'purchase',
        refId: 'purchase-1',
      };
      const mockLog = { id: 'log-1', ...data } as InventoryLog;
      mockRepository.create.mockReturnValue(mockLog);
      mockRepository.save.mockResolvedValue(mockLog);

      const result = await service.재고_변경_이력을_생성한다(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockLog);
    });
  });

  describe('재고_변경_이력을_조회한다', () => {
    it('재고 품목의 변경 이력을 조회해야 한다', async () => {
      const mockLogs = [
        { id: 'log-1', type: 'in', quantityDelta: 5 },
        { id: 'log-2', type: 'out', quantityDelta: -2 },
      ] as InventoryLog[];
      mockRepository.find.mockResolvedValue(mockLogs);

      const result =
        await service.재고_변경_이력을_조회한다('item-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { inventoryItemId: 'item-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });
});
