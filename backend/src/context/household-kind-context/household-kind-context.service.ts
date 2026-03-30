import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  KindDefinitionResult,
  SaveKindDefinitionsData,
} from './interfaces/household-kind-context.interface';
import { GetKindDefinitionListQuery } from './handlers/queries/get-kind-definition-list.handler';
import { SaveKindDefinitionsCommand } from './handlers/commands/save-kind-definitions.handler';
import { SeedKindDefinitionsCommand } from './handlers/commands/seed-kind-definitions.handler';

@Injectable()
export class HouseholdKindContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 유형_목록을_조회한다(
    userId: string,
  ): Promise<KindDefinitionResult[]> {
    return this.queryBus.execute(new GetKindDefinitionListQuery(userId));
  }

  async 유형_목록을_일괄_저장한다(
    data: SaveKindDefinitionsData,
  ): Promise<KindDefinitionResult[]> {
    return this.commandBus.execute(
      new SaveKindDefinitionsCommand(data.userId, data.items),
    );
  }

  async 기본_유형을_시드한다(userId: string): Promise<void> {
    return this.commandBus.execute(new SeedKindDefinitionsCommand(userId));
  }
}
