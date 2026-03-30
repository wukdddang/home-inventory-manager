import { Test, TestingModule } from '@nestjs/testing';
import {
  GetExpiringBatchesHandler,
  GetExpiringBatchesQuery,
} from '@context/purchase-batch-context/handlers/queries/get-expiring-batches.handler';
import { PurchaseBatchService } from '@domain/purchase-batch/purchase-batch.service';

describe('GetExpiringBatchesHandler', () => {
  let handler: GetExpiringBatchesHandler;

  const mockPurchaseBatchService = {
    유통기한_임박_목록을_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetExpiringBatchesHandler,
        { provide: PurchaseBatchService, useValue: mockPurchaseBatchService },
      ],
    }).compile();

    handler = module.get<GetExpiringBatchesHandler>(
      GetExpiringBatchesHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('유통기한 임박 로트를 조회해야 한다', async () => {
    const query = new GetExpiringBatchesQuery('household-1', 7);
    const mockBatches = [
      { id: 'b-1', expirationDate: '2026-04-01' },
    ];
    mockPurchaseBatchService.유통기한_임박_목록을_조회한다.mockResolvedValue(
      mockBatches,
    );

    const result = await handler.execute(query);

    expect(
      mockPurchaseBatchService.유통기한_임박_목록을_조회한다,
    ).toHaveBeenCalledWith('household-1', 7);
    expect(result).toHaveLength(1);
  });
});
