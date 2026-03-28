import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  displayName: string;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshTokenHash: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken: string | null;
}
