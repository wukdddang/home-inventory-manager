import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { HouseStructure } from '../house-structure/house-structure.entity';

@Entity('rooms')
@Unique(['houseStructureId', 'structureRoomKey'])
export class Room extends BaseEntity {
  @Column({ type: 'uuid' })
  houseStructureId: string;

  @ManyToOne(() => HouseStructure, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'houseStructureId' })
  houseStructure: HouseStructure;

  @Column({ type: 'varchar', length: 100 })
  structureRoomKey: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  displayName: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
