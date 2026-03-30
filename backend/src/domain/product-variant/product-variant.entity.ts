import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Product } from '../product/product.entity';
import { Unit } from '../unit/unit.entity';

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
    @Column({ type: 'uuid' })
    productId: string;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ type: 'uuid' })
    unitId: string;

    @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'unitId' })
    unit: Unit;

    @Column({ type: 'decimal', precision: 12, scale: 4 })
    quantityPerUnit: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    name: string | null;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    price: number | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    sku: string | null;

    @Column({ type: 'boolean', default: false })
    isDefault: boolean;
}
