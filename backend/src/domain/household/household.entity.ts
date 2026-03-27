import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/base.entity.js';

@Entity('households')
export class Household extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  kind: string | null;
}
