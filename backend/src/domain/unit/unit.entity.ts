import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Household } from '../household/household.entity';

@Entity('units')
@Unique(['householdId', 'symbol'])
export class Unit extends BaseEntity {
    @Column({ type: 'uuid' })
    householdId: string;

    @ManyToOne(() => Household, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'householdId' })
    household: Household;

    @Column({ type: 'varchar', length: 20 })
    symbol: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    name: string | null;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;
}
