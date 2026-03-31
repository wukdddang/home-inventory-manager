import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  CreateConsumptionHandler,
  CreateConsumptionCommand,
} from '@context/inventory-log-context/handlers/commands/create-consumption.handler';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '@domain/inventory-log/inventory-log.service';

describe('CreateConsumptionHandler', () => {
  let handler: CreateConsumptionHandler;

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
        CreateConsumptionHandler,
        { provide: InventoryItemService, useValue: mockInventoryItemService },
        { provide: InventoryLogService, useValue: mockInventoryLogService },
      ],
    }).compile();

    handler = module.get<CreateConsumptionHandler>(CreateConsumptionHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('소비 기록을 등록하고 재고를 감소시켜야 한다', async () => {
    // Given
    const command = new CreateConsumptionCommand('item-1', 3, 'user-1', '아침 식사');
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
      type: 'out',
      quantityDelta: -3,
      quantityAfter: 7,
    });

    // When
    const result = await handler.execute(command);

    // Then
    expect(mockInventoryItemService.재고_수량을_증가한다).toHaveBeenCalledWith(
      'item-1',
      -3,
    );
    expect(
      mockInventoryLogService.재고_변경_이력을_생성한다,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'out',
        quantityDelta: -3,
        quantityAfter: 7,
      }),
    );
    expect(result.type).toBe('out');
  });

  it('재고 품목이 없으면 NotFoundException을 던져야 한다', async () => {
    const command = new CreateConsumptionCommand('not-exist', 3, 'user-1', null);
    mockInventoryItemService.재고_품목을_단건_조회한다.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
