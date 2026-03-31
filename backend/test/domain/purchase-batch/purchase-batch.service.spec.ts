import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseBatchService } from '@domain/purchase-batch/purchase-batch.service';
import { PurchaseBatch } from '@domain/purchase-batch/purchase-batch.entity';

describe('PurchaseBatchService', () => {
  let service: PurchaseBatchService;
  let repository: jest.Mocked<Repository<PurchaseBatch>>;

  const mockRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseBatchService,
        {
          provide: getRepositoryToken(PurchaseBatch),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PurchaseBatchService>(PurchaseBatchService);
    repository = module.get(getRepositoryToken(PurchaseBatch));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('로트_목록을_조회한다', () => {
    it('구매의 로트 목록을 조회해야 한다', async () => {
      const mockBatches = [
        { id: 'b-1', quantity: 3, expirationDate: '2026-06-01' },
        { id: 'b-2', quantity: 2, expirationDate: '2026-07-01' },
      ] as PurchaseBatch[];
      mockRepository.find.mockResolvedValue(mockBatches);

      const result = await service.로트_목록을_조회한다('purchase-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { purchaseId: 'purchase-1' },
        order: { expirationDate: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('로트를_일괄_생성한다', () => {
    it('로트를 일괄 생성해야 한다', async () => {
      const batchesData = [
        { purchaseId: 'p-1', quantity: 3, expirationDate: '2026-06-01' },
        { purchaseId: 'p-1', quantity: 2, expirationDate: '2026-07-01' },
      ];
      const mockBatches = batchesData.map((d, i) => ({
        id: `b-${i}`,
        ...d,
      })) as PurchaseBatch[];
      mockRepository.create.mockReturnValue(mockBatches);
      mockRepository.save.mockResolvedValue(mockBatches);

      const result = await service.로트를_일괄_생성한다(batchesData);

      expect(repository.create).toHaveBeenCalledWith(batchesData);
      expect(result).toHaveLength(2);
    });
  });
});
