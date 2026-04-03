import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Household } from '../household/household.entity';

@Entity('appliances')
export class Appliance extends BaseEntity {
    @Column({ type: 'uuid' })
    householdId: string;

    @ManyToOne(() => Household, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'householdId' })
    household: Household;

    @Column({ type: 'uuid', nullable: true })
    roomId: string | null;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    brand: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    modelName: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    serialNumber: string | null;

    @Column({ type: 'date', nullable: true })
    purchasedAt: string | null;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    purchasePrice: number | null;

    @Column({ type: 'date', nullable: true })
    warrantyExpiresAt: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    manualUrl: string | null;

    @Column({ type: 'varchar', length: 20, default: 'active' })
    status: 'active' | 'retired';

    @Column({ type: 'text', nullable: true })
    memo: string | null;
}
