import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from '../user/user.entity';
import { Household } from '../household/household.entity';

@Entity('notification_preferences')
export class NotificationPreference extends BaseEntity {
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

  // ── 마스터 토글 (v2.4) ──

  @Column({ type: 'boolean', default: true })
  notifyExpiration: boolean;

  @Column({ type: 'boolean', default: true })
  notifyShopping: boolean;

  @Column({ type: 'boolean', default: false })
  notifyLowStock: boolean;

  // ── 유통기한 설정 ──

  @Column({ type: 'int', nullable: true })
  expirationDaysBefore: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  expirationRuleScope: string | null;

  @Column({ type: 'boolean', default: false })
  notifyExpiredLots: boolean;

  @Column({ type: 'boolean', default: false })
  expirationSameDayReminder: boolean;

  // ── 장보기 설정 ──

  @Column({ type: 'boolean', default: false })
  shoppingNotifyListUpdates: boolean;

  @Column({ type: 'boolean', default: false })
  shoppingTripReminder: boolean;

  @Column({ type: 'int', nullable: true })
  shoppingTripReminderWeekday: number | null;

  // ── 재고 부족 설정 ──

  @Column({ type: 'boolean', default: false })
  lowStockRespectMinLevel: boolean;
}
