import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './unit.entity';

@Injectable()
export class UnitService {
    constructor(
        @InjectRepository(Unit)
        private readonly unitRepository: Repository<Unit>,
    ) {}

    async 단위_목록을_조회한다(householdId: string): Promise<Unit[]> {
        return this.unitRepository.find({
            where: { householdId },
            order: { sortOrder: 'ASC', createdAt: 'ASC' },
        });
    }

    async 단위를_단건_조회한다(
        id: string,
        householdId: string,
    ): Promise<Unit | null> {
        return this.unitRepository.findOne({
            where: { id, householdId },
        });
    }

    async 단위를_생성한다(data: {
        householdId: string;
        symbol: string;
        name?: string | null;
        sortOrder?: number;
    }): Promise<Unit> {
        const unit = this.unitRepository.create(data);
        return this.unitRepository.save(unit);
    }

    async 단위를_수정한다(
        id: string,
        householdId: string,
        data: { symbol?: string; name?: string | null; sortOrder?: number },
    ): Promise<Unit | null> {
        const unit = await this.단위를_단건_조회한다(id, householdId);
        if (!unit) return null;

        Object.assign(unit, data);
        return this.unitRepository.save(unit);
    }

    async 단위를_삭제한다(
        id: string,
        householdId: string,
    ): Promise<boolean> {
        const result = await this.unitRepository.delete({ id, householdId });
        return (result.affected ?? 0) > 0;
    }

    async 다른_거점에서_단위를_복사한다(
        sourceHouseholdId: string,
        targetHouseholdId: string,
    ): Promise<Unit[]> {
        const sourceUnits =
            await this.단위_목록을_조회한다(sourceHouseholdId);

        const copies = sourceUnits.map((unit) =>
            this.unitRepository.create({
                householdId: targetHouseholdId,
                symbol: unit.symbol,
                name: unit.name,
                sortOrder: unit.sortOrder,
            }),
        );

        return this.unitRepository.save(copies);
    }
}
