import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Household } from '../household/household.entity';
import { InventoryItem } from '../inventory-item/inventory-item.entity';
import { User } from '../user/user.entity';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  householdId: string;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @Column({ type: 'uuid', nullable: true })
  inventoryItemId: string | null;

  @ManyToOne(() => InventoryItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'timestamptz' })
  purchasedAt: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  supplierName: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  itemName: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  variantCaption: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unitSymbol: string | null;

  @Column({ type: 'text', nullable: true })
  memo: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
