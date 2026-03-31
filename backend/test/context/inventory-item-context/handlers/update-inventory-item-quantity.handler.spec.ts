import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  UpdateInventoryItemQuantityHandler,
  UpdateInventoryItemQuantityCommand,
} from '@context/inventory-item-context/handlers/commands/update-inventory-item-quantity.handler';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { InventoryItem } from '@domain/inventory-item/inventory-item.entity';

describe('UpdateInventoryItemQuantityHandler', () => {
  let handler: UpdateInventoryItemQuantityHandler;

  const mockInventoryItemService = {
    재고_수량을_수정한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateInventoryItemQuantityHandler,
        { provide: InventoryItemService, useValue: mockInventoryItemService },
      ],
    }).compile();

    handler = module.get<UpdateInventoryItemQuantityHandler>(
      UpdateInventoryItemQuantityHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('재고 수량을 수정해야 한다', async () => {
    const command = new UpdateInventoryItemQuantityCommand('item-1', 20);
    const mockResult = {
      id: 'item-1',
      quantity: 20,
    } as InventoryItem;

    mockInventoryItemService.재고_수량을_수정한다.mockResolvedValue(mockResult);

    const result = await handler.execute(command);

    expect(
      mockInventoryItemService.재고_수량을_수정한다,
    ).toHaveBeenCalledWith('item-1', 20);
    expect(result.quantity).toBe(20);
  });

  it('존재하지 않으면 NotFoundException을 던져야 한다', async () => {
    const command = new UpdateInventoryItemQuantityCommand('not-exist', 20);
    mockInventoryItemService.재고_수량을_수정한다.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
