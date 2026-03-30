import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Household } from '../household/household.entity';
import { Category } from '../category/category.entity';

@Entity('products')
export class Product extends BaseEntity {
    @Column({ type: 'uuid' })
    householdId: string;

    @ManyToOne(() => Household, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'householdId' })
    household: Household;

    @Column({ type: 'uuid' })
    categoryId: string;

    @ManyToOne(() => Category, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @Column({ type: 'varchar', length: 200 })
    name: string;

    @Column({ type: 'boolean' })
    isConsumable: boolean;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl: string | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;
}
