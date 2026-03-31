import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from '../../domain/household/household.entity';
import { HouseholdMember } from '../../domain/household/household-member.entity';
import { NotificationService } from '../../domain/notification/notification.service';
import { NotificationPreferenceService } from '../../domain/notification-preference/notification-preference.service';
import { InventoryItemService } from '../../domain/inventory-item/inventory-item.service';
import { PurchaseBatchService } from '../../domain/purchase-batch/purchase-batch.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    @InjectRepository(Household)
    private readonly householdRepository: Repository<Household>,
    @InjectRepository(HouseholdMember)
    private readonly memberRepository: Repository<HouseholdMember>,
    private readonly notificationService: NotificationService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly inventoryItemService: InventoryItemService,
    private readonly purchaseBatchService: PurchaseBatchService,
  ) {}

  /**
   * 매일 오전 9시에 유통기한 임박 + 부족 재고 알림 생성
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async 알림_스케줄러를_실행한다() {
    this.logger.log('알림 스케줄러 시작');

    const households = await this.householdRepository.find();

    for (const household of households) {
      const members = await this.memberRepository.find({
        where: { householdId: household.id },
      });

      for (const member of members) {
        await this.유통기한_임박_알림을_생성한다(household.id, member.userId);
        await this.부족_재고_알림을_생성한다(household.id, member.userId);
      }
    }

    this.logger.log('알림 스케줄러 완료');
  }

  async 유통기한_임박_알림을_생성한다(
    householdId: string,
    userId: string,
  ): Promise<number> {
    // 사용자의 알림 설정 확인
    const prefs = await this.preferenceService.알림_설정_목록을_조회한다(userId);
    const householdPref = prefs.find((p) => p.householdId === householdId);
    const defaultPref = prefs.find((p) => p.householdId === null);
    const activePref = householdPref ?? defaultPref;

    // 마스터 토글 확인
    if (activePref && !activePref.notifyExpiration) return 0;

    const daysBefore = activePref?.expirationDaysBefore ?? 7;
    const batches =
      await this.purchaseBatchService.유통기한_임박_목록을_조회한다(
        householdId,
        daysBefore,
      );

    let created = 0;
    for (const batch of batches) {
      const itemName = batch.purchase?.itemName ?? '품목';
      await this.notificationService.알림을_생성한다({
        userId,
        householdId,
        type: 'expiration',
        title: `유통기한 임박: ${itemName}`,
        body: `${itemName}의 유통기한이 ${batch.expirationDate}에 만료됩니다.`,
        refType: 'purchase_batch',
        refId: batch.id,
      });
      created++;
    }
    return created;
  }

  async 부족_재고_알림을_생성한다(
    householdId: string,
    userId: string,
  ): Promise<number> {
    const prefs = await this.preferenceService.알림_설정_목록을_조회한다(userId);
    const householdPref = prefs.find((p) => p.householdId === householdId);
    const defaultPref = prefs.find((p) => p.householdId === null);
    const activePref = householdPref ?? defaultPref;

    if (activePref && !activePref.notifyLowStock) return 0;

    const items =
      await this.inventoryItemService.부족_품목_목록을_조회한다(householdId);

    let created = 0;
    for (const item of items) {
      const productName = item.productVariant?.product?.name ?? '품목';
      await this.notificationService.알림을_생성한다({
        userId,
        householdId,
        type: 'low_stock',
        title: `재고 부족: ${productName}`,
        body: `${productName}의 재고가 ${Number(item.quantity)}개로 최소 기준(${Number(item.minStockLevel)}개) 이하입니다.`,
        refType: 'inventory_item',
        refId: item.id,
      });
      created++;
    }
    return created;
  }
}
