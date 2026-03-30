import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CompleteShoppingListItemHandler,
  CompleteShoppingListItemCommand,
} from '@context/shopping-list-context/handlers/commands/complete-shopping-list-item.handler';
import { ShoppingListItemService } from '@domain/shopping-list-item/shopping-list-item.service';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '@domain/inventory-log/inventory-log.service';

describe('CompleteShoppingListItemHandler', () => {
  let handler: CompleteShoppingListItemHandler;

  const mockShoppingListItemService = {
    장보기_항목을_단건_조회한다: jest.fn(),
    장보기_항목을_삭제한다: jest.fn(),
  };
  const mockInventoryItemService = {
    재고_품목을_단건_조회한다: jest.fn(),
    재고_수량을_증가한다: jest.fn(),
  };
  const mockInventoryLogService = {
    재고_변경_이력을_생성한다: jest.fn(),
  };
  const mockDataSource = { transaction: jest.fn((cb) => cb({})) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteShoppingListItemHandler,
        { provide: DataSource, useValue: mockDataSource },
        { provide: ShoppingListItemService, useValue: mockShoppingListItemService },
        { provide: InventoryItemService, useValue: mockInventoryItemService },
        { provide: InventoryLogService, useValue: mockInventoryLogService },
      ],
    }).compile();

    handler = module.get<CompleteShoppingListItemHandler>(CompleteShoppingListItemHandler);
  });

  afterEach(() => jest.clearAllMocks());

  it('장보기 항목을 구매 완료 처리해야 한다 (재고 증가 + 이력 + 삭제)', async () => {
    const command = new CompleteShoppingListItemCommand(
      'shopping-1', 'household-1', 'item-1', 5, null, 'user-1',
    );

    mockShoppingListItemService.장보기_항목을_단건_조회한다.mockResolvedValue({
      id: 'shopping-1',
      product: { name: '우유' },
    });
    mockInventoryItemService.재고_품목을_단건_조회한다.mockResolvedValue({
      id: 'item-1',
      quantity: 10,
      productVariant: { product: { name: '우유' } },
    });
    mockInventoryItemService.재고_수량을_증가한다.mockResolvedValue({
      id: 'item-1',
      quantity: 15,
    });
    mockInventoryLogService.재고_변경_이력을_생성한다.mockResolvedValue({
      id: 'log-1',
      type: 'in',
      quantityDelta: 5,
      quantityAfter: 15,
    });
    mockShoppingListItemService.장보기_항목을_삭제한다.mockResolvedValue(true);

    const result = await handler.execute(command);

    expect(mockInventoryItemService.재고_수량을_증가한다).toHaveBeenCalledWith('item-1', 5);
    expect(mockInventoryLogService.재고_변경_이력을_생성한다).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'in',
        quantityDelta: 5,
        refType: 'shopping',
        refId: 'shopping-1',
      }),
    );
    expect(mockShoppingListItemService.장보기_항목을_삭제한다).toHaveBeenCalledWith('shopping-1', 'household-1');
    expect(result.inventoryItem.quantity).toBe(15);
    expect(result.inventoryLog.type).toBe('in');
  });

  it('장보기 항목이 없으면 NotFoundException을 던져야 한다', async () => {
    const command = new CompleteShoppingListItemCommand('not-exist', 'household-1', 'item-1', 5, null, 'user-1');
    mockShoppingListItemService.장보기_항목을_단건_조회한다.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('재고 품목이 없으면 NotFoundException을 던져야 한다', async () => {
    const command = new CompleteShoppingListItemCommand('shopping-1', 'household-1', 'not-exist', 5, null, 'user-1');
    mockShoppingListItemService.장보기_항목을_단건_조회한다.mockResolvedValue({ id: 'shopping-1' });
    mockInventoryItemService.재고_품목을_단건_조회한다.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
