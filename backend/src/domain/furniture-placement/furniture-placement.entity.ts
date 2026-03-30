import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Room } from '../room/room.entity';

@Entity('furniture_placements')
export class FurniturePlacement extends BaseEntity {
  @Column({ type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ type: 'uuid', nullable: true })
  productVariantId: string | null;

  @Column({ type: 'uuid', nullable: true })
  anchorDirectStorageId: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  placementPayload: Record<string, any> | null;
}
