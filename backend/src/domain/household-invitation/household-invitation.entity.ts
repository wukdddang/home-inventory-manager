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

@Entity('household_invitations')
export class HouseholdInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  householdId: string;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @Column({ type: 'uuid' })
  invitedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitedByUserId' })
  invitedByUser: User;

  @Column({ type: 'varchar', length: 20 })
  role: 'admin' | 'editor' | 'viewer';

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'varchar', length: 20 })
  status: 'pending' | 'accepted' | 'expired' | 'revoked';

  @Column({ type: 'varchar', length: 255, nullable: true })
  inviteeEmail: string | null;

  @Column({ type: 'uuid', nullable: true })
  acceptedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'acceptedByUserId' })
  acceptedByUser: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
