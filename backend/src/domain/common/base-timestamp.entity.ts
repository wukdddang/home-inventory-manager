import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * createdAt만 갖는 엔티티용 (HouseholdMember 등)
 */
export abstract class BaseCreatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
