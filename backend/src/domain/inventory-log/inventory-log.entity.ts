import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InventoryItem } from '../inventory-item/inventory-item.entity';
import { User } from '../user/user.entity';

@Entity('inventory_logs')
export class InventoryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  inventoryItemId: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem;

  @Column({ type: 'varchar', length: 20 })
  type: 'in' | 'out' | 'adjust' | 'waste';

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantityDelta: number;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantityAfter: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  itemLabel: string | null;

  @Column({ type: 'text', nullable: true })
  memo: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  refType: string | null;

  @Column({ type: 'uuid', nullable: true })
  refId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
