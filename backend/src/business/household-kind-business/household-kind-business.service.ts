import { Injectable } from '@nestjs/common';
import { HouseholdKindContextService } from '../../context/household-kind-context/household-kind-context.service';
import {
  KindDefinitionResult,
  SaveKindDefinitionsData,
} from '../../context/household-kind-context/interfaces/household-kind-context.interface';

@Injectable()
export class HouseholdKindBusinessService {
  constructor(
    private readonly kindContextService: HouseholdKindContextService,
  ) {}

  async 유형_목록을_조회한다(
    userId: string,
  ): Promise<KindDefinitionResult[]> {
    return this.kindContextService.유형_목록을_조회한다(userId);
  }

  async 유형_목록을_일괄_저장한다(
    data: SaveKindDefinitionsData,
  ): Promise<KindDefinitionResult[]> {
    return this.kindContextService.유형_목록을_일괄_저장한다(data);
  }
}
