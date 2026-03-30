import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdKindDefinition } from './household-kind-definition.entity';
import { HouseholdKindDefinitionService } from './household-kind-definition.service';

@Module({
  imports: [TypeOrmModule.forFeature([HouseholdKindDefinition])],
  providers: [HouseholdKindDefinitionService],
  exports: [HouseholdKindDefinitionService],
})
export class HouseholdKindDefinitionModule {}
