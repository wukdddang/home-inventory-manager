import { Module } from '@nestjs/common';
import { CategoryBusinessModule } from '../../business/category-business/category-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { CategoryController } from './category.controller';

@Module({
  imports: [CategoryBusinessModule, HouseholdMemberModule],
  controllers: [CategoryController],
})
export class CategoryInterfaceModule {}
