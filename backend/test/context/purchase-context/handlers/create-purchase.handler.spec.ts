import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  CreatePurchaseHandler,
  CreatePurchaseCommand,
} from '@context/purchase-context/handlers/commands/create-purchase.handler';
import { PurchaseService } from '@domain/purchase/purchase.service';
import { PurchaseBatchService } from '@domain/purchase-batch/purchase-batch.service';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '@domain/inventory-log/inventory-log.service';

describe('CreatePurchaseHandler', () => {
  let handler: CreatePurchaseHandler;

  const mockPurchaseService = {
    구매를_생성한다: jest.fn(),
  };

  const mockPurchaseBatchService = {
    로트를_일괄_생성한다: jest.fn(),
  };

  const mockInventoryItemService = {
    재고_수량을_증가한다: jest.fn(),
  };

  const mockInventoryLogService = {
    재고_변경_이력을_생성한다: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb({})),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePurchaseHandler,
        { provide: DataSource, useValue: mockDataSource },
        { provide: PurchaseService, useValue: mockPurchaseService },
        { provide: PurchaseBatchService, useValue: mockPurchaseBatchService },
        { provide: InventoryItemService, useValue: mockInventoryItemService },
        { provide: InventoryLogService, useValue: mockInventoryLogService },
      ],
    }).compile();

    handler = module.get<CreatePurchaseHandler>(CreatePurchaseHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('재고 연결 없이 구매 기록과 로트를 생성해야 한다', async () => {
    // Given
    const command = new CreatePurchaseCommand(
      'household-1',
      null,
      1500,
      new Date('2026-03-01'),
      '이마트',
      '우유',
      '1L',
      'L',
      null,
      'user-1',
      [{ quantity: 3, expirationDate: '2026-06-01' }],
    );

    mockPurchaseService.구매를_생성한다.mockResolvedValue({
      id: 'purchase-1',
      householdId: 'household-1',
      inventoryItemId: null,
      unitPrice: 1500,
      purchasedAt: new Date('2026-03-01'),
      supplierName: '이마트',
      itemName: '우유',
      createdAt: new Date(),
    });

    mockPurchaseBatchService.로트를_일괄_생성한다.mockResolvedValue([
      {
        id: 'batch-1',
        purchaseId: 'purchase-1',
        quantity: 3,
        expirationDate: '2026-06-01',
        createdAt: new Date(),
      },
    ]);

    // When
    const result = await handler.execute(command);

    // Then
    expect(mockPurchaseService.구매를_생성한다).toHaveBeenCalled();
    expect(mockPurchaseBatchService.로트를_일괄_생성한다).toHaveBeenCalled();
    expect(mockInventoryItemService.재고_수량을_증가한다).not.toHaveBeenCalled();
    expect(result.id).toBe('purchase-1');
    expect(result.batches).toHaveLength(1);
  });

  it('재고 연결된 경우 수량을 자동 증가하고 이력을 생성해야 한다', async () => {
    // Given
    const command = new CreatePurchaseCommand(
      'household-1',
      'item-1',
      1500,
      new Date('2026-03-01'),
      '이마트',
      '우유',
      '1L',
      'L',
      null,
      'user-1',
      [
        { quantity: 3, expirationDate: '2026-06-01' },
        { quantity: 2, expirationDate: '2026-07-01' },
      ],
    );

    mockPurchaseService.구매를_생성한다.mockResolvedValue({
      id: 'purchase-1',
      householdId: 'household-1',
      inventoryItemId: 'item-1',
      unitPrice: 1500,
      itemName: '우유',
      createdAt: new Date(),
    });

    mockPurchaseBatchService.로트를_일괄_생성한다.mockResolvedValue([
      { id: 'b-1', purchaseId: 'purchase-1', quantity: 3, expirationDate: '2026-06-01', createdAt: new Date() },
      { id: 'b-2', purchaseId: 'purchase-1', quantity: 2, expirationDate: '2026-07-01', createdAt: new Date() },
    ]);

    mockInventoryItemService.재고_수량을_증가한다.mockResolvedValue({
      id: 'item-1',
      quantity: 15,
    });

    mockInventoryLogService.재고_변경_이력을_생성한다.mockResolvedValue({
      id: 'log-1',
    });

    // When
    const result = await handler.execute(command);

    // Then
    expect(mockInventoryItemService.재고_수량을_증가한다).toHaveBeenCalledWith(
      'item-1',
      5,
    );
    expect(
      mockInventoryLogService.재고_변경_이력을_생성한다,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        inventoryItemId: 'item-1',
        type: 'in',
        quantityDelta: 5,
        quantityAfter: 15,
        refType: 'purchase',
        refId: 'purchase-1',
      }),
    );
    expect(result.batches).toHaveLength(2);
  });
});
