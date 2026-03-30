import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  LinkPurchaseInventoryHandler,
  LinkPurchaseInventoryCommand,
} from '@context/purchase-context/handlers/commands/link-purchase-inventory.handler';
import { PurchaseService } from '@domain/purchase/purchase.service';
import { PurchaseBatchService } from '@domain/purchase-batch/purchase-batch.service';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '@domain/inventory-log/inventory-log.service';

describe('LinkPurchaseInventoryHandler', () => {
  let handler: LinkPurchaseInventoryHandler;

  const mockPurchaseService = {
    구매에_재고를_연결한다: jest.fn(),
  };

  const mockPurchaseBatchService = {
    로트_목록을_조회한다: jest.fn(),
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
        LinkPurchaseInventoryHandler,
        { provide: DataSource, useValue: mockDataSource },
        { provide: PurchaseService, useValue: mockPurchaseService },
        { provide: PurchaseBatchService, useValue: mockPurchaseBatchService },
        { provide: InventoryItemService, useValue: mockInventoryItemService },
        { provide: InventoryLogService, useValue: mockInventoryLogService },
      ],
    }).compile();

    handler = module.get<LinkPurchaseInventoryHandler>(
      LinkPurchaseInventoryHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('구매 기록에 재고를 연결하고 수량을 증가시켜야 한다', async () => {
    // Given
    const command = new LinkPurchaseInventoryCommand(
      'purchase-1',
      'household-1',
      'item-1',
      'user-1',
    );

    mockPurchaseService.구매에_재고를_연결한다.mockResolvedValue({
      id: 'purchase-1',
      householdId: 'household-1',
      inventoryItemId: 'item-1',
      itemName: '우유',
      createdAt: new Date(),
    });

    mockPurchaseBatchService.로트_목록을_조회한다.mockResolvedValue([
      { id: 'b-1', purchaseId: 'purchase-1', quantity: 3, expirationDate: '2026-06-01', createdAt: new Date() },
      { id: 'b-2', purchaseId: 'purchase-1', quantity: 2, expirationDate: null, createdAt: new Date() },
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
    expect(mockPurchaseService.구매에_재고를_연결한다).toHaveBeenCalledWith(
      'purchase-1',
      'household-1',
      'item-1',
    );
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
      }),
    );
    expect(result.batches).toHaveLength(2);
  });

  it('구매 기록이 없으면 NotFoundException을 던져야 한다', async () => {
    const command = new LinkPurchaseInventoryCommand(
      'not-exist',
      'household-1',
      'item-1',
      'user-1',
    );
    mockPurchaseService.구매에_재고를_연결한다.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
