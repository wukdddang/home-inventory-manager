import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { Household } from '../household/household.entity';

@Entity('expiration_alert_rules')
export class ExpirationAlertRule extends BaseEntity {
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'uuid', nullable: true })
  householdId: string | null;

  @ManyToOne(() => Household, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'householdId' })
  household: Household | null;

  @Column({ type: 'int' })
  daysBefore: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
