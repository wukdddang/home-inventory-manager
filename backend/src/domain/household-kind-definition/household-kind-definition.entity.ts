import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from '../user/user.entity';

@Entity('household_kind_definitions')
@Unique(['userId', 'kindId'])
export class HouseholdKindDefinition extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  kindId: string;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
