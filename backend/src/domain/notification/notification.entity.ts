import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Household } from '../household/household.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  householdId: string | null;

  @ManyToOne(() => Household, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'householdId' })
  household: Household | null;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  refType: string | null;

  @Column({ type: 'uuid', nullable: true })
  refId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
