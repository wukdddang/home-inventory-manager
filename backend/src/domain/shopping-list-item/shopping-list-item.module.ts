import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingListItem } from './shopping-list-item.entity';
import { ShoppingListItemService } from './shopping-list-item.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingListItem])],
  providers: [ShoppingListItemService],
  exports: [ShoppingListItemService],
})
export class ShoppingListItemModule {}
