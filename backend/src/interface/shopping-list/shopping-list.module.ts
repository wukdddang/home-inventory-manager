import { Module } from '@nestjs/common';
import { ShoppingListBusinessModule } from '../../business/shopping-list-business/shopping-list-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { ShoppingListController } from './shopping-list.controller';

@Module({
  imports: [ShoppingListBusinessModule, HouseholdMemberModule],
  controllers: [ShoppingListController],
})
export class ShoppingListInterfaceModule {}
