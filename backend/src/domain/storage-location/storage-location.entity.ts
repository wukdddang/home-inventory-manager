import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Household } from '../household/household.entity';
import { Room } from '../room/room.entity';
import { FurniturePlacement } from '../furniture-placement/furniture-placement.entity';
import { Appliance } from '../appliance/appliance.entity';

@Entity('storage_locations')
export class StorageLocation extends BaseEntity {
  @Column({ type: 'uuid' })
  householdId: string;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  roomId: string | null;

  @ManyToOne(() => Room, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'roomId' })
  room: Room | null;

  @Column({ type: 'uuid', nullable: true })
  furniturePlacementId: string | null;

  @ManyToOne(() => FurniturePlacement, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'furniturePlacementId' })
  furniturePlacement: FurniturePlacement | null;

  @Column({ type: 'uuid', nullable: true })
  applianceId: string | null;

  @ManyToOne(() => Appliance, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applianceId' })
  appliance: Appliance | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
