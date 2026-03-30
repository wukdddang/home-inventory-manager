import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  CreateWasteHandler,
  CreateWasteCommand,
} from '@context/inventory-log-context/handlers/commands/create-waste.handler';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '@domain/inventory-log/inventory-log.service';

describe('CreateWasteHandler', () => {
  let handler: CreateWasteHandler;

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
        CreateWasteHandler,
        { provide: InventoryItemService, useValue: mockInventoryItemService },
        { provide: InventoryLogService, useValue: mockInventoryLogService },
      ],
    }).compile();

    handler = module.get<CreateWasteHandler>(CreateWasteHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('폐기 기록을 등록하고 재고를 감소시켜야 한다', async () => {
    // Given
    const command = new CreateWasteCommand('item-1', 2, '유통기한 만료', 'user-1', null);
    mockInventoryItemService.재고_품목을_단건_조회한다.mockResolvedValue({
      id: 'item-1',
      quantity: 10,
      productVariant: { product: { name: '우유' } },
    });
    mockInventoryItemService.재고_수량을_증가한다.mockResolvedValue({
      id: 'item-1',
      quantity: 8,
    });
    mockInventoryLogService.재고_변경_이력을_생성한다.mockResolvedValue({
      id: 'log-1',
      type: 'waste',
      quantityDelta: -2,
      quantityAfter: 8,
      reason: '유통기한 만료',
    });

    // When
    const result = await handler.execute(command);

    // Then
    expect(
      mockInventoryLogService.재고_변경_이력을_생성한다,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'waste',
        quantityDelta: -2,
        reason: '유통기한 만료',
      }),
    );
    expect(result.type).toBe('waste');
  });

  it('재고 품목이 없으면 NotFoundException을 던져야 한다', async () => {
    const command = new CreateWasteCommand('not-exist', 2, null, 'user-1', null);
    mockInventoryItemService.재고_품목을_단건_조회한다.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
