import { Test, TestingModule } from '@nestjs/testing';
import {
  GetExpiredBatchesHandler,
  GetExpiredBatchesQuery,
} from '@context/purchase-batch-context/handlers/queries/get-expired-batches.handler';
import { PurchaseBatchService } from '@domain/purchase-batch/purchase-batch.service';

describe('GetExpiredBatchesHandler', () => {
  let handler: GetExpiredBatchesHandler;

  const mockPurchaseBatchService = {
    만료된_목록을_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetExpiredBatchesHandler,
        { provide: PurchaseBatchService, useValue: mockPurchaseBatchService },
      ],
    }).compile();

    handler = module.get<GetExpiredBatchesHandler>(GetExpiredBatchesHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('만료된 로트를 조회해야 한다', async () => {
    const query = new GetExpiredBatchesQuery('household-1');
    const mockBatches = [
      { id: 'b-1', expirationDate: '2025-01-01' },
    ];
    mockPurchaseBatchService.만료된_목록을_조회한다.mockResolvedValue(
      mockBatches,
    );

    const result = await handler.execute(query);

    expect(
      mockPurchaseBatchService.만료된_목록을_조회한다,
    ).toHaveBeenCalledWith('household-1');
    expect(result).toHaveLength(1);
  });
});
