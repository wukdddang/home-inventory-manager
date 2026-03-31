import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Not, IsNull, Repository } from 'typeorm';
import { PurchaseBatch } from './purchase-batch.entity';

@Injectable()
export class PurchaseBatchService {
  constructor(
    @InjectRepository(PurchaseBatch)
    private readonly purchaseBatchRepository: Repository<PurchaseBatch>,
  ) {}

  async 로트_목록을_조회한다(purchaseId: string): Promise<PurchaseBatch[]> {
    return this.purchaseBatchRepository.find({
      where: { purchaseId },
      order: { expirationDate: 'ASC' },
    });
  }

  async 거점의_로트_목록을_조회한다(
    householdId: string,
  ): Promise<PurchaseBatch[]> {
    return this.purchaseBatchRepository.find({
      where: {
        purchase: { householdId },
        expirationDate: Not(IsNull()),
      },
      relations: ['purchase'],
      order: { expirationDate: 'ASC' },
    });
  }

  async 유통기한_임박_목록을_조회한다(
    householdId: string,
    daysBeforeExpiration: number,
  ): Promise<PurchaseBatch[]> {
    const today = new Date();
    const threshold = new Date();
    threshold.setDate(today.getDate() + daysBeforeExpiration);

    const todayStr = today.toISOString().split('T')[0];
    const thresholdStr = threshold.toISOString().split('T')[0];

    return this.purchaseBatchRepository.find({
      where: {
        purchase: { householdId },
        expirationDate: MoreThan(todayStr) as any,
      },
      relations: ['purchase'],
      order: { expirationDate: 'ASC' },
    }).then((batches) =>
      batches.filter((b) => b.expirationDate && b.expirationDate <= thresholdStr),
    );
  }

  async 만료된_목록을_조회한다(
    householdId: string,
  ): Promise<PurchaseBatch[]> {
    const todayStr = new Date().toISOString().split('T')[0];

    return this.purchaseBatchRepository.find({
      where: {
        purchase: { householdId },
        expirationDate: LessThanOrEqual(todayStr) as any,
      },
      relations: ['purchase'],
      order: { expirationDate: 'ASC' },
    });
  }

  async 로트를_일괄_생성한다(
    batches: {
      purchaseId: string;
      quantity: number;
      expirationDate?: string | null;
    }[],
  ): Promise<PurchaseBatch[]> {
    const entities = this.purchaseBatchRepository.create(batches);
    return this.purchaseBatchRepository.save(entities);
  }
}
