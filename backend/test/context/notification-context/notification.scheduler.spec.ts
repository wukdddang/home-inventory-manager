import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationScheduler } from '@context/notification-context/notification.scheduler';
import { NotificationService } from '@domain/notification/notification.service';
import { NotificationPreferenceService } from '@domain/notification-preference/notification-preference.service';
import { InventoryItemService } from '@domain/inventory-item/inventory-item.service';
import { PurchaseBatchService } from '@domain/purchase-batch/purchase-batch.service';
import { Household } from '@domain/household/household.entity';
import { HouseholdMember } from '@domain/household/household-member.entity';

describe('NotificationScheduler', () => {
  let scheduler: NotificationScheduler;

  const mockHouseholdRepo = { find: jest.fn() };
  const mockMemberRepo = { find: jest.fn() };
  const mockNotificationService = { 알림을_생성한다: jest.fn() };
  const mockPreferenceService = { 알림_설정_목록을_조회한다: jest.fn() };
  const mockInventoryItemService = { 부족_품목_목록을_조회한다: jest.fn() };
  const mockPurchaseBatchService = { 유통기한_임박_목록을_조회한다: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationScheduler,
        { provide: getRepositoryToken(Household), useValue: mockHouseholdRepo },
        { provide: getRepositoryToken(HouseholdMember), useValue: mockMemberRepo },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationPreferenceService, useValue: mockPreferenceService },
        { provide: InventoryItemService, useValue: mockInventoryItemService },
        { provide: PurchaseBatchService, useValue: mockPurchaseBatchService },
      ],
    }).compile();
    scheduler = module.get<NotificationScheduler>(NotificationScheduler);
  });

  afterEach(() => jest.clearAllMocks());

  describe('유통기한_임박_알림을_생성한다', () => {
    it('마스터 토글이 켜져 있으면 알림을 생성해야 한다', async () => {
      mockPreferenceService.알림_설정_목록을_조회한다.mockResolvedValue([
        { householdId: null, notifyExpiration: true, expirationDaysBefore: 7 },
      ]);
      mockPurchaseBatchService.유통기한_임박_목록을_조회한다.mockResolvedValue([
        { id: 'b-1', expirationDate: '2026-04-05', purchase: { itemName: '우유' } },
      ]);
      mockNotificationService.알림을_생성한다.mockResolvedValue({});

      const count = await scheduler.유통기한_임박_알림을_생성한다('household-1', 'user-1');

      expect(count).toBe(1);
      expect(mockNotificationService.알림을_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'expiration', userId: 'user-1' }),
      );
    });

    it('마스터 토글이 꺼져 있으면 알림을 생성하지 않아야 한다', async () => {
      mockPreferenceService.알림_설정_목록을_조회한다.mockResolvedValue([
        { householdId: null, notifyExpiration: false },
      ]);

      const count = await scheduler.유통기한_임박_알림을_생성한다('household-1', 'user-1');

      expect(count).toBe(0);
    });
  });

  describe('부족_재고_알림을_생성한다', () => {
    it('notifyLowStock이 꺼져 있으면 알림을 생성하지 않아야 한다', async () => {
      mockPreferenceService.알림_설정_목록을_조회한다.mockResolvedValue([
        { householdId: null, notifyLowStock: false },
      ]);

      const count = await scheduler.부족_재고_알림을_생성한다('household-1', 'user-1');

      expect(count).toBe(0);
    });
  });
});
