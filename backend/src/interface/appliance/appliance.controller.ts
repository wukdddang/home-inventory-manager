import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApplianceBusinessService } from '../../business/appliance-business/appliance-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import {
    CurrentUser,
    CurrentUserPayload,
} from '../../common/auth/decorators/current-user.decorator';
import { CreateApplianceDto } from './dto/create-appliance.dto';
import { UpdateApplianceDto } from './dto/update-appliance.dto';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from './dto/update-maintenance-schedule.dto';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';

@Controller('households/:householdId/appliances')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class ApplianceController {
    constructor(
        private readonly applianceBusinessService: ApplianceBusinessService,
    ) {}

    // ── Appliance CRUD ──

    @Post()
    async 가전을_등록한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Body() dto: CreateApplianceDto,
        @CurrentUser() user: CurrentUserPayload,
    ) {
        return this.applianceBusinessService.가전을_생성한다({
            householdId,
            userId: user.userId,
            roomId: dto.roomId ?? null,
            name: dto.name,
            brand: dto.brand ?? null,
            modelName: dto.modelName ?? null,
            serialNumber: dto.serialNumber ?? null,
            purchasedAt: dto.purchasedAt ?? null,
            purchasePrice: dto.purchasePrice ?? null,
            warrantyExpiresAt: dto.warrantyExpiresAt ?? null,
            manualUrl: dto.manualUrl ?? null,
            memo: dto.memo ?? null,
        });
    }

    @Get()
    async 가전_목록을_조회한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Query('status') status?: 'active' | 'retired',
    ) {
        return this.applianceBusinessService.가전_목록을_조회한다(
            householdId,
            status,
        );
    }

    @Get(':appId')
    async 가전을_단건_조회한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('appId', ParseUUIDPipe) appId: string,
    ) {
        return this.applianceBusinessService.가전을_단건_조회한다(
            appId,
            householdId,
        );
    }

    @Put(':appId')
    async 가전을_수정한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('appId', ParseUUIDPipe) appId: string,
        @Body() dto: UpdateApplianceDto,
    ) {
        return this.applianceBusinessService.가전을_수정한다(
            appId,
            householdId,
            dto,
        );
    }

    @Patch(':appId/retire')
    async 가전을_폐기한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('appId', ParseUUIDPipe) appId: string,
    ) {
        return this.applianceBusinessService.가전을_폐기한다(appId, householdId);
    }

    // ── MaintenanceSchedule ──

    @Post(':appId/maintenance-schedules')
    async 유지보수_스케줄을_등록한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('appId', ParseUUIDPipe) appId: string,
        @Body() dto: CreateMaintenanceScheduleDto,
    ) {
        return this.applianceBusinessService.유지보수_스케줄을_생성한다(
            householdId,
            {
                applianceId: appId,
                taskName: dto.taskName,
                description: dto.description ?? null,
                recurrenceRule: dto.recurrenceRule,
                nextOccurrenceAt: dto.nextOccurrenceAt,
            },
        );
    }

    @Get(':appId/maintenance-schedules')
    async 유지보수_스케줄_목록을_조회한다(
        @Param('appId', ParseUUIDPipe) appId: string,
    ) {
        return this.applianceBusinessService.유지보수_스케줄_목록을_조회한다(appId);
    }

    @Put(':appId/maintenance-schedules/:schedId')
    async 유지보수_스케줄을_수정한다(
        @Param('appId', ParseUUIDPipe) appId: string,
        @Param('schedId', ParseUUIDPipe) schedId: string,
        @Body() dto: UpdateMaintenanceScheduleDto,
    ) {
        return this.applianceBusinessService.유지보수_스케줄을_수정한다(
            schedId,
            appId,
            dto,
        );
    }

    @Patch(':appId/maintenance-schedules/:schedId/deactivate')
    @HttpCode(HttpStatus.OK)
    async 유지보수_스케줄을_비활성화한다(
        @Param('appId', ParseUUIDPipe) appId: string,
        @Param('schedId', ParseUUIDPipe) schedId: string,
    ) {
        return this.applianceBusinessService.유지보수_스케줄을_비활성화한다(
            schedId,
            appId,
        );
    }

    // ── MaintenanceLog ──

    @Post(':appId/maintenance-logs')
    async 유지보수_이력을_등록한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('appId', ParseUUIDPipe) appId: string,
        @Body() dto: CreateMaintenanceLogDto,
    ) {
        return this.applianceBusinessService.유지보수_이력을_생성한다(
            householdId,
            {
                applianceId: appId,
                maintenanceScheduleId: dto.maintenanceScheduleId ?? null,
                type: dto.type,
                description: dto.description,
                householdMemberId: dto.householdMemberId ?? null,
                servicedBy: dto.servicedBy ?? null,
                cost: dto.cost ?? null,
                performedAt: dto.performedAt,
                memo: dto.memo ?? null,
            },
        );
    }

    @Get(':appId/maintenance-logs')
    async 유지보수_이력_목록을_조회한다(
        @Param('appId', ParseUUIDPipe) appId: string,
        @Query('type') type?: string,
    ) {
        return this.applianceBusinessService.유지보수_이력_목록을_조회한다(
            appId,
            type,
        );
    }
}
