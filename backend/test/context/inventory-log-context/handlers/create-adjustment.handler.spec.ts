import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  CreateAdjustmentHandler,
  CreateAdjustmentCommand,
} from '@context/inventory-log-context/handlers/commands/create-adjustment.handler';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '@domain/inventory-log/inventory-log.service';

describe('CreateAdjustmentHandler', () => {
  let handler: CreateAdjustmentHandler;

  const mockInventoryItemService = {
    재고_품목을_단건_조회한다: jest.fn(),
    재고_수량을_증가한다: jest.fn(),
  };

  const mockInventoryLogService = {
    재고_변경_이력을_생성한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAdjustmentHandler,
        { provide: InventoryItemService, useValue: mockInventoryItemService },
        { provide: InventoryLogService, useValue: mockInventoryLogService },
      ],
    }).compile();

    handler = module.get<CreateAdjustmentHandler>(CreateAdjustmentHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('수량을 수동 조정하고 이력을 생성해야 한다', async () => {
    // Given — 양수 조정 (증가)
    const command = new CreateAdjustmentCommand('item-1', 5, 'user-1', '재고 실사 보정');
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
      type: 'adjust',
      quantityDelta: 5,
      quantityAfter: 15,
    });

    // When
    const result = await handler.execute(command);

    // Then
    expect(mockInventoryItemService.재고_수량을_증가한다).toHaveBeenCalledWith(
      'item-1',
      5,
    );
    expect(result.type).toBe('adjust');
    expect(result.quantityAfter).toBe(15);
  });

  it('음수 조정도 허용해야 한다', async () => {
    const command = new CreateAdjustmentCommand('item-1', -3, 'user-1', '재고 실사');
    mockInventoryItemService.재고_품목을_단건_조회한다.mockResolvedValue({
      id: 'item-1',
      quantity: 10,
      productVariant: { product: { name: '우유' } },
    });
    mockInventoryItemService.재고_수량을_증가한다.mockResolvedValue({
      id: 'item-1',
      quantity: 7,
    });
    mockInventoryLogService.재고_변경_이력을_생성한다.mockResolvedValue({
      id: 'log-1',
      type: 'adjust',
      quantityDelta: -3,
      quantityAfter: 7,
    });

    const result = await handler.execute(command);

    expect(mockInventoryItemService.재고_수량을_증가한다).toHaveBeenCalledWith(
      'item-1',
      -3,
    );
    expect(result.quantityAfter).toBe(7);
  });

  it('재고 품목이 없으면 NotFoundException을 던져야 한다', async () => {
    const command = new CreateAdjustmentCommand('not-exist', 5, 'user-1', null);
    mockInventoryItemService.재고_품목을_단건_조회한다.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
