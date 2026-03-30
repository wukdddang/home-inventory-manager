import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateInventoryItemHandler,
  CreateInventoryItemCommand,
} from '@context/inventory-item-context/handlers/commands/create-inventory-item.handler';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { InventoryItem } from '@domain/inventory-item/inventory-item.entity';

describe('CreateInventoryItemHandler', () => {
  let handler: CreateInventoryItemHandler;

  const mockInventoryItemService = {
    재고_품목을_생성한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateInventoryItemHandler,
        { provide: InventoryItemService, useValue: mockInventoryItemService },
      ],
    }).compile();

    handler = module.get<CreateInventoryItemHandler>(
      CreateInventoryItemHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('재고 품목을 생성해야 한다', async () => {
    const command = new CreateInventoryItemCommand(
      'variant-1',
      'storage-1',
      5,
      2,
    );
    const mockResult = {
      id: 'item-1',
      productVariantId: 'variant-1',
      storageLocationId: 'storage-1',
      quantity: 5,
      minStockLevel: 2,
    } as InventoryItem;

    mockInventoryItemService.재고_품목을_생성한다.mockResolvedValue(mockResult);

    const result = await handler.execute(command);

    expect(
      mockInventoryItemService.재고_품목을_생성한다,
    ).toHaveBeenCalledWith({
      productVariantId: 'variant-1',
      storageLocationId: 'storage-1',
      quantity: 5,
      minStockLevel: 2,
    });
    expect(result.id).toBe('item-1');
  });
});
