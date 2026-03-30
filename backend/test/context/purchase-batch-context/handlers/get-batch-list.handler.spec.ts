import { Test, TestingModule } from '@nestjs/testing';
import {
  GetBatchListHandler,
  GetBatchListQuery,
} from '@context/purchase-batch-context/handlers/queries/get-batch-list.handler';
import { PurchaseBatchService } from '@domain/purchase-batch/purchase-batch.service';

describe('GetBatchListHandler', () => {
  let handler: GetBatchListHandler;

  const mockPurchaseBatchService = {
    거점의_로트_목록을_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBatchListHandler,
        { provide: PurchaseBatchService, useValue: mockPurchaseBatchService },
      ],
    }).compile();

    handler = module.get<GetBatchListHandler>(GetBatchListHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('거점의 로트 목록을 조회해야 한다', async () => {
    const query = new GetBatchListQuery('household-1');
    const mockBatches = [
      { id: 'b-1', quantity: 3, expirationDate: '2026-06-01' },
    ];
    mockPurchaseBatchService.거점의_로트_목록을_조회한다.mockResolvedValue(
      mockBatches,
    );

    const result = await handler.execute(query);

    expect(
      mockPurchaseBatchService.거점의_로트_목록을_조회한다,
    ).toHaveBeenCalledWith('household-1');
    expect(result).toHaveLength(1);
  });
});
