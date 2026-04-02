import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../user/user.entity';
import { BaseEntity } from '../common/base.entity';

@Entity('user_device_tokens')
export class UserDeviceToken extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 500, unique: true })
  token: string;

  @Column({ type: 'varchar', length: 20 })
  platform: 'web' | 'android' | 'ios';

  @Column({ type: 'varchar', length: 500, nullable: true })
  deviceInfo: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
