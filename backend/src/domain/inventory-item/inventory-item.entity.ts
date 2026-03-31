import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ProductVariant } from '../product-variant/product-variant.entity';
import { StorageLocation } from '../storage-location/storage-location.entity';

@Entity('inventory_items')
export class InventoryItem extends BaseEntity {
  @Column({ type: 'uuid' })
  productVariantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productVariantId' })
  productVariant: ProductVariant;

  @Column({ type: 'uuid' })
  storageLocationId: string;

  @ManyToOne(() => StorageLocation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storageLocationId' })
  storageLocation: StorageLocation;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  minStockLevel: number | null;
}
