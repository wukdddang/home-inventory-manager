import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { UnitBusinessService } from '../../business/unit-business/unit-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { CopyUnitsDto } from './dto/copy-units.dto';

@Controller('households/:householdId/units')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class UnitController {
    constructor(
        private readonly unitBusinessService: UnitBusinessService,
    ) {}

    @Get()
    async 단위_목록을_조회한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
    ) {
        return this.unitBusinessService.단위_목록을_조회한다(householdId);
    }

    @Get(':id')
    async 단위를_단건_조회한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.unitBusinessService.단위를_단건_조회한다(id, householdId);
    }

    @Post()
    async 단위를_생성한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Body() dto: CreateUnitDto,
    ) {
        return this.unitBusinessService.단위를_생성한다({
            householdId,
            symbol: dto.symbol,
            name: dto.name,
            sortOrder: dto.sortOrder,
        });
    }

    @Put(':id')
    async 단위를_수정한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUnitDto,
    ) {
        return this.unitBusinessService.단위를_수정한다(id, householdId, {
            symbol: dto.symbol,
            name: dto.name,
            sortOrder: dto.sortOrder,
        });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async 단위를_삭제한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        await this.unitBusinessService.단위를_삭제한다(id, householdId);
    }

    @Post('copy')
    async 다른_거점에서_단위를_가져온다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Body() dto: CopyUnitsDto,
    ) {
        return this.unitBusinessService.다른_거점에서_단위를_가져온다(
            dto.sourceHouseholdId,
            householdId,
        );
    }
}
