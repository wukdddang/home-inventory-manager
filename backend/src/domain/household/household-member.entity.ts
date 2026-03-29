import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseCreatedEntity } from '../common/base-timestamp.entity';
import { User } from '../user/user.entity';
import { Household } from './household.entity';

@Entity('household_members')
@Unique(['userId', 'householdId'])
export class HouseholdMember extends BaseCreatedEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  householdId: string;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @Column({ type: 'varchar', length: 20 })
  role: 'admin' | 'editor' | 'viewer';
}
