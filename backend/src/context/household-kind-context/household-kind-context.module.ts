import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HouseholdKindDefinitionModule } from '../../domain/household-kind-definition/household-kind-definition.module';
import { HouseholdKindContextService } from './household-kind-context.service';
import { GetKindDefinitionListHandler } from './handlers/queries/get-kind-definition-list.handler';
import { SaveKindDefinitionsHandler } from './handlers/commands/save-kind-definitions.handler';
import { SeedKindDefinitionsHandler } from './handlers/commands/seed-kind-definitions.handler';

const CommandHandlers = [SaveKindDefinitionsHandler, SeedKindDefinitionsHandler];
const QueryHandlers = [GetKindDefinitionListHandler];

@Module({
  imports: [CqrsModule, HouseholdKindDefinitionModule],
  providers: [
    HouseholdKindContextService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [HouseholdKindContextService],
})
export class HouseholdKindContextModule {}
