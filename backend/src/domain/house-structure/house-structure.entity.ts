import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Household } from '../household/household.entity';

@Entity('house_structures')
export class HouseStructure extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  householdId: string;

  @OneToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'jsonb' })
  structurePayload: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  diagramLayout: Record<string, any> | null;

  @Column({ type: 'int', default: 1 })
  version: number;
}
