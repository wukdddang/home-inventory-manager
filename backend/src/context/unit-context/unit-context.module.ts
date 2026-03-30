import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UnitModule } from '../../domain/unit/unit.module';
import { UnitContextService } from './unit-context.service';
import { CreateUnitHandler } from './handlers/commands/create-unit.handler';
import { UpdateUnitHandler } from './handlers/commands/update-unit.handler';
import { DeleteUnitHandler } from './handlers/commands/delete-unit.handler';
import { CopyUnitsHandler } from './handlers/commands/copy-units.handler';
import { GetUnitListHandler } from './handlers/queries/get-unit-list.handler';
import { GetUnitDetailHandler } from './handlers/queries/get-unit-detail.handler';

const CommandHandlers = [
    CreateUnitHandler,
    UpdateUnitHandler,
    DeleteUnitHandler,
    CopyUnitsHandler,
];

const QueryHandlers = [GetUnitListHandler, GetUnitDetailHandler];

@Module({
    imports: [CqrsModule, UnitModule],
    providers: [UnitContextService, ...CommandHandlers, ...QueryHandlers],
    exports: [UnitContextService],
})
export class UnitContextModule {}
