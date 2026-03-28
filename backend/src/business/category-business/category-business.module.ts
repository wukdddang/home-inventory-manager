import { Module } from '@nestjs/common';
import { CategoryContextModule } from '../../context/category-context/category-context.module';
import { CategoryBusinessService } from './category-business.service';

@Module({
  imports: [CategoryContextModule],
  providers: [CategoryBusinessService],
  exports: [CategoryBusinessService],
})
export class CategoryBusinessModule {}
