import { Injectable } from '@nestjs/common';
import { HouseholdBusinessService } from '../household-business/household-business.service';
import { CategoryBusinessService } from '../category-business/category-business.service';
import { UnitBusinessService } from '../unit-business/unit-business.service';
import { ProductBusinessService } from '../product-business/product-business.service';
import { ProductVariantBusinessService } from '../product-variant-business/product-variant-business.service';
import { SpaceBusinessService } from '../space-business/space-business.service';
import { InventoryItemBusinessService } from '../inventory-item-business/inventory-item-business.service';
import { InventoryLogBusinessService } from '../inventory-log-business/inventory-log-business.service';
import { PurchaseBusinessService } from '../purchase-business/purchase-business.service';
import { PurchaseBatchBusinessService } from '../purchase-batch-business/purchase-batch-business.service';

@Injectable()
export class AggregateBusinessService {
  constructor(
    private readonly householdBusinessService: HouseholdBusinessService,
    private readonly categoryBusinessService: CategoryBusinessService,
    private readonly unitBusinessService: UnitBusinessService,
    private readonly productBusinessService: ProductBusinessService,
    private readonly productVariantBusinessService: ProductVariantBusinessService,
    private readonly spaceBusinessService: SpaceBusinessService,
    private readonly inventoryItemBusinessService: InventoryItemBusinessService,
    private readonly inventoryLogBusinessService: InventoryLogBusinessService,
    private readonly purchaseBusinessService: PurchaseBusinessService,
    private readonly purchaseBatchBusinessService: PurchaseBatchBusinessService,
  ) {}

  /**
   * 대시보드 초기 렌더에 필요한 모든 데이터를 한 번에 조회한다.
   * 기존 ~44회 API 호출을 1회로 축소.
   */
  async 대시보드_뷰를_조회한다(householdId: string) {
    const [
      members,
      categories,
      units,
      products,
      houseStructure,
      storageLocations,
      inventoryItems,
      purchases,
      expiringBatches,
      expiredBatches,
    ] = await Promise.all([
      this.householdBusinessService.멤버_목록을_조회한다(householdId),
      this.categoryBusinessService.카테고리_목록을_조회한다(householdId),
      this.unitBusinessService.단위_목록을_조회한다(householdId),
      this.productBusinessService.상품_목록을_조회한다(householdId),
      this.spaceBusinessService.집_구조를_조회한다(householdId),
      this.spaceBusinessService.보관장소_목록을_조회한다(householdId),
      this.inventoryItemBusinessService.재고_품목_목록을_조회한다(householdId),
      this.purchaseBusinessService.구매_목록을_조회한다(householdId),
      this.purchaseBatchBusinessService.유통기한_임박_목록을_조회한다(householdId, 7),
      this.purchaseBatchBusinessService.만료된_목록을_조회한다(householdId),
    ]);

    // 방 목록은 houseStructure가 있어야 조회 가능
    const rooms = houseStructure
      ? await this.spaceBusinessService.방_목록을_조회한다(houseStructure.id)
      : [];

    // 모든 방의 가구 배치를 병렬 조회
    const roomIds = rooms.map((r) => r.id);
    const furniturePlacementArrays = await Promise.all(
      roomIds.map((rid) =>
        this.spaceBusinessService.가구_목록을_조회한다(rid),
      ),
    );
    const furniturePlacements = furniturePlacementArrays.flat();

    // 모든 상품의 variant를 병렬 조회
    const variantArrays = await Promise.all(
      products.map((p) =>
        this.productVariantBusinessService.상품_용량_변형_목록을_조회한다(p.id),
      ),
    );
    const variants = variantArrays.flat();

    // 모든 구매의 배치를 일괄 조회
    const allBatches = await this.purchaseBatchBusinessService.로트_목록을_조회한다(householdId);

    return {
      members,
      catalog: { categories, units, products, variants },
      houseStructure,
      rooms,
      furniturePlacements,
      storageLocations,
      inventoryItems,
      purchases,
      allBatches,
      expiringBatches,
      expiredBatches,
    };
  }

  /**
   * 거점의 모든 재고 이력을 한 번에 조회한다.
   * 기존 1 + H + Σ(items) 회 호출을 1회로 축소.
   */
  async 거점_재고_이력을_일괄_조회한다(householdId: string) {
    const items =
      await this.inventoryItemBusinessService.재고_품목_목록을_조회한다(
        householdId,
      );

    const logArrays = await Promise.all(
      items.map((item) =>
        this.inventoryLogBusinessService.재고_변경_이력을_조회한다(item.id),
      ),
    );

    return logArrays.flat().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * 거점의 구매 목록을 배치 포함하여 한 번에 조회한다.
   * 기존 2 × H 회 호출을 1회로 축소.
   */
  async 구매_전체를_조회한다(householdId: string) {
    const [purchases, allBatches, expiringBatches, expiredBatches] =
      await Promise.all([
        this.purchaseBusinessService.구매_목록을_조회한다(householdId),
        this.purchaseBatchBusinessService.로트_목록을_조회한다(householdId),
        this.purchaseBatchBusinessService.유통기한_임박_목록을_조회한다(householdId, 7),
        this.purchaseBatchBusinessService.만료된_목록을_조회한다(householdId),
      ]);

    return { purchases, allBatches, expiringBatches, expiredBatches };
  }
}
