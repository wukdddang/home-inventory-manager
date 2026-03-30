import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShoppingSuggestionScheduler } from '@context/shopping-list-context/shopping-suggestion.scheduler';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { PurchaseBatchService } from '@domain/purchase-batch/purchase-batch.service';
import { ShoppingListItemService } from '@domain/shopping-list-item/shopping-list-item.service';
import { Household } from '@domain/household/household.entity';

describe('ShoppingSuggestionScheduler', () => {
  let scheduler: ShoppingSuggestionScheduler;

  const mockHouseholdRepo = { find: jest.fn() };
  const mockInventoryItemService = { 부족_품목_목록을_조회한다: jest.fn() };
  const mockPurchaseBatchService = { 유통기한_임박_목록을_조회한다: jest.fn() };
  const mockShoppingListItemService = { 장보기_항목_목록을_조회한다: jest.fn(), 장보기_항목을_추가한다: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingSuggestionScheduler,
        { provide: getRepositoryToken(Household), useValue: mockHouseholdRepo },
        { provide: InventoryItemService, useValue: mockInventoryItemService },
        { provide: PurchaseBatchService, useValue: mockPurchaseBatchService },
        { provide: ShoppingListItemService, useValue: mockShoppingListItemService },
      ],
    }).compile();
    scheduler = module.get<ShoppingSuggestionScheduler>(ShoppingSuggestionScheduler);
  });

  afterEach(() => jest.clearAllMocks());

  describe('부족_품목을_제안한다', () => {
    it('부족 품목을 장보기에 제안해야 한다', async () => {
      mockInventoryItemService.부족_품목_목록을_조회한다.mockResolvedValue([
        { id: 'item-1', productVariantId: 'pv-1', storageLocationId: 'sl-1', quantity: 2, minStockLevel: 5, productVariant: { product: { id: 'p-1', name: '우유' } } },
      ]);
      mockShoppingListItemService.장보기_항목_목록을_조회한다.mockResolvedValue([]);
      mockShoppingListItemService.장보기_항목을_추가한다.mockResolvedValue({});

      const count = await scheduler.부족_품목을_제안한다('household-1');

      expect(count).toBe(1);
      expect(mockShoppingListItemService.장보기_항목을_추가한다).toHaveBeenCalledWith(
        expect.objectContaining({ householdId: 'household-1', sourceInventoryItemId: 'item-1', quantity: 3 }),
      );
    });

    it('이미 장보기에 있는 품목은 제안하지 않아야 한다', async () => {
      mockInventoryItemService.부족_품목_목록을_조회한다.mockResolvedValue([
        { id: 'item-1', quantity: 2, minStockLevel: 5, productVariant: { product: { name: '우유' } } },
      ]);
      mockShoppingListItemService.장보기_항목_목록을_조회한다.mockResolvedValue([
        { sourceInventoryItemId: 'item-1' },
      ]);

      const count = await scheduler.부족_품목을_제안한다('household-1');

      expect(count).toBe(0);
    });
  });

  describe('유통기한_임박_품목을_제안한다', () => {
    it('유통기한 임박 품목을 장보기에 제안해야 한다', async () => {
      mockPurchaseBatchService.유통기한_임박_목록을_조회한다.mockResolvedValue([
        { id: 'b-1', quantity: 2, expirationDate: '2026-04-05', purchase: { itemName: '우유' } },
      ]);
      mockShoppingListItemService.장보기_항목_목록을_조회한다.mockResolvedValue([]);
      mockShoppingListItemService.장보기_항목을_추가한다.mockResolvedValue({});

      const count = await scheduler.유통기한_임박_품목을_제안한다('household-1');

      expect(count).toBe(1);
    });
  });
});
