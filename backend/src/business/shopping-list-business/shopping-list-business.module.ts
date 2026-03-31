import { Module } from '@nestjs/common';
import { ShoppingListContextModule } from '../../context/shopping-list-context/shopping-list-context.module';
import { ShoppingListBusinessService } from './shopping-list-business.service';

@Module({
  imports: [ShoppingListContextModule],
  providers: [ShoppingListBusinessService],
  exports: [ShoppingListBusinessService],
})
export class ShoppingListBusinessModule {}
