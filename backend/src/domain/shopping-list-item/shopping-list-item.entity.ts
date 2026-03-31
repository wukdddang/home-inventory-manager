import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Household } from '../household/household.entity';
import { Category } from '../category/category.entity';
import { Product } from '../product/product.entity';
import { ProductVariant } from '../product-variant/product-variant.entity';
import { InventoryItem } from '../inventory-item/inventory-item.entity';
import { StorageLocation } from '../storage-location/storage-location.entity';

@Entity('shopping_list_items')
export class ShoppingListItem extends BaseEntity {
  @Column({ type: 'uuid' })
  householdId: string;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ type: 'uuid', nullable: true })
  productVariantId: string | null;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productVariantId' })
  productVariant: ProductVariant | null;

  @Column({ type: 'uuid', nullable: true })
  sourceInventoryItemId: string | null;

  @ManyToOne(() => InventoryItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sourceInventoryItemId' })
  sourceInventoryItem: InventoryItem | null;

  @Column({ type: 'uuid', nullable: true })
  targetStorageLocationId: string | null;

  @ManyToOne(() => StorageLocation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'targetStorageLocationId' })
  targetStorageLocation: StorageLocation | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  quantity: number | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'text', nullable: true })
  memo: string | null;
}
