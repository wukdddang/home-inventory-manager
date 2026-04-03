import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SpaceBusinessService } from '../../business/space-business/space-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { SaveHouseStructureDto } from './dto/save-house-structure.dto';
import { SyncRoomsDto } from './dto/sync-rooms.dto';
import { CreateFurniturePlacementDto } from './dto/create-furniture-placement.dto';
import { UpdateFurniturePlacementDto } from './dto/update-furniture-placement.dto';
import { CreateStorageLocationDto } from './dto/create-storage-location.dto';
import { UpdateStorageLocationDto } from './dto/update-storage-location.dto';

@Controller('households/:householdId')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class SpaceController {
  constructor(private readonly spaceBusinessService: SpaceBusinessService) {}

  // ── 집 구조 ──

  @Get('house-structure')
  async 집_구조를_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    const structure =
      await this.spaceBusinessService.집_구조를_조회한다(householdId);
    if (!structure) {
      return {
        id: null,
        householdId,
        name: 'default',
        structurePayload: { rooms: {} },
        diagramLayout: null,
        version: 0,
      };
    }
    return structure;
  }

  @Put('house-structure')
  async 집_구조를_저장한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: SaveHouseStructureDto,
  ) {
    return this.spaceBusinessService.집_구조를_저장한다({
      householdId,
      name: dto.name,
      structurePayload: dto.structurePayload,
      diagramLayout: dto.diagramLayout,
    });
  }

  // ── 방 ──

  @Get('rooms')
  async 방_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    const structure =
      await this.spaceBusinessService.집_구조를_조회한다(householdId);
    if (!structure) return [];
    return this.spaceBusinessService.방_목록을_조회한다(structure.id);
  }

  @Put('rooms/sync')
  async 방을_동기화한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: SyncRoomsDto,
  ) {
    const structure =
      await this.spaceBusinessService.집_구조를_조회한다(householdId);
    if (!structure) {
      throw new NotFoundException('집 구조가 등록되지 않았습니다');
    }
    return this.spaceBusinessService.방을_동기화한다({
      houseStructureId: structure.id,
      rooms: dto.rooms,
    });
  }

  // ── 가구 배치 ──

  @Get('rooms/:roomId/furniture-placements')
  async 가구_목록을_조회한다(
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ) {
    return this.spaceBusinessService.가구_목록을_조회한다(roomId);
  }

  @Post('rooms/:roomId/furniture-placements')
  async 가구를_생성한다(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: CreateFurniturePlacementDto,
  ) {
    return this.spaceBusinessService.가구를_생성한다({
      roomId,
      ...dto,
    });
  }

  @Put('furniture-placements/:id')
  async 가구를_수정한다(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFurniturePlacementDto,
  ) {
    return this.spaceBusinessService.가구를_수정한다(id, dto);
  }

  @Delete('furniture-placements/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 가구를_삭제한다(@Param('id', ParseUUIDPipe) id: string) {
    await this.spaceBusinessService.가구를_삭제한다(id);
  }

  // ── 보관 장소 ──

  @Get('storage-locations')
  async 보관장소_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.spaceBusinessService.보관장소_목록을_조회한다(householdId);
  }

  @Post('storage-locations')
  async 보관장소를_생성한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreateStorageLocationDto,
  ) {
    return this.spaceBusinessService.보관장소를_생성한다({
      householdId,
      ...dto,
    });
  }

  @Put('storage-locations/:id')
  async 보관장소를_수정한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStorageLocationDto,
  ) {
    return this.spaceBusinessService.보관장소를_수정한다(
      id,
      householdId,
      dto,
    );
  }

  @Delete('storage-locations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 보관장소를_삭제한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.spaceBusinessService.보관장소를_삭제한다(id, householdId);
  }
}
