import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { InventoryLog } from './inventory-log.entity';

@Injectable()
export class InventoryLogService {
  constructor(
    @InjectRepository(InventoryLog)
    private readonly inventoryLogRepository: Repository<InventoryLog>,
  ) {}

  async 재고_변경_이력을_생성한다(data: {
    inventoryItemId: string;
    type: 'in' | 'out' | 'adjust' | 'waste';
    quantityDelta: number;
    quantityAfter: number;
    reason?: string | null;
    userId?: string | null;
    itemLabel?: string | null;
    memo?: string | null;
    refType?: string | null;
    refId?: string | null;
  }): Promise<InventoryLog> {
    const log = this.inventoryLogRepository.create(data);
    return this.inventoryLogRepository.save(log);
  }

  async 재고_변경_이력을_조회한다(
    inventoryItemId: string,
    options?: { from?: Date; to?: Date },
  ): Promise<InventoryLog[]> {
    const where: FindOptionsWhere<InventoryLog> = { inventoryItemId };

    if (options?.from && options?.to) {
      where.createdAt = Between(options.from, options.to);
    } else if (options?.from) {
      where.createdAt = MoreThanOrEqual(options.from);
    } else if (options?.to) {
      where.createdAt = LessThanOrEqual(options.to);
    }

    return this.inventoryLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}
