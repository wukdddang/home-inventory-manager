import { Injectable } from '@nestjs/common';
import { UnitContextService } from '../../context/unit-context/unit-context.service';
import {
    UnitResult,
    CreateUnitData,
    UpdateUnitData,
} from '../../context/unit-context/interfaces/unit-context.interface';

@Injectable()
export class UnitBusinessService {
    constructor(
        private readonly unitContextService: UnitContextService,
    ) {}

    async 단위_목록을_조회한다(
        householdId: string,
    ): Promise<UnitResult[]> {
        return this.unitContextService.단위_목록을_조회한다(householdId);
    }

    async 단위를_단건_조회한다(
        id: string,
        householdId: string,
    ): Promise<UnitResult> {
        return this.unitContextService.단위를_단건_조회한다(id, householdId);
    }

    async 단위를_생성한다(data: CreateUnitData): Promise<UnitResult> {
        return this.unitContextService.단위를_생성한다(data);
    }

    async 단위를_수정한다(
        id: string,
        householdId: string,
        data: UpdateUnitData,
    ): Promise<UnitResult> {
        return this.unitContextService.단위를_수정한다(id, householdId, data);
    }

    async 단위를_삭제한다(
        id: string,
        householdId: string,
    ): Promise<void> {
        return this.unitContextService.단위를_삭제한다(id, householdId);
    }

    async 다른_거점에서_단위를_가져온다(
        sourceHouseholdId: string,
        targetHouseholdId: string,
    ): Promise<UnitResult[]> {
        return this.unitContextService.다른_거점에서_단위를_가져온다(
            sourceHouseholdId,
            targetHouseholdId,
        );
    }
}
